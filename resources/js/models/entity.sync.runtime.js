import { createCollection } from '@tanstack/db';
import { electricCollectionOptions } from '@tanstack/electric-db-collection';
import { awaitTxidReconciliation, requireTxid } from '../services/electric.txid';
import { isRecoverableNetworkError } from '../services/network.errors';
import { mergePendingMutationQueue } from '../services/sync.mutation-queue';
import { registerOnlineQueueFlush } from '../services/sync.online';
import { buildOutboxId } from '../services/sync.outbox';
import { createSingleFlightQueueFlusher } from '../services/sync.queue';
import { SYNC_STATUS } from './sync.status';

function toStringId(value) {
    return String(value ?? '');
}

function resolveShapeUrl(shapeUrl) {
    return typeof shapeUrl === 'function' ? shapeUrl() : shapeUrl;
}

function resolveMutationTitle(modelDefinition, payload) {
    if (typeof modelDefinition.titleFromPayload !== 'function') {
        return '';
    }

    return modelDefinition.titleFromPayload(payload ?? {});
}

function createMutationEventEmitter() {
    /** @type {(event: Record<string, unknown>) => void | null} */
    let reporter = null;

    return {
        setReporter(nextReporter) {
            reporter = typeof nextReporter === 'function' ? nextReporter : null;
        },
        emit(event) {
            if (typeof reporter !== 'function') {
                return;
            }

            reporter(event);
        },
    };
}

function createMutationPayload(type, mutation) {
    if (type === 'insert') {
        return mutation.modified;
    }

    if (type === 'update') {
        return mutation.changes ?? {};
    }

    return undefined;
}

function resolveMutationId(type, mutation, idKey) {
    if (type === 'insert') {
        return toStringId(mutation.modified?.[idKey]);
    }

    return toStringId(mutation.original?.[idKey]);
}

async function maybeReconcileTxid(collection, txid) {
    await awaitTxidReconciliation(
        (targetTxid, timeoutMs) => collection.utils.awaitTxId(targetTxid, timeoutMs),
        txid,
        15000,
    );
}

