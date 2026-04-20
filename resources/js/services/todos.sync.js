import { createCollection } from '@tanstack/db';
import { electricCollectionOptions } from '@tanstack/electric-db-collection';
import { getElectricShapeUrl } from './electric.api';
import { requireTxid, awaitTxidReconciliation } from './electric.txid';
import { isRecoverableNetworkError } from './network.errors';
import { readPendingTodoMutations, writePendingTodoMutations } from './pglite.todo.repository';
import { createSingleFlightQueueFlusher } from './sync.queue';
import { createTodo, deleteTodo, updateTodo } from './todos.api';

/**
 * @typedef {{
 *   type: 'insert' | 'update' | 'delete',
 *   id: string,
 *   payload?: Record<string, unknown>,
 *   outboxId?: string,
 * }} PendingTodoMutation
 */

/** @type {(event: Record<string, unknown>) => void | null} */
let outboxLifecycleReporter = null;

function buildOutboxId(type, todoId) {
    return `${type}:${todoId}`;
}

function emitOutboxLifecycle(event) {
    if (typeof outboxLifecycleReporter !== 'function') {
        return;
    }

    outboxLifecycleReporter(event);
}

function resolveMutationTitle(mutation) {
    if (!mutation || typeof mutation !== 'object') {
        return '';
    }

    const title = mutation.payload?.title;

    return typeof title === 'string' ? title : '';
}

async function readPendingMutations() {
    const pendingMutations = await readPendingTodoMutations();

    return pendingMutations.filter((mutation) => {
        return mutation && typeof mutation.id === 'string' && typeof mutation.type === 'string';
    });
}

function writePendingMutations(mutations) {
    return writePendingTodoMutations(mutations);
}

