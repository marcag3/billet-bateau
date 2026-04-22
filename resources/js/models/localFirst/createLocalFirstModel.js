import { createCollection } from '@tanstack/db';
import { electricCollectionOptions } from '@tanstack/electric-db-collection';
import { computed, ref } from 'vue';
import { useEntityList } from '../entity.queries';
import { SYNC_STATUS } from '../sync.status';
import { createChangeLogSynchronizer } from './change-log-synchronizer.js';
import { createMutationEventEmitter } from './mutation-events.js';
import { createOutboxStore } from './model-outbox.js';
import { createTodoChangeLogRepository } from './todo-change-log.repository.js';

function resolveShapeUrl(shapeUrl) {
    return typeof shapeUrl === 'function' ? shapeUrl() : shapeUrl;
}

/**
 * @param {Record<string, unknown>} modelDefinition
 * @param {{ syncRequestFailedMessage: string, loadFailedMessage: string }} messages
 */
export function createLocalFirstModel(modelDefinition, { syncRequestFailedMessage, loadFailedMessage }) {
    const idKey = modelDefinition.idKey ?? 'id';
    const changeLog = createTodoChangeLogRepository(modelDefinition.name);
    const outbox = createOutboxStore();
    const emitter = createMutationEventEmitter();

    emitter.setReporter((event) => {
        outbox.upsertOutboxEntry({
            id: typeof event?.id === 'string' ? event.id : '',
            type: event?.type,
            recordId: typeof event?.recordId === 'string' ? event.recordId : '',
            title: event?.title,
            status: event?.status,
            error: typeof event?.error === 'string' ? event.error : '',
        });
    });

    const collection = createCollection(
        electricCollectionOptions({
            id: modelDefinition.collectionId,
            getKey: (item) => item[idKey],
            shapeOptions: {
                url: resolveShapeUrl(modelDefinition.shapeUrl),
            },
            onInsert: async ({ transaction }) => {
                for (const mutation of transaction.mutations) {
                    const modified = mutation.modified;
                    const changeId = await changeLog.persistInsertShadowAndEnqueue({
                        id: String(modified[idKey]),
                        title: String(modified.title ?? ''),
                        completed: Boolean(modified.completed),
                        created_at: modified.created_at,
                        updated_at: modified.updated_at,
                    });

                    emitter.emit({
                        id: `change-${changeId}`,
                        type: 'insert',
                        recordId: String(modified[idKey]),
                        title: modelDefinition.titleFromPayload?.(modified) ?? '',
                        status: SYNC_STATUS.queued,
                    });
                }

                return undefined;
            },
            onUpdate: async ({ transaction }) => {
                for (const mutation of transaction.mutations) {
                    const { original, changes } = mutation;
                    const merged = { ...original, ...changes };
                    const changeId = await changeLog.persistUpdateShadowAndEnqueue(merged, changes);

                    emitter.emit({
                        id: `change-${changeId}`,
                        type: 'update',
                        recordId: String(original[idKey]),
                        title: modelDefinition.titleFromPayload?.(merged) ?? '',
                        status: SYNC_STATUS.queued,
                    });
                }

                return undefined;
            },
            onDelete: async ({ transaction }) => {
                for (const mutation of transaction.mutations) {
                    const { original } = mutation;
                    const changeId = await changeLog.persistDeleteEnqueue(String(original[idKey]));

                    emitter.emit({
                        id: `change-${changeId}`,
                        type: 'delete',
                        recordId: String(original[idKey]),
                        title: modelDefinition.titleFromPayload?.(original) ?? '',
                        status: SYNC_STATUS.queued,
                    });
                }

                return undefined;
            },
        }),
    );

    const synchronizer = createChangeLogSynchronizer({
        changeLog,
        api: modelDefinition.api,
        collection,
        modelName: modelDefinition.name,
        emitLifecycle: (event) => emitter.emit(event),
        titleFromPayload: (payload) => (modelDefinition.titleFromPayload ? modelDefinition.titleFromPayload(payload) : ''),
    });

    const isLoading = ref(true);
    const errorMessage = ref('');
    const hasBootstrappedCollection = ref(false);
    let bootstrapPromise = null;

    async function hydratePendingOutboxEntries() {
        const pendingEntries = await changeLog.readPendingOutboxEntries();

        pendingEntries.forEach((entry) => {
            outbox.upsertOutboxEntry(entry);
        });
    }

    async function bootstrap() {
        if (bootstrapPromise !== null) {
            return bootstrapPromise;
        }

        bootstrapPromise = (async () => {
            try {
                await collection.preload();
                await hydratePendingOutboxEntries();
                hasBootstrappedCollection.value = true;
                errorMessage.value = '';
                void synchronizer.flushPendingChanges().catch((error) => {
                    errorMessage.value = error instanceof Error ? error.message : syncRequestFailedMessage;
                });
            } catch (error) {
                hasBootstrappedCollection.value = false;
                errorMessage.value = error instanceof Error ? error.message : loadFailedMessage;
            } finally {
                isLoading.value = false;
            }
        })();

        return bootstrapPromise;
    }

    function useList() {
        return useEntityList({
            enabledRef: hasBootstrappedCollection,
            alias: modelDefinition.name,
            collection,
            dependencies: [hasBootstrappedCollection],
            orderBy: modelDefinition.orderBy ?? [],
            relations: modelDefinition.relations ?? {},
        });
    }

    return {
        collection,
        bootstrap,
        flushPendingChanges: synchronizer.flushPendingChanges,
        useList,
        isLoading,
        errorMessage,
        hasError: computed(() => errorMessage.value.length > 0),
        outboxEntries: outbox.outboxEntries,
        hasOutboxEntries: outbox.hasOutboxEntries,
        pendingOutboxCount: outbox.pendingOutboxCount,
    };
}
