import { computed, ref } from 'vue';
import { listLocalTodos } from '../services/pglite.todo.repository';
import { flushPendingTodoMutations, persistTodosCollectionSnapshot, todosCollection } from '../services/todos.sync';
import { translate } from '../utilities/i18n';

const todos = ref([]);
const isLoading = ref(true);
const errorMessage = ref('');

let bootstrapPromise = null;
let subscription = null;

async function refreshTodosSnapshot() {
    todos.value = await listLocalTodos();
}

async function syncCollectionSnapshotIntoLocalStore() {
    await persistTodosCollectionSnapshot();
    await refreshTodosSnapshot();
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
            await refreshTodosSnapshot();
            await todosCollection.preload();

            if (subscription === null) {
                subscription = todosCollection.subscribeChanges(
                    () => {
                        void syncCollectionSnapshotIntoLocalStore().catch(() => {
                            // Keep the latest successful snapshot on local storage.
                        });
                    },
                    { includeInitialState: true },
                );
            }

            await syncCollectionSnapshotIntoLocalStore();
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
        void syncCollectionSnapshotIntoLocalStore().catch(() => {
            // The stream subscription will retry persistence.
        });
    }

    async function toggleTodo(todo) {
        errorMessage.value = '';

        const transaction = todosCollection.update(todo.id, (draft) => {
            draft.completed = !Boolean(draft.completed);
            draft.updated_at = new Date().toISOString();
        });

        monitorPersistence(transaction);
        void syncCollectionSnapshotIntoLocalStore().catch(() => {
            // The stream subscription will retry persistence.
        });
    }

    async function removeTodo(todo) {
        errorMessage.value = '';

        const transaction = todosCollection.delete(todo.id);

        monitorPersistence(transaction);
        void syncCollectionSnapshotIntoLocalStore().catch(() => {
            // The stream subscription will retry persistence.
        });
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
