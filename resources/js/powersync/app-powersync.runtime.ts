import { createCollection } from '@tanstack/db';
import { powerSyncCollectionOptions } from '@tanstack/powersync-db-collection';
import { PowerSyncDatabase } from '@powersync/web';
import { computed, ref, shallowRef } from 'vue';
import { fetchCurrentSession } from '../models/auth.api';
import { useAuthStore } from '../store/auth.store';
import { createAppPowerSyncConnector } from '../services/powersync.connector';
import {
    appAddressesPowerSyncTable,
    appBoatProgramPowerSyncTable,
    appBoatTypesPowerSyncTable,
    appBoatsPowerSyncTable,
    appProgramsPowerSyncTable,
    appMediaPowerSyncTable,
    appPowerSyncSchema,
    appTemplateDayDatesPowerSyncTable,
    appTemplateDaysPowerSyncTable,
    appTemplateDaySlotsPowerSyncTable,
    appTripsPowerSyncTable,
    appWaterRoutesPowerSyncTable,
} from './app.powersync-schema';
import { translate } from '../utilities/i18n';

const DB_FILENAME = 'billbateau-app-v12.db';

const loadFailedMessage = translate('sync.unableLoadSync');
const persistenceLimitedMessage = translate('sync.persistenceLimited');

/**
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
        'the internet connection appears to be offline',
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

/** @type {import('vue').Ref<string>} */
const currentUserIdRef = ref('');

/** @type {null | (() => void)} */
let powerSyncStatusUnsubscribe = null;

const collectionRefs = {
    programs: shallowRef(null),
    addresses: shallowRef(null),
    boat_types: shallowRef(null),
    boats: shallowRef(null),
    boat_program: shallowRef(null),
    trips: shallowRef(null),
    water_routes: shallowRef(null),
    template_days: shallowRef(null),
    template_day_slots: shallowRef(null),
    template_day_dates: shallowRef(null),
    media: shallowRef(null),
};

const tableByName = {
    programs: appProgramsPowerSyncTable,
    addresses: appAddressesPowerSyncTable,
    boat_types: appBoatTypesPowerSyncTable,
    boats: appBoatsPowerSyncTable,
    boat_program: appBoatProgramPowerSyncTable,
    trips: appTripsPowerSyncTable,
    water_routes: appWaterRoutesPowerSyncTable,
    template_days: appTemplateDaysPowerSyncTable,
    template_day_slots: appTemplateDaySlotsPowerSyncTable,
    template_day_dates: appTemplateDayDatesPowerSyncTable,
    media: appMediaPowerSyncTable,
};

/** @type {import('vue').Ref<string>} */
const programSyncScopeIdRef = ref('');

/** @type {{ unsubscribe: () => void } | null} */
let programScopeSubscription = null;

/**
 * Active program id for `program_scope` PowerSync stream (roster, trips, water routes, template days).
 *
 * @returns {import('vue').Ref<string>}
 */
export function getProgramSyncScopeIdRef() {
    return programSyncScopeIdRef;
}

/**
 * @param {string | null | undefined} programId
 * @returns {Promise<void>}
 */
export async function setProgramSyncScopeId(programId) {
    programSyncScopeIdRef.value =
        programId == null || programId === '' ? '' : String(programId).trim();
    await resyncProgramScopeSubscription();
}

/**
 * @returns {Promise<void>}
 */
async function resyncProgramScopeSubscription() {
    const db = powerSyncDbRef.value;
    if (!db) {
        return;
    }

    if (programScopeSubscription) {
        programScopeSubscription.unsubscribe();
        programScopeSubscription = null;
    }

    const pid = programSyncScopeIdRef.value.trim();
    if (pid.length === 0) {
        return;
    }

    programScopeSubscription = await db.syncStream('program_scope', { program_id: pid }).subscribe();
}

