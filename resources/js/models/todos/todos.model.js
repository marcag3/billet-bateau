import { createCollection } from '@tanstack/db';
import { powerSyncCollectionOptions } from '@tanstack/powersync-db-collection';
import { PowerSyncDatabase } from '@powersync/web';
import { computed, ref, shallowRef } from 'vue';
import { createTodosPowerSyncConnector } from '../../services/powersync.connector';
import { useAuthStore } from '../../store/auth.store';
import { destroy, store, update } from '../../routes/todos';
import { fetchCurrentSession } from '../auth.api';
import { createEntityApi } from '../entity.api';
import { defineRelations } from '../entity.relations';
import { defineModel } from '../model.definition';
import { useEntityList } from '../entity.queries';
import { todosPowerSyncSchema, todosPowerSyncTable } from './todos.powersync-schema.js';
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
    persistenceSchemaVersion: 2,
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

const loadFailedMessage = translate('sync.unableLoadTodoSync');
const persistenceLimitedMessage = translate('sync.persistenceLimited');

/**
 * Upload errors may be real Error instances or plain `{ name, message, stack }` objects
 * after crossing a worker MessagePort (see PowerSync SyncStatus.serializeError).
 *
 * @param {unknown} uploadError
 * @returns {string}
 */
function formatPowerSyncUploadError(uploadError) {
    if (uploadError == null || uploadError === '') {
        return '';
    }

    if (typeof uploadError === 'string') {
        return uploadError;
    }

    if (uploadError instanceof Error) {
        return uploadError.message || uploadError.name || '';
    }

    if (typeof uploadError === 'object') {
        const name = typeof uploadError.name === 'string' ? uploadError.name : '';
        const message = typeof uploadError.message === 'string' ? uploadError.message : '';
        if (message.length > 0) {
            return name.length > 0 && !message.includes(name) ? `${name}: ${message}` : message;
        }
        if (name.length > 0) {
            return name;
        }
        try {
            return JSON.stringify(uploadError);
        } catch {
            return '';
        }
    }

    return String(uploadError);
}

/**
 * PowerSync retries uploads; failures from being offline or flaky networks are expected.
 *
 * @param {unknown} uploadError
 * @param {string} formattedMessage
 * @returns {boolean}
 */
function isBenignPowerSyncUploadFailure(uploadError, formattedMessage) {
    if (uploadError == null || uploadError === '') {
        return true;
    }

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        return true;
    }

    const text = formattedMessage.toLowerCase();

    const benignFragments = [
        'failed to fetch',
        'networkerror',
        'network request failed',
        'load failed',
        'net::err',
        'the internet connection appears to be offline', // Safari
        'aborted',
        'abort',
        'delaying due to previously encountered crud item',
    ];

    return benignFragments.some((fragment) => text.includes(fragment));
}

const isLoading = ref(true);
const errorMessage = ref('');
const hasBootstrappedCollection = ref(false);
const persistenceUnavailable = ref(false);
const outboxPendingCount = ref(0);
const outboxCommitError = ref('');
let bootstrapPromise = null;

/** @type {import('vue').ShallowRef<import('@powersync/web').PowerSyncDatabase | null>} */
const powerSyncDbRef = shallowRef(null);

/** @type {import('vue').ShallowRef<import('@tanstack/db').Collection | null>} */
const todosCollectionRef = shallowRef(null);

/** @type {import('vue').Ref<string>} */
const currentUserIdRef = ref('');

/** @type {null | (() => void)} */
let powerSyncStatusUnsubscribe = null;

async function refreshOutboxSnapshot() {
    const db = powerSyncDbRef.value;

    if (!db) {
        outboxPendingCount.value = 0;
        return;
    }

    try {
        const stats = await db.getUploadQueueStats(false);
        outboxPendingCount.value = typeof stats?.count === 'number' ? stats.count : 0;
    } catch {
        outboxPendingCount.value = 0;
    }
}

/**
 * Prefer Pinia session user; fall back to `/api/auth/me` when user is not hydrated (e.g. offline edge cases).
 *
 * @returns {Promise<string>}
 */
async function resolveAuthenticatedUserId() {
    const authStore = useAuthStore();
    const existing = authStore.user?.id;
    if (existing !== undefined && existing !== null) {
        return String(existing);
    }

    const session = await fetchCurrentSession();
    if (!session.isAuthenticated || session.user?.id === undefined || session.user?.id === null) {
        throw new Error('Missing authenticated user id.');
    }

    return String(session.user.id);
}

