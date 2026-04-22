import { createCollection } from '@tanstack/db';
import { electricCollectionOptions } from '@tanstack/electric-db-collection';
import { persistedCollectionOptions } from '@tanstack/browser-db-sqlite-persistence';
import { useLiveQuery } from '@tanstack/vue-db';
import { computed, ref, shallowRef } from 'vue';
import { destroy, store, update } from '../../routes/todos';
import { getElectricShapeUrlForShape } from '../../services/electric.api';
import { awaitTxidReconciliation, requireTxid } from '../../services/electric.txid';
import { translate } from '../../utilities/i18n';
import { createEntityApi } from '../entity.api';
import { defineRelations } from '../entity.relations';
import { defineModel } from '../model.definition';
import { buildEntityListQuery, withModelRelations } from '../entity.queries';
import { ensureBrowserSqlitePersistence } from '../persistence/browser-sqlite-persistence';
import { wrapCollectionSyncWritesForJsonSafeRows } from '../persistence/json-safe-rows';

const TODOS_SCHEMA_VERSION = 1;

const todosApi = createEntityApi({
    createUrl: () => store.url(),
    updateUrl: (id) => update.url({ todo: id }),
    deleteUrl: (id) => destroy.url({ todo: id }),
});

const todosModelDefinition = defineModel({
    name: 'todos',
    collectionId: 'todos',
    shapeUrl: () => getElectricShapeUrlForShape('todos'),
    api: {
        create: (payload) => todosApi.create(payload),
        update: (id, payload) => todosApi.update(id, payload),
        remove: (id) => todosApi.remove(id),
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

const syncRequestFailedMessage = translate('sync.syncRequestFailed');
const loadFailedMessage = translate('sync.unableLoadTodoSync');

const isLoading = ref(true);
const errorMessage = ref('');
const hasBootstrappedCollection = ref(false);
let bootstrapPromise = null;

/** @type {import('vue').ShallowRef<import('@tanstack/db').Collection | null>} */
const todosCollectionRef = shallowRef(null);

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

/**
 * @param {unknown} error
 * @returns {boolean}
 */
function isNonRetriableHttpError(error) {
    const message = error instanceof Error ? error.message : String(error);
    return /\b401\b|\b403\b|\b404\b|\b422\b|Unauthenticated|Forbidden/i.test(message);
}

/**
 * @param {import('@tanstack/db').Transaction} dbTransaction
 * @param {import('@tanstack/db').Collection} collection
 * @returns {Promise<void>}
 */
async function executeTodoMutations(dbTransaction, collection) {
    const txids = [];

    for (const mutation of dbTransaction.mutations) {
        try {
            if (mutation.type === 'insert') {
                const modified = mutation.modified;
                const idKey = todosModelDefinition.idKey ?? 'id';
                const recordId = String(modified[idKey]);
                const response = await todosModelDefinition.api.create({
                    id: recordId,
                    title: String(modified.title ?? ''),
                    completed: Boolean(modified.completed),
                    created_at: modified.created_at,
                    updated_at: modified.updated_at,
                });
                txids.push(requireTxid(response, 'insert', todosModelDefinition.name));
                continue;
            }

            if (mutation.type === 'update') {
                const { original, changes } = mutation;
                const idKey = todosModelDefinition.idKey ?? 'id';
                const recordId = String(original[idKey]);
                const payload = pickTodoUpdatePayload(changes);
                const response = await todosModelDefinition.api.update(recordId, payload);
                txids.push(requireTxid(response, 'update', todosModelDefinition.name));
                continue;
            }

            if (mutation.type === 'delete') {
                const { original } = mutation;
                const idKey = todosModelDefinition.idKey ?? 'id';
                const recordId = String(original[idKey]);
                const response = await todosModelDefinition.api.remove(recordId);
                txids.push(requireTxid(response, 'delete', todosModelDefinition.name));
                continue;
            }
        } catch (error) {
            if (isNonRetriableHttpError(error)) {
                throw new Error(error instanceof Error ? error.message : syncRequestFailedMessage);
            }

            const message = error instanceof Error ? error.message : syncRequestFailedMessage;
            throw error instanceof Error ? error : new Error(message);
        }
    }

    const awaitTxId = collection.utils?.awaitTxId;
    if (typeof awaitTxId !== 'function') {
        return;
    }

    for (const txid of txids) {
        await awaitTxidReconciliation(awaitTxId, txid);
    }
}

function buildTodosCollectionOptions(sqlitePersistence) {
    const electricOptions = electricCollectionOptions({
        id: todosModelDefinition.collectionId,
        getKey: (item) => String(item[todosModelDefinition.idKey ?? 'id']),
        shapeOptions: {
            url: (() => {
                const shapeUrl = todosModelDefinition.shapeUrl;
                return typeof shapeUrl === 'function' ? shapeUrl() : shapeUrl;
            })(),
        },
        onInsert: async ({ transaction, collection }) => {
            await executeTodoMutations(/** @type {import('@tanstack/db').Transaction} */ (transaction), collection);
        },
        onUpdate: async ({ transaction, collection }) => {
            await executeTodoMutations(/** @type {import('@tanstack/db').Transaction} */ (transaction), collection);
        },
        onDelete: async ({ transaction, collection }) => {
            await executeTodoMutations(/** @type {import('@tanstack/db').Transaction} */ (transaction), collection);
        },
    });

    const base = !sqlitePersistence
        ? electricOptions
        : persistedCollectionOptions({
              ...electricOptions,
              persistence: sqlitePersistence,
              schemaVersion: TODOS_SCHEMA_VERSION,
          });

    return wrapCollectionSyncWritesForJsonSafeRows(base);
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

export async function bootstrapTodos() {
    if (bootstrapPromise !== null) {
        return bootstrapPromise;
    }

    bootstrapPromise = (async () => {
        try {
            const sqlitePersistence = await ensureBrowserSqlitePersistence();
            const collectionOptions = buildTodosCollectionOptions(sqlitePersistence);

            const collection = createCollection(
                /** @type {any} */ (collectionOptions),
            );

            todosCollectionRef.value = collection;

            await collection.preload();
            hasBootstrappedCollection.value = true;
            errorMessage.value = '';
        } catch (error) {
            hasBootstrappedCollection.value = false;
            todosCollectionRef.value = null;
            errorMessage.value = error instanceof Error ? error.message : loadFailedMessage;
        } finally {
            isLoading.value = false;
        }
    })();

    return bootstrapPromise;
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

    /**
     * @param {unknown} tx
     * @returns {Promise<void>}
     */
    async function awaitCollectionTx(tx) {
        if (!tx || typeof tx !== 'object' || !('isPersisted' in tx)) {
            return;
        }
        await /** @type {{ isPersisted: { promise: Promise<unknown> } }} */ (tx).isPersisted.promise;
    }

    async function createTodo(title) {
        const normalizedTitle = title.trim();

        if (normalizedTitle.length === 0) {
            return;
        }

        await ensureTodosReady();

        const collection = todosCollectionRef.value;

        if (!collection) {
            return;
        }

        const timestamp = new Date().toISOString();
        const todoId = crypto.randomUUID();

        const tx = collection.insert({
            id: todoId,
            title: normalizedTitle,
            completed: false,
            created_at: timestamp,
            updated_at: timestamp,
        });

        await awaitCollectionTx(tx);
    }

    async function toggleTodo(todo) {
        await ensureTodosReady();

        const collection = todosCollectionRef.value;

        if (!collection) {
            return;
        }

        const tx = collection.update(todo.id, (draft) => {
            draft.completed = !Boolean(draft.completed);
            draft.updated_at = new Date().toISOString();
        });

        await awaitCollectionTx(tx);
    }

    async function removeTodo(todo) {
        await ensureTodosReady();

        const collection = todosCollectionRef.value;

        if (!collection) {
            return;
        }

        const tx = collection.delete(todo.id);
        await awaitCollectionTx(tx);
    }

    return {
        todos,
        isLoading,
        errorMessage,
        hasError: computed(() => errorMessage.value.length > 0),
        createTodo,
        toggleTodo,
        removeTodo,
        refresh: bootstrapTodos,
    };
}
