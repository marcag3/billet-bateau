import { createCollection } from '@tanstack/db';
import { useLiveQuery } from '@tanstack/vue-db';
import { NonRetriableError, startOfflineExecutor } from '@tanstack/offline-transactions';
import { computed, ref, shallowRef } from 'vue';
import { destroy, store, update } from '../../routes/todos';
import { getElectricShapeUrlForShape } from '../../services/electric.api';
import { createEntityApi } from '../entity.api';
import { defineRelations } from '../entity.relations';
import { defineModel } from '../model.definition';
import { buildEntityListQuery, withModelRelations } from '../entity.queries';
import { ensureBrowserSqlitePersistence } from '../persistence/browser-sqlite-persistence';
import { createElectricPersistedCollectionOptions } from '../sync/create-electric-persisted-collection-options.js';
import { runElectricModelMutations } from '../sync/run-electric-model-mutations.js';
import { translate } from '../../utilities/i18n';

const todosApi = createEntityApi({
    createUrl: () => store.url(),
    updateUrl: (id) => update.url({ todo: id }),
    deleteUrl: (id) => destroy.url({ todo: id }),
});

/**
 * @param {Record<string, unknown>} changes
 * @returns {Record<string, unknown>}
 */
function pickTodoUpdatePayload(changes) {
    const payload = {};

    if ('title' in changes) {
        payload.title = changes.title;
    }

    if ('completed' in changes) {
        payload.completed = changes.completed;
    }

    return payload;
}

export const todosModelDefinition = defineModel({
    name: 'todos',
    collectionId: 'todos',
    persistenceSchemaVersion: 1,
    shapeUrl: () => getElectricShapeUrlForShape('todos'),
    pickUpdatePayload: pickTodoUpdatePayload,
    api: {
        create: (payload, options) => todosApi.create(payload, options),
        update: (id, payload, options) => todosApi.update(id, payload, options),
        remove: (id, options) => todosApi.remove(id, options),
    },
    orderBy: [
        { key: 'updated_at', direction: 'desc' },
        { key: 'created_at', direction: 'desc' },
        { key: 'id', direction: 'desc' },
    ],
    titleFromPayload: (payload) => {
        const title = payload?.title;
        return typeof title === 'string' ? title : '';
    },
    relations: defineRelations([]),
});

const loadFailedMessage = translate('sync.unableLoadTodoSync');
const persistenceLimitedMessage = translate('sync.persistenceLimited');

const isLoading = ref(true);
const errorMessage = ref('');
const hasBootstrappedCollection = ref(false);
const persistenceUnavailable = ref(false);
const outboxPendingCount = ref(0);
const outboxPreview = ref(/** @type {Array<{ id: string, mutationFnName: string, createdAt: Date | string }>} */ ([]));
/** Set when durable enqueue (`tx.commit`) fails; cleared on the next mutation attempt. */
const outboxCommitError = ref('');
let bootstrapPromise = null;

/** @type {import('vue').ShallowRef<import('@tanstack/db').Collection | null>} */
const todosCollectionRef = shallowRef(null);

/** @type {import('vue').ShallowRef<ReturnType<typeof startOfflineExecutor> | null>} */
const todosOfflineExecutorRef = shallowRef(null);

const SYNC_TODOS_MUTATION = 'syncTodos';

async function refreshOutboxSnapshot() {
    const executor = todosOfflineExecutorRef.value;

    if (!executor) {
        outboxPendingCount.value = 0;
        outboxPreview.value = [];
        return;
    }

    try {
        await executor.waitForInit();
        const pending = await executor.peekOutbox();
        outboxPendingCount.value = Array.isArray(pending) ? pending.length : 0;
        outboxPreview.value = (Array.isArray(pending) ? pending : []).map((tx) => ({
            id: tx.id,
            mutationFnName: tx.mutationFnName,
            createdAt: tx.createdAt,
        }));
    } catch {
        outboxPendingCount.value = 0;
        outboxPreview.value = [];
    }
}

/**
 * @returns {Promise<import('@tanstack/db').Collection | null>}
 */
