import { useLiveQuery } from '@tanstack/vue-db';
import { computed, ref } from 'vue';
import { isRecoverableNetworkError } from '../services/network.errors';
import {
    flushPendingTodoMutations,
    readPendingOutboxEntries,
    setTodoOutboxLifecycleReporter,
    todosCollection,
} from '../services/todos.sync';
import { translate } from '../utilities/i18n';

const isLoading = ref(true);
const errorMessage = ref('');
const outboxEntries = ref([]);
const hasBootstrappedCollection = ref(false);

const OUTBOX_SYNCED_RETENTION_MS = 5 * 60 * 1000;
const OUTBOX_MAX_ENTRIES = 60;

let bootstrapPromise = null;
let hasHydratedOutbox = false;

function buildOutboxId(type, todoId) {
    return `${type}:${todoId}`;
}

function sortOutboxEntries(left, right) {
    return String(right.updatedAt ?? '').localeCompare(String(left.updatedAt ?? ''));
}

function pruneOutboxEntries() {
    const now = Date.now();
    const filtered = outboxEntries.value.filter((entry) => {
        if (entry.status !== 'synced') {
            return true;
        }

        const updatedAtMs = Number(new Date(entry.updatedAt).getTime());

        return Number.isFinite(updatedAtMs) && now - updatedAtMs < OUTBOX_SYNCED_RETENTION_MS;
    });

    outboxEntries.value = filtered.slice(0, OUTBOX_MAX_ENTRIES);
}

function upsertOutboxEntry(partialEntry) {
    if (!partialEntry || typeof partialEntry.id !== 'string' || partialEntry.id.length === 0) {
        return;
    }

    const now = new Date().toISOString();
    const nextEntry = {
        id: partialEntry.id,
        type: partialEntry.type ?? 'update',
        todoId: partialEntry.todoId ?? '',
        title: partialEntry.title ?? '',
        status: partialEntry.status ?? 'sending',
        error: partialEntry.error ?? '',
        createdAt: now,
        updatedAt: now,
    };
    const existingIndex = outboxEntries.value.findIndex((entry) => entry.id === nextEntry.id);

    if (existingIndex === -1) {
        outboxEntries.value = [nextEntry, ...outboxEntries.value].sort(sortOutboxEntries);
        pruneOutboxEntries();
        return;
    }

    const existingEntry = outboxEntries.value[existingIndex];
    outboxEntries.value[existingIndex] = {
        ...existingEntry,
        ...nextEntry,
        createdAt: existingEntry.createdAt ?? now,
        updatedAt: now,
    };
    outboxEntries.value = [...outboxEntries.value].sort(sortOutboxEntries);
    pruneOutboxEntries();
}

function applyOutboxLifecycle(event) {
    upsertOutboxEntry({
        id: typeof event?.id === 'string' ? event.id : '',
        type: event?.type,
        todoId: event?.todoId,
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

function monitorPersistence(transaction, outboxEntry) {
    void transaction.isPersisted.promise
        .then(() => {
            errorMessage.value = '';
            if (outboxEntry) {
                const existingEntry = outboxEntries.value.find((entry) => entry.id === outboxEntry.id);

                if (existingEntry?.status === 'queued') {
                    return;
                }

                upsertOutboxEntry({
                    ...outboxEntry,
                    status: 'synced',
                    error: '',
                });
            }
        })
        .catch((error) => {
            errorMessage.value = error instanceof Error ? error.message : translate('sync.syncRequestFailed');
            if (outboxEntry) {
                const isRecoverableError = isRecoverableNetworkError(error);
                upsertOutboxEntry({
                    ...outboxEntry,
                    status: isRecoverableError ? 'queued' : 'failed',
                    error: isRecoverableError ? '' : error instanceof Error ? error.message : translate('sync.syncRequestFailed'),
                });
            }
        });
}

export async function bootstrapTodos() {
    if (bootstrapPromise !== null) {
        return bootstrapPromise;
    }

    bootstrapPromise = (async () => {
        try {
            await todosCollection.preload();
            await hydratePendingOutboxEntries();
            hasBootstrappedCollection.value = true;
            errorMessage.value = '';
            void flushPendingTodoMutations().catch((error) => {
                errorMessage.value = error instanceof Error ? error.message : translate('sync.syncRequestFailed');
            });
        } catch (error) {
            hasBootstrappedCollection.value = false;
            errorMessage.value = error instanceof Error ? error.message : translate('sync.unableLoadTodoSync');
        } finally {
            isLoading.value = false;
        }
    })();

    return bootstrapPromise;
}

export function useTodos() {
    const { data: todos } = useLiveQuery(
        (queryBuilder) => {
            if (!hasBootstrappedCollection.value) {
                return undefined;
            }

            return queryBuilder
                .from({ todos: todosCollection })
                .orderBy(({ todos: todo }) => todo.updated_at, 'desc')
                .orderBy(({ todos: todo }) => todo.created_at, 'desc')
                .orderBy(({ todos: todo }) => todo.id, 'desc');
        },
        [hasBootstrappedCollection],
    );
    const hasError = computed(() => errorMessage.value.length > 0);
    const pendingOutboxCount = computed(() => {
        return outboxEntries.value.filter((entry) => entry.status === 'queued' || entry.status === 'sending').length;
    });

    const hasOutboxEntries = computed(() => outboxEntries.value.length > 0);

    async function createTodo(title) {
        const normalizedTitle = title.trim();

        if (normalizedTitle.length === 0) {
            return;
        }

        errorMessage.value = '';

        const timestamp = new Date().toISOString();
        const todoId = crypto.randomUUID();
        const outboxEntry = {
            id: buildOutboxId('insert', todoId),
            type: 'insert',
            todoId,
            title: normalizedTitle,
        };
        upsertOutboxEntry({
            ...outboxEntry,
            status: 'sending',
            error: '',
        });
        const transaction = todosCollection.insert({
            id: todoId,
            title: normalizedTitle,
            completed: false,
            created_at: timestamp,
            updated_at: timestamp,
        });

        monitorPersistence(transaction, outboxEntry);
    }

    async function toggleTodo(todo) {
        errorMessage.value = '';
        const outboxEntry = {
            id: buildOutboxId('update', todo.id),
            type: 'update',
            todoId: todo.id,
            title: typeof todo.title === 'string' ? todo.title : '',
        };
        upsertOutboxEntry({
            ...outboxEntry,
            status: 'sending',
            error: '',
        });

        const transaction = todosCollection.update(todo.id, (draft) => {
            draft.completed = !Boolean(draft.completed);
            draft.updated_at = new Date().toISOString();
        });

        monitorPersistence(transaction, outboxEntry);
    }

    async function removeTodo(todo) {
        errorMessage.value = '';
        const outboxEntry = {
            id: buildOutboxId('delete', todo.id),
            type: 'delete',
            todoId: todo.id,
            title: typeof todo.title === 'string' ? todo.title : '',
        };
        upsertOutboxEntry({
            ...outboxEntry,
            status: 'sending',
            error: '',
        });

        const transaction = todosCollection.delete(todo.id);

        monitorPersistence(transaction, outboxEntry);
    }

    return {
        todos,
        isLoading,
        errorMessage,
        hasError,
        outboxEntries,
        hasOutboxEntries,
        pendingOutboxCount,
        createTodo,
        toggleTodo,
        removeTodo,
        refresh: bootstrapTodos,
    };
}

setTodoOutboxLifecycleReporter(applyOutboxLifecycle);
