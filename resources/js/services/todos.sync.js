import { createCollection } from '@tanstack/db';
import { electricCollectionOptions } from '@tanstack/electric-db-collection';
import { getElectricShapeUrl } from './electric.api';
import { requireTxid, awaitTxidReconciliation } from './electric.txid';
import { isRecoverableNetworkError } from './network.errors';
import { readPendingTodoMutations, writePendingTodoMutations } from './pglite.todo.repository';
import { mergePendingMutationQueue } from './sync.mutation-queue';
import { registerOnlineQueueFlush } from './sync.online';
import { buildOutboxId } from './sync.outbox';
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
    const nextQueue = mergePendingMutationQueue(current, nextMutation);

    if (nextQueue === current) {
        return;
    }

    await writePendingMutations(nextQueue);
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

function resolveErrorMessage(error) {
    return error instanceof Error ? error.message : '';
}

function emitMutationLifecycle({ outboxId, type, todoId, title, status, error = '' }) {
    const event = {
        id: outboxId,
        type,
        todoId,
        title,
        status,
    };

    if (typeof error === 'string' && error.length > 0) {
        event.error = error;
    }

    emitOutboxLifecycle(event);
}

async function executeTodoMutation(type, id, payload) {
    if (type === 'insert') {
        return createTodo(payload ?? {});
    }

    if (type === 'update') {
        return updateTodo(id, payload ?? {});
    }

    return deleteTodo(id);
}

async function runPendingMutation(mutation) {
    const todoId = String(mutation.id);
    const outboxId = mutation.outboxId ?? buildOutboxId(mutation.type, todoId);
    const title = resolveMutationTitle(mutation);

    emitMutationLifecycle({ outboxId, type: mutation.type, todoId, title, status: 'sending' });

    try {
        const response = await executeTodoMutation(mutation.type, mutation.id, mutation.payload);
        await reconcileTxid(requireTxid(response, mutation.type, 'todos'));
        emitMutationLifecycle({ outboxId, type: mutation.type, todoId, title, status: 'synced' });
    } catch (error) {
        emitMutationLifecycle({
            outboxId,
            type: mutation.type,
            todoId,
            title,
            status: isRecoverableNetworkError(error) ? 'queued' : 'failed',
            error: resolveErrorMessage(error),
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

async function sendCollectionMutation({
    type,
    todoId,
    title,
    request,
    payload,
}) {
    const outboxId = buildOutboxId(type, todoId);
    emitMutationLifecycle({ outboxId, type, todoId, title, status: 'sending' });

    try {
        const response = await request();
        return { txid: requireTxid(response, type, 'todos') };
    } catch (error) {
        if (!isRecoverableNetworkError(error)) {
            emitMutationLifecycle({
                outboxId,
                type,
                todoId,
                title,
                status: 'failed',
                error: resolveErrorMessage(error),
            });
            throw error;
        }

        emitMutationLifecycle({ outboxId, type, todoId, title, status: 'queued' });
        await queuePendingMutation({
            type,
            id: todoId,
            ...(payload === undefined ? {} : { payload }),
            outboxId,
        });
        return undefined;
    }
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
            const title = typeof mutation.modified.title === 'string' ? mutation.modified.title : '';

            return sendCollectionMutation({
                type: 'insert',
                todoId,
                title,
                payload: mutation.modified,
                request: () => createTodo(mutation.modified),
            });
        },
        onUpdate: async ({ transaction }) => {
            const mutation = transaction.mutations[0];

            if (!mutation) {
                return;
            }

            const todoId = String(mutation.original.id);
            const title = typeof mutation.changes?.title === 'string' ? mutation.changes.title : '';

            return sendCollectionMutation({
                type: 'update',
                todoId,
                title,
                payload: mutation.changes,
                request: () => updateTodo(mutation.original.id, mutation.changes),
            });
        },
        onDelete: async ({ transaction }) => {
            const mutation = transaction.mutations[0];

            if (!mutation) {
                return;
            }

            const todoId = String(mutation.original.id);
            return sendCollectionMutation({
                type: 'delete',
                todoId,
                title: '',
                request: () => deleteTodo(mutation.original.id),
            });
        },
    }),
);

registerOnlineQueueFlush(flushPendingTodoMutations);
