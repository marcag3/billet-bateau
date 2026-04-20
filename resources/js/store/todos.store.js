import { computed, ref } from 'vue';
import { flushPendingTodoMutations, todosCollection } from '../services/todos.sync';
import { translate } from '../utilities/i18n';

const todos = ref([]);
const isLoading = ref(true);
const errorMessage = ref('');

let bootstrapPromise = null;
let subscription = null;

function sortTodos(left, right) {
    return String(right.updated_at ?? '').localeCompare(String(left.updated_at ?? ''));
}

function refreshTodosSnapshot() {
    todos.value = Array.from(todosCollection.values()).sort(sortTodos);
}

function monitorPersistence(transaction) {
    void transaction.isPersisted.promise
        .then(() => {
            errorMessage.value = '';
        })
        .catch((error) => {
            errorMessage.value = error instanceof Error ? error.message : translate('sync.syncRequestFailed');
        });
}

export async function bootstrapTodos() {
    if (bootstrapPromise !== null) {
        return bootstrapPromise;
    }

    bootstrapPromise = (async () => {
        try {
            await todosCollection.preload();

            if (subscription === null) {
                subscription = todosCollection.subscribeChanges(
                    () => {
                        refreshTodosSnapshot();
                    },
                    { includeInitialState: true },
                );
            }

            refreshTodosSnapshot();
            errorMessage.value = '';
            void flushPendingTodoMutations().catch((error) => {
                errorMessage.value = error instanceof Error ? error.message : translate('sync.syncRequestFailed');
            });
        } catch (error) {
            errorMessage.value = error instanceof Error ? error.message : translate('sync.unableLoadTodoSync');
        } finally {
            isLoading.value = false;
        }
    })();

    return bootstrapPromise;
}

export function useTodos() {
    const hasError = computed(() => errorMessage.value.length > 0);

    async function createTodo(title) {
        const normalizedTitle = title.trim();

        if (normalizedTitle.length === 0) {
            return;
        }

        errorMessage.value = '';

        const timestamp = new Date().toISOString();
        const transaction = todosCollection.insert({
            id: crypto.randomUUID(),
            title: normalizedTitle,
            completed: false,
            created_at: timestamp,
            updated_at: timestamp,
        });

        monitorPersistence(transaction);
    }

    async function toggleTodo(todo) {
        errorMessage.value = '';

        const transaction = todosCollection.update(todo.id, (draft) => {
            draft.completed = !Boolean(draft.completed);
            draft.updated_at = new Date().toISOString();
        });

        monitorPersistence(transaction);
    }

    async function removeTodo(todo) {
        errorMessage.value = '';

        const transaction = todosCollection.delete(todo.id);

        monitorPersistence(transaction);
    }

    return {
        todos,
        isLoading,
        errorMessage,
        hasError,
        createTodo,
        toggleTodo,
        removeTodo,
        refresh: bootstrapTodos,
    };
}