export async function refreshOutboxSnapshot() {
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
 * @returns {Promise<string>}
 */
async function resolveAuthenticatedUserId() {
    const authStore = useAuthStore();
    const existing = authStore.user?.id;
    if (existing !== undefined && existing !== null) {
        return String(existing);
    }

    const session = await fetchCurrentSession();
    const u = session.user as { id?: string | number } | null | undefined;
    if (!session.isAuthenticated || u == null || u.id === undefined || u.id === null) {
        throw new Error('Missing authenticated user id.');
    }

    return String(u.id);
}

/**
 * Wait until PowerSync upload queue is empty (best-effort polling).
 *
 * @param {import('@powersync/web').PowerSyncDatabase} db
 * @param {{ timeoutMs?: number, pollMs?: number }} [opts]
 * @returns {Promise<void>}
 */
export async function waitForUploadQueueDrained(db, { timeoutMs = 45000, pollMs = 75 } = {}) {
    const started = Date.now();

    while (Date.now() - started < timeoutMs) {
        const stats = await db.getUploadQueueStats(false);
        const count = typeof stats?.count === 'number' ? stats.count : 0;
        if (count === 0) {
            return;
        }
        await new Promise((resolve) => {
            setTimeout(resolve, pollMs);
        });
    }

    throw new Error('Timed out waiting for PowerSync upload queue to drain.');
}

/**
 * @returns {Promise<void>}
 */
export async function bootstrapAppPowerSync() {
    if (hasBootstrappedCollection.value && powerSyncDbRef.value) {
        try {
            await Promise.all(
                Object.values(collectionRefs)
                    .map((r) => r.value)
                    .filter(Boolean)
                    .map((c) => c.preload()),
            );
            errorMessage.value = '';
        } catch (error) {
            errorMessage.value = error instanceof Error ? error.message : loadFailedMessage;
        }

        await refreshOutboxSnapshot();
        return;
    }

    if (bootstrapPromise !== null) {
        await bootstrapPromise;
        return;
    }

    bootstrapPromise = (async () => {
        try {
            currentUserIdRef.value = await resolveAuthenticatedUserId();

            const db = new PowerSyncDatabase({
                schema: appPowerSyncSchema,
                database: { dbFilename: DB_FILENAME },
                ...(import.meta.env.DEV ? { flags: { useWebWorker: false } } : {}),
            });

            await db.init();

            powerSyncDbRef.value = db;

            powerSyncStatusUnsubscribe = db.registerListener({
                statusChanged: (status) => {
                    const uploadError = status.dataFlowStatus?.uploadError;
                    const formatted = formatPowerSyncUploadError(uploadError);
                    outboxCommitError.value =
                        isBenignPowerSyncUploadFailure(uploadError, formatted) || formatted.length === 0
                            ? ''
                            : formatted;
                    void refreshOutboxSnapshot();
                },
            });

            for (const name of Object.keys(tableByName)) {
                const table = tableByName[name];
                const collectionOptions = powerSyncCollectionOptions({
                    database: db,
                    table,
                });
                const collection = createCollection(/** @type {any} */(collectionOptions));
                collectionRefs[name].value = collection;
            }

            const connector = createAppPowerSyncConnector();

            await db.connect(connector);

            await resyncProgramScopeSubscription();

            try {
                await Promise.all(
                    Object.values(collectionRefs)
                        .map((r) => r.value)
                        .filter(Boolean)
                        .map((c) => c.preload()),
                );
            } catch (preloadError) {
                hasBootstrappedCollection.value = true;
                errorMessage.value = preloadError instanceof Error ? preloadError.message : loadFailedMessage;
                await refreshOutboxSnapshot();
                return;
            }

            hasBootstrappedCollection.value = true;
            errorMessage.value = '';
            persistenceUnavailable.value = false;
            await refreshOutboxSnapshot();
        } catch (error) {
            bootstrapPromise = null;
            hasBootstrappedCollection.value = false;
            if (programScopeSubscription) {
                programScopeSubscription.unsubscribe();
                programScopeSubscription = null;
            }
            powerSyncStatusUnsubscribe?.();
            powerSyncStatusUnsubscribe = null;
            try {
                await powerSyncDbRef.value?.close();
            } catch {
                // ignore close errors during failed bootstrap
            }
            powerSyncDbRef.value = null;
            for (const ref of Object.values(collectionRefs)) {
                ref.value = null;
            }
            persistenceUnavailable.value = true;
            errorMessage.value = error instanceof Error ? error.message : loadFailedMessage;
        } finally {
            isLoading.value = false;
        }
    })();

    await bootstrapPromise;
}

export function useAppPowerSyncOutbox() {
    return {
        outboxPendingCount,
        outboxCommitError,
        hasOutboxCommitError: computed(() => outboxCommitError.value.length > 0),
        dismissOutboxCommitError: () => {
            outboxCommitError.value = '';
        },
        refreshOutbox: refreshOutboxSnapshot,
        hasPendingOutboxWrites: computed(() => outboxPendingCount.value > 0),
    };
}

export function getPowerSyncDbRef() {
    return powerSyncDbRef;
}

export function getProgramsCollectionRef() {
    return collectionRefs.programs;
}

export function getAddressesCollectionRef() {
    return collectionRefs.addresses;
}

export function getBoatTypesCollectionRef() {
    return collectionRefs.boat_types;
}

export function getBoatsCollectionRef() {
    return collectionRefs.boats;
}

export function getBoatProgramCollectionRef() {
    return collectionRefs.boat_program;
}

export function getTripsCollectionRef() {
    return collectionRefs.trips;
}

export function getWaterRoutesCollectionRef() {
    return collectionRefs.water_routes;
}

export function getTemplateDaysCollectionRef() {
    return collectionRefs.template_days;
}

export function getTemplateDaySlotsCollectionRef() {
    return collectionRefs.template_day_slots;
}

export function getTemplateDayDatesCollectionRef() {
    return collectionRefs.template_day_dates;
}

export function getMediaCollectionRef() {
    return collectionRefs.media;
}

export function getCurrentUserIdRef() {
    return currentUserIdRef;
}

export function getAppPowerSyncLoadingRef() {
    return isLoading;
}

export function getAppPowerSyncErrorMessageRef() {
    return errorMessage;
}

export function getAppPowerSyncBootstrappedRef() {
    return hasBootstrappedCollection;
}

export function getAppPowerSyncPersistenceUnavailableRef() {
    return persistenceUnavailable;
}

export function getPersistenceLimitedMessage() {
    return persistenceLimitedMessage;
}
