import { createCollection } from '@tanstack/db';
import { electricCollectionOptions } from '@tanstack/electric-db-collection';
import { getElectricShapeUrl } from './electric.api';
import { createTodo, deleteTodo, updateTodo } from './todos.api';

const PENDING_MUTATIONS_STORAGE_KEY = 'todos.pendingMutations.v1';

/**
 * @typedef {{
 *   type: 'insert' | 'update' | 'delete',
 *   id: string,
 *   payload?: Record<string, unknown>,
 * }} PendingTodoMutation
 */

/** @type {Promise<void> | null} */
let flushPromise = null;

function extractTxid(response, mutationType) {
    if (response?.txid === undefined || response.txid === null) {
        throw new Error(`[todos] Missing txid from ${mutationType} response.`);
    }

    const txid = Number(response.txid);

    if (!Number.isFinite(txid)) {
        throw new Error(`[todos] Invalid txid from ${mutationType} response.`);
    }

    return txid;
}

function isRecoverableNetworkError(error) {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        return true;
    }

    if (error instanceof TypeError) {
        return true;
    }

    const message = error instanceof Error ? error.message.toLowerCase() : '';

    return message.includes('networkerror') || message.includes('failed to fetch');
}

function readPendingMutations() {
    if (typeof window === 'undefined') {
        return [];
    }

    try {
        const raw = window.localStorage.getItem(PENDING_MUTATIONS_STORAGE_KEY);
        if (raw === null) {
            return [];
        }

        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
            return [];
        }

        return parsed.filter((mutation) => mutation && typeof mutation.id === 'string' && typeof mutation.type === 'string');
    } catch {
        return [];
    }
}

function writePendingMutations(mutations) {
    if (typeof window === 'undefined') {
        return;
    }

    if (mutations.length === 0) {
        window.localStorage.removeItem(PENDING_MUTATIONS_STORAGE_KEY);
        return;
    }

    window.localStorage.setItem(PENDING_MUTATIONS_STORAGE_KEY, JSON.stringify(mutations));
}

function queuePendingMutation(nextMutation) {
    const current = readPendingMutations();
    const existingIndex = current.findIndex((mutation) => mutation.id === nextMutation.id);

    if (existingIndex === -1) {
        current.push(nextMutation);
        writePendingMutations(current);
        return;
    }

    const existing = current[existingIndex];

    if (nextMutation.type === 'insert') {
        current[existingIndex] = nextMutation;
    } else if (nextMutation.type === 'update') {
        if (existing.type === 'insert') {
            current[existingIndex] = {
                ...existing,
                payload: {
                    ...existing.payload,
                    ...nextMutation.payload,
                },
            };
        } else if (existing.type === 'update') {
            current[existingIndex] = {
                ...existing,
                payload: {
                    ...existing.payload,
                    ...nextMutation.payload,
                },
            };
        } else {
            return;
        }
    } else if (nextMutation.type === 'delete') {
        if (existing.type === 'insert') {
            current.splice(existingIndex, 1);
        } else {
            current[existingIndex] = nextMutation;
        }
    }

    writePendingMutations(current);
}

async function reconcileTxid(txid) {
    try {
        await todosCollection.utils.awaitTxId(txid, 15000);
    } catch {
        // The write is durable once the API accepted it; the stream can catch up later.
    }
}

async function runPendingMutation(mutation) {
    if (mutation.type === 'insert') {
        const response = await createTodo(mutation.payload ?? {});
        await reconcileTxid(extractTxid(response, 'insert'));
        return;
    }

    if (mutation.type === 'update') {
        const response = await updateTodo(mutation.id, mutation.payload ?? {});
        await reconcileTxid(extractTxid(response, 'update'));
        return;
    }

    const response = await deleteTodo(mutation.id);
    await reconcileTxid(extractTxid(response, 'delete'));
}

export function flushPendingTodoMutations() {
    if (flushPromise !== null) {
        return flushPromise;
    }

    flushPromise = (async () => {
        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
            return;
        }

        const queue = readPendingMutations();

        if (queue.length === 0) {
            return;
        }

        const remaining = [];

        for (let index = 0; index < queue.length; index += 1) {
            const mutation = queue[index];

            try {
                await runPendingMutation(mutation);
            } catch (error) {
                if (isRecoverableNetworkError(error)) {
                    remaining.push(mutation);
                    continue;
                }

                remaining.push(mutation, ...queue.slice(index + 1));
                writePendingMutations(remaining);
                throw error;
            }
        }

        writePendingMutations(remaining);
    })().finally(() => {
        flushPromise = null;
    });

    return flushPromise;
}

function setupPendingMutationFlush() {
    if (typeof window === 'undefined') {
        return;
    }

    window.addEventListener('online', () => {
        void flushPendingTodoMutations().catch(() => {
            // Keep queued operations for a later retry.
        });
    });

    void flushPendingTodoMutations().catch(() => {
        // Keep queued operations for a later retry.
    });
}

export const todosCollection = createCollection(
    electricCollectionOptions({
        id: 'todos',
        getKey: (item) => item.id,
        shapeOptions: {
            url: getElectricShapeUrl(),
        },
        onInsert: async ({ transaction }) => {
            const mutation = transaction.mutations[0];

            if (!mutation) {
                return;
            }

            try {
                const response = await createTodo(mutation.modified);

                return { txid: extractTxid(response, 'insert') };
            } catch (error) {
                if (!isRecoverableNetworkError(error)) {
                    throw error;
                }

                queuePendingMutation({
                    type: 'insert',
                    id: String(mutation.modified.id),
                    payload: mutation.modified,
                });
            }
        },
        onUpdate: async ({ transaction }) => {
            const mutation = transaction.mutations[0];

            if (!mutation) {
                return;
            }

            try {
                const response = await updateTodo(mutation.original.id, mutation.changes);

                return { txid: extractTxid(response, 'update') };
            } catch (error) {
                if (!isRecoverableNetworkError(error)) {
                    throw error;
                }

                queuePendingMutation({
                    type: 'update',
                    id: String(mutation.original.id),
                    payload: mutation.changes,
                });
            }
        },
        onDelete: async ({ transaction }) => {
            const mutation = transaction.mutations[0];

            if (!mutation) {
                return;
            }

            try {
                const response = await deleteTodo(mutation.original.id);

                return { txid: extractTxid(response, 'delete') };
            } catch (error) {
                if (!isRecoverableNetworkError(error)) {
                    throw error;
                }

                queuePendingMutation({
                    type: 'delete',
                    id: String(mutation.original.id),
                });
            }
        },
    }),
);

setupPendingMutationFlush();
