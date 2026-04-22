import { computed, ref } from 'vue';
import { buildOutboxId } from '../services/sync.outbox';
import { createMutationMonitor } from './entity.mutations';
import { createOutboxStore } from './entity.outbox';
import { useEntityList } from './entity.queries';
import { SYNC_STATUS } from './sync.status';

function normalizeRecordId(event) {
    if (typeof event?.entityId === 'string') {
        return event.entityId;
    }

    if (typeof event?.recordId === 'string') {
        return event.recordId;
    }

    if (typeof event?.todoId === 'string') {
        return event.todoId;
    }

    return '';
}

export function createEntityModelController({
    modelDefinition,
    collection,
    flushPendingMutations,
    readPendingOutboxEntries,
    setOutboxLifecycleReporter,
    syncRequestFailedMessage,
    loadFailedMessage,
}) {
    const isLoading = ref(true);
    const errorMessage = ref('');
    const hasBootstrappedCollection = ref(false);
    const { outboxEntries, hasOutboxEntries, pendingOutboxCount, upsertOutboxEntry } = createOutboxStore();

    let bootstrapPromise = null;
    let hasHydratedOutbox = false;

    function applyOutboxLifecycle(event) {
        upsertOutboxEntry({
            id: typeof event?.id === 'string' ? event.id : '',
            type: event?.type,
            todoId: normalizeRecordId(event),
            title: event?.title,
            status: event?.status,
            error: typeof event?.error === 'string' ? event.error : '',
        });
    }

    async function hydratePendingOutboxEntries() {
        if (hasHydratedOutbox) {
            return;
        }

        hasHydratedOutbox = true;
        const pendingEntries = await readPendingOutboxEntries();

        pendingEntries.forEach((entry) => {
            upsertOutboxEntry(entry);
        });
    }

    const runMutationMonitor = createMutationMonitor({
        setErrorMessage: (message) => {
            errorMessage.value = message;
        },
        onLifecycle: (entry) => {
            upsertOutboxEntry(entry);
        },
        onQueuedLifecycleSkipped: (entry) => {
            const existingEntry = outboxEntries.value.find((candidate) => candidate.id === entry.id);
            return existingEntry?.status === SYNC_STATUS.queued;
        },
    });

    function trackTransaction({ type, recordId, title, transaction }) {
        errorMessage.value = '';
        const outboxEntry = {
            id: buildOutboxId(type, recordId),
            type,
            todoId: recordId,
            title,
        };

        upsertOutboxEntry({
            ...outboxEntry,
            status: SYNC_STATUS.sending,
            error: '',
        });

        runMutationMonitor(transaction, outboxEntry, syncRequestFailedMessage);
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
                void flushPendingMutations().catch((error) => {
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

    setOutboxLifecycleReporter(applyOutboxLifecycle);

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
        isLoading,
        errorMessage,
        hasError: computed(() => errorMessage.value.length > 0),
        outboxEntries,
        hasOutboxEntries,
        pendingOutboxCount,
        bootstrap,
        useList,
        trackTransaction,
    };
}