async function queuePendingMutation(nextMutation) {
    const current = await readPendingMutations();
    const existingIndex = current.findIndex((mutation) => mutation.id === nextMutation.id);

    if (existingIndex === -1) {
        current.push(nextMutation);
        await writePendingMutations(current);
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

    await writePendingMutations(current);
}

export function setTodoOutboxLifecycleReporter(reporter) {
    outboxLifecycleReporter = typeof reporter === 'function' ? reporter : null;
}

export async function readPendingOutboxEntries() {
    const queue = await readPendingMutations();

    return queue.map((mutation) => {
        const todoId = String(mutation.id);

        return {
            id: mutation.outboxId ?? buildOutboxId(mutation.type, todoId),
            type: mutation.type,
            todoId,
            title: resolveMutationTitle(mutation),
            status: 'queued',
        };
    });
}

async function reconcileTxid(txid) {
    await awaitTxidReconciliation((targetTxid, timeoutMs) => todosCollection.utils.awaitTxId(targetTxid, timeoutMs), txid, 15000);
}

async function runPendingMutation(mutation) {
    const todoId = String(mutation.id);
    const outboxId = mutation.outboxId ?? buildOutboxId(mutation.type, todoId);
    const title = resolveMutationTitle(mutation);

    emitOutboxLifecycle({
        id: outboxId,
        type: mutation.type,
        todoId,
        title,
        status: 'sending',
    });

    if (mutation.type === 'insert') {
        try {
            const response = await createTodo(mutation.payload ?? {});
            await reconcileTxid(requireTxid(response, 'insert', 'todos'));
            emitOutboxLifecycle({
                id: outboxId,
                type: mutation.type,
                todoId,
                title,
                status: 'synced',
            });
        } catch (error) {
            emitOutboxLifecycle({
                id: outboxId,
                type: mutation.type,
                todoId,
                title,
                status: isRecoverableNetworkError(error) ? 'queued' : 'failed',
                error: error instanceof Error ? error.message : null,
            });

            throw error;
        }

        return;
    }

    if (mutation.type === 'update') {
        try {
            const response = await updateTodo(mutation.id, mutation.payload ?? {});
            await reconcileTxid(requireTxid(response, 'update', 'todos'));
            emitOutboxLifecycle({
                id: outboxId,
                type: mutation.type,
                todoId,
                title,
                status: 'synced',
            });
        } catch (error) {
            emitOutboxLifecycle({
                id: outboxId,
                type: mutation.type,
                todoId,
                title,
                status: isRecoverableNetworkError(error) ? 'queued' : 'failed',
                error: error instanceof Error ? error.message : null,
            });

            throw error;
        }

        return;
    }

    try {
        const response = await deleteTodo(mutation.id);
        await reconcileTxid(requireTxid(response, 'delete', 'todos'));
        emitOutboxLifecycle({
            id: outboxId,
            type: mutation.type,
            todoId,
            title,
            status: 'synced',
        });
    } catch (error) {
        emitOutboxLifecycle({
            id: outboxId,
            type: mutation.type,
            todoId,
            title,
            status: isRecoverableNetworkError(error) ? 'queued' : 'failed',
            error: error instanceof Error ? error.message : null,
        });

        throw error;
    }
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

            const todoId = String(mutation.modified.id);
            const outboxId = buildOutboxId('insert', todoId);

            emitOutboxLifecycle({
                id: outboxId,
                type: 'insert',
                todoId,
                title: typeof mutation.modified.title === 'string' ? mutation.modified.title : '',
                status: 'sending',
            });

            try {
                const response = await createTodo(mutation.modified);

                return { txid: requireTxid(response, 'insert', 'todos') };
            } catch (error) {
                if (!isRecoverableNetworkError(error)) {
                    emitOutboxLifecycle({
                        id: outboxId,
                        type: 'insert',
                        todoId,
                        title: typeof mutation.modified.title === 'string' ? mutation.modified.title : '',
                        status: 'failed',
                        error: error instanceof Error ? error.message : null,
                    });

                    throw error;
                }

                emitOutboxLifecycle({
                    id: outboxId,
                    type: 'insert',
                    todoId,
                    title: typeof mutation.modified.title === 'string' ? mutation.modified.title : '',
                    status: 'queued',
                });

                await queuePendingMutation({
                    type: 'insert',
                    id: todoId,
                    payload: mutation.modified,
                    outboxId,
                });
            }
        },
        onUpdate: async ({ transaction }) => {
            const mutation = transaction.mutations[0];

            if (!mutation) {
                return;
            }

            const todoId = String(mutation.original.id);
            const outboxId = buildOutboxId('update', todoId);

            emitOutboxLifecycle({
                id: outboxId,
                type: 'update',
                todoId,
                title: typeof mutation.changes?.title === 'string' ? mutation.changes.title : '',
                status: 'sending',
            });

            try {
                const response = await updateTodo(mutation.original.id, mutation.changes);

                return { txid: requireTxid(response, 'update', 'todos') };
            } catch (error) {
                if (!isRecoverableNetworkError(error)) {
                    emitOutboxLifecycle({
                        id: outboxId,
                        type: 'update',
                        todoId,
                        title: typeof mutation.changes?.title === 'string' ? mutation.changes.title : '',
                        status: 'failed',
                        error: error instanceof Error ? error.message : null,
                    });

                    throw error;
                }

                emitOutboxLifecycle({
                    id: outboxId,
                    type: 'update',
                    todoId,
                    title: typeof mutation.changes?.title === 'string' ? mutation.changes.title : '',
                    status: 'queued',
                });

                await queuePendingMutation({
                    type: 'update',
                    id: todoId,
                    payload: mutation.changes,
                    outboxId,
                });
            }
        },
        onDelete: async ({ transaction }) => {
            const mutation = transaction.mutations[0];

            if (!mutation) {
                return;
            }

            const todoId = String(mutation.original.id);
            const outboxId = buildOutboxId('delete', todoId);

            emitOutboxLifecycle({
                id: outboxId,
                type: 'delete',
                todoId,
                title: '',
                status: 'sending',
            });

            try {
                const response = await deleteTodo(mutation.original.id);

                return { txid: requireTxid(response, 'delete', 'todos') };
            } catch (error) {
                if (!isRecoverableNetworkError(error)) {
                    emitOutboxLifecycle({
                        id: outboxId,
                        type: 'delete',
                        todoId,
                        title: '',
                        status: 'failed',
                        error: error instanceof Error ? error.message : null,
                    });

                    throw error;
                }

                emitOutboxLifecycle({
                    id: outboxId,
                    type: 'delete',
                    todoId,
                    title: '',
                    status: 'queued',
                });

                await queuePendingMutation({
                    type: 'delete',
                    id: todoId,
                    outboxId,
                });
            }
        },
    }),
);

setupPendingMutationFlush();