export function createEntitySyncRuntime({ modelDefinition, queueRepository }) {
    const idKey = modelDefinition.idKey ?? 'id';
    const events = createMutationEventEmitter();

    const collection = createCollection(
        electricCollectionOptions({
            id: modelDefinition.collectionId,
            getKey: (item) => item[idKey],
            shapeOptions: {
                url: resolveShapeUrl(modelDefinition.shapeUrl),
            },
            onInsert: async ({ transaction }) => {
                const mutation = transaction.mutations[0];
                if (!mutation) {
                    return;
                }

                return sendCollectionMutation({
                    type: 'insert',
                    mutation,
                    request: (id, payload) => modelDefinition.api.create(payload ?? {}),
                });
            },
            onUpdate: async ({ transaction }) => {
                const mutation = transaction.mutations[0];
                if (!mutation) {
                    return;
                }

                return sendCollectionMutation({
                    type: 'update',
                    mutation,
                    request: (id, payload) => modelDefinition.api.update(id, payload ?? {}),
                });
            },
            onDelete: async ({ transaction }) => {
                const mutation = transaction.mutations[0];
                if (!mutation) {
                    return;
                }

                return sendCollectionMutation({
                    type: 'delete',
                    mutation,
                    request: (id) => modelDefinition.api.remove(id),
                });
            },
        }),
    );

    function emitMutationLifecycle({ outboxId, type, recordId, title, status, error = '' }) {
        const event = {
            id: outboxId,
            type,
            entityId: recordId,
            recordId,
            todoId: recordId,
            title,
            status,
        };

        if (typeof error === 'string' && error.length > 0) {
            event.error = error;
        }

        events.emit(event);
    }

    async function readPendingMutations() {
        const pendingMutations = await queueRepository.read();

        return pendingMutations.filter((mutation) => {
            return mutation && typeof mutation.id === 'string' && typeof mutation.type === 'string';
        });
    }

    async function queuePendingMutation(nextMutation) {
        const current = await readPendingMutations();
        const nextQueue = mergePendingMutationQueue(current, nextMutation);

        if (nextQueue === current) {
            return;
        }

        await queueRepository.write(nextQueue);
    }

    async function executeMutation(type, id, payload) {
        if (type === 'insert') {
            return modelDefinition.api.create(payload ?? {});
        }

        if (type === 'update') {
            return modelDefinition.api.update(id, payload ?? {});
        }

        return modelDefinition.api.remove(id);
    }

    function resolveErrorMessage(error) {
        return error instanceof Error ? error.message : '';
    }

    async function runPendingMutation(mutation) {
        const recordId = toStringId(mutation.id);
        const outboxId = mutation.outboxId ?? buildOutboxId(mutation.type, recordId);
        const title = resolveMutationTitle(modelDefinition, mutation.payload);

        emitMutationLifecycle({
            outboxId,
            type: mutation.type,
            recordId,
            title,
            status: SYNC_STATUS.sending,
        });

        try {
            const response = await executeMutation(mutation.type, recordId, mutation.payload);
            const txid = requireTxid(response, mutation.type, modelDefinition.name);
            await maybeReconcileTxid(collection, txid);
            emitMutationLifecycle({
                outboxId,
                type: mutation.type,
                recordId,
                title,
                status: SYNC_STATUS.synced,
            });
        } catch (error) {
            emitMutationLifecycle({
                outboxId,
                type: mutation.type,
                recordId,
                title,
                status: isRecoverableNetworkError(error) ? SYNC_STATUS.queued : SYNC_STATUS.failed,
                error: resolveErrorMessage(error),
            });
            throw error;
        }
    }

    const flushPendingMutations = createSingleFlightQueueFlusher({
        isOnline: () => typeof navigator === 'undefined' || navigator.onLine !== false,
        readQueue: readPendingMutations,
        writeQueue: (nextQueue) => queueRepository.write(nextQueue),
        runItem: runPendingMutation,
        isRecoverableError: isRecoverableNetworkError,
    });

    async function sendCollectionMutation({ type, mutation, request }) {
        const recordId = resolveMutationId(type, mutation, idKey);
        const payload = createMutationPayload(type, mutation);
        const title = resolveMutationTitle(modelDefinition, payload);
        const outboxId = buildOutboxId(type, recordId);

        emitMutationLifecycle({
            outboxId,
            type,
            recordId,
            title,
            status: SYNC_STATUS.sending,
        });

        try {
            const response = await request(recordId, payload);
            const txid = requireTxid(response, type, modelDefinition.name);
            return { txid };
        } catch (error) {
            if (!isRecoverableNetworkError(error)) {
                emitMutationLifecycle({
                    outboxId,
                    type,
                    recordId,
                    title,
                    status: SYNC_STATUS.failed,
                    error: resolveErrorMessage(error),
                });
                throw error;
            }

            emitMutationLifecycle({
                outboxId,
                type,
                recordId,
                title,
                status: SYNC_STATUS.queued,
            });
            await queuePendingMutation({
                type,
                id: recordId,
                ...(payload === undefined ? {} : { payload }),
                outboxId,
            });
            return undefined;
        }
    }

    async function readPendingOutboxEntries() {
        const queue = await readPendingMutations();

        return queue.map((mutation) => {
            const recordId = toStringId(mutation.id);

            return {
                id: mutation.outboxId ?? buildOutboxId(mutation.type, recordId),
                type: mutation.type,
                entityId: recordId,
                recordId,
                todoId: recordId,
                title: resolveMutationTitle(modelDefinition, mutation.payload),
                status: SYNC_STATUS.queued,
            };
        });
    }

    registerOnlineQueueFlush(flushPendingMutations);

    return {
        collection,
        flushPendingMutations,
        readPendingOutboxEntries,
        setOutboxLifecycleReporter: (reporter) => events.setReporter(reporter),
    };
}
