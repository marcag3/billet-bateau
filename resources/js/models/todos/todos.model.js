import { destroy, store, update } from '../../routes/todos';
import { getElectricShapeUrlForShape } from '../../services/electric.api';
import { translate } from '../../utilities/i18n';
import { createEntityApi } from '../entity.api';
import { defineRelations } from '../entity.relations';
import { createLocalFirstModel } from '../localFirst/createLocalFirstModel';
import { defineModel } from '../model.definition';

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

const todosModel = createLocalFirstModel(todosModelDefinition, {
    syncRequestFailedMessage: translate('sync.syncRequestFailed'),
    loadFailedMessage: translate('sync.unableLoadTodoSync'),
});

export const bootstrapTodos = () => todosModel.bootstrap();

export function useTodos() {
    const { data: todos } = todosModel.useList();

    async function createTodo(title) {
        const normalizedTitle = title.trim();

        if (normalizedTitle.length === 0) {
            return;
        }

        const timestamp = new Date().toISOString();
        const todoId = crypto.randomUUID();

        todosModel.collection.insert({
            id: todoId,
            title: normalizedTitle,
            completed: false,
            created_at: timestamp,
            updated_at: timestamp,
        });
    }

    async function toggleTodo(todo) {
        todosModel.collection.update(todo.id, (draft) => {
            draft.completed = !Boolean(draft.completed);
            draft.updated_at = new Date().toISOString();
        });
    }

    async function removeTodo(todo) {
        todosModel.collection.delete(todo.id);
    }

    return {
        todos,
        isLoading: todosModel.isLoading,
        errorMessage: todosModel.errorMessage,
        hasError: todosModel.hasError,
        outboxEntries: todosModel.outboxEntries,
        hasOutboxEntries: todosModel.hasOutboxEntries,
        pendingOutboxCount: todosModel.pendingOutboxCount,
        createTodo,
        toggleTodo,
        removeTodo,
        refresh: bootstrapTodos,
    };
}