export async function bootstrapTodos() {
    if (hasBootstrappedCollection.value && todosCollectionRef.value) {
        try {
            await todosCollectionRef.value.preload();
            errorMessage.value = '';
        } catch (error) {
            errorMessage.value = error instanceof Error ? error.message : loadFailedMessage;
        }

        await refreshOutboxSnapshot();
        return todosCollectionRef.value;
    }

    if (bootstrapPromise !== null) {
        return bootstrapPromise;
    }

    bootstrapPromise = (async () => {
        try {
            const sqlitePersistence = await ensureBrowserSqlitePersistence();
            persistenceUnavailable.value = sqlitePersistence === null;

            const collectionOptions = createElectricPersistedCollectionOptions({
                model: todosModelDefinition,
                sqlitePersistence,
            });

            const collection = createCollection(/** @type {any} */ (collectionOptions));
            todosCollectionRef.value = collection;

            const offlineExecutor = startOfflineExecutor({
                collections: {
                    [todosModelDefinition.collectionId]: collection,
                },
                mutationFns: {
                    [SYNC_TODOS_MUTATION]: async ({ transaction, idempotencyKey }) => {
                        const col = todosCollectionRef.value;

                        if (!col) {
                            throw new NonRetriableError('Todos collection is not initialized.');
                        }

                        await runElectricModelMutations(
                            todosModelDefinition,
                            col,
                            { mutations: transaction.mutations },
                            { idempotencyKey },
                        );
                    },
                },
                onStorageFailure: () => {
                    persistenceUnavailable.value = true;
                },
            });

            todosOfflineExecutorRef.value = offlineExecutor;
            await offlineExecutor.waitForInit();

            try {
                await collection.preload();
            } catch (preloadError) {
                if (sqlitePersistence) {
                    hasBootstrappedCollection.value = true;
                    errorMessage.value = preloadError instanceof Error ? preloadError.message : loadFailedMessage;
                    await refreshOutboxSnapshot();
                    return collection;
                }

                throw preloadError;
            }

            hasBootstrappedCollection.value = true;
            errorMessage.value = '';
            await refreshOutboxSnapshot();
            return collection;
        } catch (error) {
            bootstrapPromise = null;
            hasBootstrappedCollection.value = false;
            todosOfflineExecutorRef.value?.dispose();
            todosOfflineExecutorRef.value = null;
            todosCollectionRef.value = null;
            errorMessage.value = error instanceof Error ? error.message : loadFailedMessage;
            return null;
        } finally {
            isLoading.value = false;
        }
    })();

    return bootstrapPromise;
}

function useTodosList() {
    return useLiveQuery(
        (queryBuilder) => {
            const collection = todosCollectionRef.value;

            if (!collection || hasBootstrappedCollection.value === false) {
                return undefined;
            }

            const query = buildEntityListQuery({
                queryBuilder,
                alias: todosModelDefinition.name,
                collection,
                orderBy: todosModelDefinition.orderBy ?? [],
            });

            return withModelRelations(query, [], todosModelDefinition.relations ?? {});
        },
        [hasBootstrappedCollection, todosCollectionRef],
    );
}

/**
 * Applies the optimistic mutation, persists to the outbox, then returns without waiting for
 * `tx.commit()` to finish (that path can block while offline in @tanstack/offline-transactions).
 * Server flush + Electric reconciliation are reflected separately via `outboxPendingCount` and
 * per-row `$synced`.
 *
 * @param {ReturnType<typeof startOfflineExecutor>} executor
 * @param {(draft: () => void) => void} mutateBody
 * @returns {Promise<void>}
 */
async function enqueueOfflineTodoMutation(executor, mutateBody) {
    await executor.waitForInit();
    outboxCommitError.value = '';
    const offlineTx = executor.createOfflineTransaction({
        mutationFnName: SYNC_TODOS_MUTATION,
        autoCommit: false,
    });
    offlineTx.mutate(mutateBody);
    void offlineTx
        .commit()
        .then(() => refreshOutboxSnapshot())
        .catch((error) => {
            outboxCommitError.value = error instanceof Error ? error.message : String(error);
            void refreshOutboxSnapshot();
        });
}

export function useTodos() {
    const { data: todos } = useTodosList();

    /**
     * @returns {Promise<void>}
     */
    async function ensureTodosReady() {
        if (!hasBootstrappedCollection.value) {
            await bootstrapTodos();
        }
    }

    async function createTodo(title) {
        const normalizedTitle = title.trim();

        if (normalizedTitle.length === 0) {
            return;
        }

        await ensureTodosReady();

        const collection = todosCollectionRef.value;
        const executor = todosOfflineExecutorRef.value;

        if (!collection || !executor) {
            return;
        }

        const timestamp = new Date().toISOString();
        const todoId = crypto.randomUUID();

        await enqueueOfflineTodoMutation(executor, () => {
            collection.insert({
                id: todoId,
                title: normalizedTitle,
                completed: false,
                created_at: timestamp,
                updated_at: timestamp,
            });
        });
    }

    async function toggleTodo(todo) {
        await ensureTodosReady();

        const collection = todosCollectionRef.value;
        const executor = todosOfflineExecutorRef.value;

        if (!collection || !executor) {
            return;
        }

        await enqueueOfflineTodoMutation(executor, () => {
            collection.update(todo.id, (draft) => {
                draft.completed = !Boolean(draft.completed);
                draft.updated_at = new Date().toISOString();
            });
        });
    }

    async function removeTodo(todo) {
        await ensureTodosReady();

        const collection = todosCollectionRef.value;
        const executor = todosOfflineExecutorRef.value;

        if (!collection || !executor) {
            return;
        }

        await enqueueOfflineTodoMutation(executor, () => {
            collection.delete(todo.id);
        });
    }

    return {
        todos,
        isLoading,
        errorMessage,
        hasError: computed(() => errorMessage.value.length > 0),
        persistenceUnavailable,
        persistenceLimitedMessage,
        outboxPendingCount,
        outboxPreview,
        /** True while there are queued writes that have not finished the server mutation path. */
        hasPendingOutboxWrites: computed(() => outboxPendingCount.value > 0),
        outboxCommitError,
        hasOutboxCommitError: computed(() => outboxCommitError.value.length > 0),
        dismissOutboxCommitError: () => {
            outboxCommitError.value = '';
        },
        refreshOutbox: refreshOutboxSnapshot,
        createTodo,
        toggleTodo,
        removeTodo,
        refresh: bootstrapTodos,
    };
}