/**
 * @returns {Promise<import('@tanstack/db').Collection | null>}
 */
export async function bootstrapTodos() {
    if (hasBootstrappedCollection.value && todosCollectionRef.value && powerSyncDbRef.value) {
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
            currentUserIdRef.value = await resolveAuthenticatedUserId();

            const db = new PowerSyncDatabase({
                schema: todosPowerSyncSchema,
                database: { dbFilename: 'billbateau-powersync.db' },
            });

            await db.init();

            powerSyncDbRef.value = db;

            powerSyncStatusUnsubscribe = db.registerListener({
                statusChanged: (status) => {
                    const uploadError = status.dataFlowStatus?.uploadError;
                    const formatted = formatPowerSyncUploadError(uploadError);
                    // #region agent log
                    try {
                        if (formatted.length > 0) {
                            fetch('http://localhost:7565/ingest/392e3314-4174-4627-903d-36c5d530a41d', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'd855ad' },
                                body: JSON.stringify({
                                    sessionId: 'd855ad',
                                    runId: 'pre-fix',
                                    hypothesisId: 'H5',
                                    location: 'todos.model.js:statusChanged',
                                    message: 'powersync upload error surfaced',
                                    data: {
                                        formattedLen: formatted.length,
                                        formattedPreview: formatted.slice(0, 120),
                                        benign: isBenignPowerSyncUploadFailure(uploadError, formatted),
                                    },
                                    timestamp: Date.now(),
                                }),
                            }).catch(() => {});
                        }
                    } catch {
                        /* ignore */
                    }
                    // #endregion
                    outboxCommitError.value =
                        isBenignPowerSyncUploadFailure(uploadError, formatted) || formatted.length === 0
                            ? ''
                            : formatted;
                    void refreshOutboxSnapshot();
                },
            });

            const collectionOptions = powerSyncCollectionOptions({
                database: db,
                table: todosPowerSyncTable,
            });

            const collection = createCollection(/** @type {any} */ (collectionOptions));
            todosCollectionRef.value = collection;

            const connector = createTodosPowerSyncConnector();
            await db.connect(connector);

            try {
                await collection.preload();
            } catch (preloadError) {
                hasBootstrappedCollection.value = true;
                errorMessage.value = preloadError instanceof Error ? preloadError.message : loadFailedMessage;
                await refreshOutboxSnapshot();
                return collection;
            }

            hasBootstrappedCollection.value = true;
            errorMessage.value = '';
            persistenceUnavailable.value = false;
            await refreshOutboxSnapshot();
            return collection;
        } catch (error) {
            bootstrapPromise = null;
            hasBootstrappedCollection.value = false;
            powerSyncStatusUnsubscribe?.();
            powerSyncStatusUnsubscribe = null;
            try {
                await powerSyncDbRef.value?.close();
            } catch {
                // ignore close errors during failed bootstrap
            }
            powerSyncDbRef.value = null;
            todosCollectionRef.value = null;
            persistenceUnavailable.value = true;
            errorMessage.value = error instanceof Error ? error.message : loadFailedMessage;
            return null;
        } finally {
            isLoading.value = false;
        }
    })();

    return bootstrapPromise;
}

export function useTodos() {
    const { data: todos } = useEntityList({
        enabledRef: hasBootstrappedCollection,
        alias: todosModelDefinition.name,
        collection: todosCollectionRef,
        orderBy: todosModelDefinition.orderBy ?? [],
        relations: todosModelDefinition.relations ?? {},
        relationHandlers: [],
    });

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

        if (!collection) {
            return;
        }

        const userId = Number.parseInt(currentUserIdRef.value, 10);

        if (!Number.isFinite(userId)) {
            // #region agent log
            try {
                fetch('http://localhost:7565/ingest/392e3314-4174-4627-903d-36c5d530a41d', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'd855ad' },
                    body: JSON.stringify({
                        sessionId: 'd855ad',
                        runId: 'pre-fix',
                        hypothesisId: 'H2',
                        location: 'todos.model.js:createTodo',
                        message: 'createTodo aborted invalid userId',
                        data: { currentUserIdRef: String(currentUserIdRef.value) },
                        timestamp: Date.now(),
                    }),
                }).catch(() => {});
            } catch {
                /* ignore */
            }
            // #endregion
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
        persistenceLimitedMessage,
        outboxPendingCount,
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
        hasPendingOutboxWrites: computed(() => outboxPendingCount.value > 0),
    };
}
