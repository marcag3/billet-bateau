import { computed } from 'vue';
import { destroy, store, update } from '../../routes/todos';
import { createEntityApi } from '../entity.api';
import { defineRelations } from '../entity.relations';
import { defineModel } from '../model.definition';
import { useEntityList } from '../entity.queries';
import {
    bootstrapAppPowerSync,
    getAppPowerSyncBootstrappedRef,
    getAppPowerSyncErrorMessageRef,
    getAppPowerSyncLoadingRef,
    getAppPowerSyncPersistenceUnavailableRef,
    getCurrentUserIdRef,
    getPersistenceLimitedMessage,
    getTodosCollectionRef,
    refreshOutboxSnapshot,
} from '../../powersync/app-powersync.runtime.js';

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
    persistenceSchemaVersion: 3,
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
    relations: defineRelations([]),
});

export async function bootstrapTodos() {
    await bootstrapAppPowerSync();
}

export function useTodos() {
    const hasBootstrappedCollection = getAppPowerSyncBootstrappedRef();
    const todosCollectionRef = getTodosCollectionRef();
    const isLoading = getAppPowerSyncLoadingRef();
    const errorMessage = getAppPowerSyncErrorMessageRef();
    const persistenceUnavailable = getAppPowerSyncPersistenceUnavailableRef();
    const currentUserIdRef = getCurrentUserIdRef();

    const { data: todos } = useEntityList({
        enabledRef: hasBootstrappedCollection,
        alias: todosModelDefinition.name,
        collection: todosCollectionRef,
        orderBy: todosModelDefinition.orderBy ?? [],
    });

    /**
     * @returns {Promise<void>}
     */
    async function ensureTodosReady() {
        if (!hasBootstrappedCollection.value) {
            await bootstrapAppPowerSync();
        }
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

        const userId = Number.parseInt(currentUserIdRef.value, 10);

        if (!Number.isFinite(userId)) {
            return;
        }

        const timestamp = new Date().toISOString();
        const todoId = crypto.randomUUID();

        collection.insert({
            id: todoId,
            user_id: userId,
            title: normalizedTitle,
            completed: 0,
            created_at: timestamp,
            updated_at: timestamp,
        });
        void refreshOutboxSnapshot();
    }

    async function toggleTodo(todo) {
        await ensureTodosReady();

        const collection = todosCollectionRef.value;

        if (!collection) {
            return;
        }

        collection.update(todo.id, (draft) => {
            const current = Boolean(draft.completed);
            draft.completed = current ? 0 : 1;
            draft.updated_at = new Date().toISOString();
        });
        void refreshOutboxSnapshot();
    }

    async function removeTodo(todo) {
        await ensureTodosReady();

        const collection = todosCollectionRef.value;

        if (!collection) {
            return;
        }

        collection.delete(todo.id);
        void refreshOutboxSnapshot();
    }

    return {
        todos,
        isLoading,
        errorMessage,
        hasError: computed(() => errorMessage.value.length > 0),
        persistenceUnavailable,
        persistenceLimitedMessage: getPersistenceLimitedMessage(),
        createTodo,
        toggleTodo,
        removeTodo,
        refresh: bootstrapTodos,
    };
}
