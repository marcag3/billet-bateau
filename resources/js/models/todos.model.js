import { createEntityModelController } from './entity.model.controller';
import { todosModelDefinition } from './todos.definition';
import {
    flushPendingTodoMutations,
    readPendingOutboxEntries,
    setTodoOutboxLifecycleReporter,
    todosCollection,
} from './todos.sync';
import { translate } from '../utilities/i18n';

const todosController = createEntityModelController({
    modelDefinition: todosModelDefinition,
    collection: todosCollection,
    flushPendingMutations: flushPendingTodoMutations,
    readPendingOutboxEntries,
    setOutboxLifecycleReporter: setTodoOutboxLifecycleReporter,
    syncRequestFailedMessage: translate('sync.syncRequestFailed'),
    loadFailedMessage: translate('sync.unableLoadTodoSync'),
});

export const bootstrapTodos = () => todosController.bootstrap();

export function useTodos() {
    const { data: todos } = todosController.useList();

    async function createTodo(title) {
        const normalizedTitle = title.trim();

        if (normalizedTitle.length === 0) {
            return;
        }

        const timestamp = new Date().toISOString();
        const todoId = crypto.randomUUID();
        const transaction = todosCollection.insert({
            id: todoId,
            title: normalizedTitle,
            completed: false,
            created_at: timestamp,
            updated_at: timestamp,
        });

        todosController.trackTransaction({
            type: 'insert',
            recordId: todoId,
            title: normalizedTitle,
            transaction,
        });
    }

    async function toggleTodo(todo) {
        const todoId = String(todo.id);
        const title = typeof todo.title === 'string' ? todo.title : '';
        const transaction = todosCollection.update(todo.id, (draft) => {
            draft.completed = !Boolean(draft.completed);
            draft.updated_at = new Date().toISOString();
        });

        todosController.trackTransaction({
            type: 'update',
            recordId: todoId,
            title,
            transaction,
        });
    }

    async function removeTodo(todo) {
        const todoId = String(todo.id);
        const title = typeof todo.title === 'string' ? todo.title : '';
        const transaction = todosCollection.delete(todo.id);

        todosController.trackTransaction({
            type: 'delete',
            recordId: todoId,
            title,
            transaction,
        });
    }

    return {
        todos,
        isLoading: todosController.isLoading,
        errorMessage: todosController.errorMessage,
        hasError: todosController.hasError,
        outboxEntries: todosController.outboxEntries,
        hasOutboxEntries: todosController.hasOutboxEntries,
        pendingOutboxCount: todosController.pendingOutboxCount,
        createTodo,
        toggleTodo,
        removeTodo,
        refresh: bootstrapTodos,
    };
}
