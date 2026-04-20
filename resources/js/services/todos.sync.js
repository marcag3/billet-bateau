import { createCollection } from '@tanstack/db';
import { electricCollectionOptions } from '@tanstack/electric-db-collection';
import { getElectricShapeUrl } from './electric.api';
import { requireTxid, awaitTxidReconciliation } from './electric.txid';
import { isRecoverableNetworkError } from './network.errors';
import { createSingleFlightQueueFlusher } from './sync.queue';
import { createTodo, deleteTodo, updateTodo } from './todos.api';
import { readStorageArray, writeStorageArray } from './storage.local';

const PENDING_MUTATIONS_STORAGE_KEY = 'todos.pendingMutations.v1';

/**
 * @typedef {{
 *   type: 'insert' | 'update' | 'delete',
 *   id: string,
 *   payload?: Record<string, unknown>,
 * }} PendingTodoMutation
 */

function isPendingTodoMutation(mutation) {
    return mutation && typeof mutation.id === 'string' && typeof mutation.type === 'string';
}

function readPendingMutations() {
    return readStorageArray(PENDING_MUTATIONS_STORAGE_KEY, isPendingTodoMutation);
}

function writePendingMutations(mutations) {
    writeStorageArray(PENDING_MUTATIONS_STORAGE_KEY, mutations);
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
    await awaitTxidReconciliation((targetTxid, timeoutMs) => todosCollection.utils.awaitTxId(targetTxid, timeoutMs), txid, 15000);
}

async function runPendingMutation(mutation) {
    if (mutation.type === 'insert') {
        const response = await createTodo(mutation.payload ?? {});
        await reconcileTxid(requireTxid(response, 'insert', 'todos'));
        return;
    }

    if (mutation.type === 'update') {
        const response = await updateTodo(mutation.id, mutation.payload ?? {});
        await reconcileTxid(requireTxid(response, 'update', 'todos'));
        return;
    }

    const response = await deleteTodo(mutation.id);
    await reconcileTxid(requireTxid(response, 'delete', 'todos'));
}

export function flushPendingTodoMutations() {
    return flushPendingMutations();
}

const flushPendingMutations = createSingleFlightQueueFlusher({
    isOnline: () => typeof navigator === 'undefined' || navigator.onLine !== false,
    readQueue: readPendingMutations,
    writeQueue: writePendingMutations,
    runItem: runPendingMutation,
    isRecoverableError: isRecoverableNetworkError,
});

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

                return { txid: requireTxid(response, 'insert', 'todos') };
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

                return { txid: requireTxid(response, 'update', 'todos') };
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

                return { txid: requireTxid(response, 'delete', 'todos') };
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
