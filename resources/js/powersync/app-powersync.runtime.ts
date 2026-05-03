import { PowerSyncDatabase } from "@powersync/web";
import { computed, ref, shallowRef } from "vue";
import { fetchCurrentSession } from "../models/auth.api";
import { useAuthStore } from "../store/auth.store";
import { createAppPowerSyncConnector } from "../services/powersync.connector";
import { appPowerSyncSchema } from "./app.powersync-schema";
import { createProgramsCollection } from "./programs.collection";
import { createBoatTypesCollection } from "./boat-types.collection";
import { createTicketTypesCollection } from "./ticket-types.collection";
import { createBoatsCollection } from "./boats.collection";
import { createWaterRoutesCollection } from "./water-routes.collection";
import { createTripsCollection } from "./trips.collection";
import { createBookingTicketsCollection } from "./booking-tickets.collection";
import { createTemplateDaysCollection } from "./template-days.collection";
import { createTemplateDaySlotsCollection } from "./template-day-slots.collection";
import { createTemplateDayDatesCollection } from "./template-day-dates.collection";
import { createMediaCollection } from "./media.collection";
import { translate } from "../utilities/i18n";

const DB_FILENAME = "billbateau-app-v16.db";

const loadFailedMessage = translate("sync.unableLoadSync");
const persistenceLimitedMessage = translate("sync.persistenceLimited");

/**
 * @param {unknown} uploadError
 * @returns {string}
 */
function formatPowerSyncUploadError(uploadError) {
    if (uploadError == null || uploadError === "") {
        return "";
    }

    if (typeof uploadError === "string") {
        return uploadError;
    }

    if (uploadError instanceof Error) {
        return uploadError.message || uploadError.name || "";
    }

    if (typeof uploadError === "object") {
        const name =
            typeof uploadError.name === "string" ? uploadError.name : "";
        const message =
            typeof uploadError.message === "string" ? uploadError.message : "";
        if (message.length > 0) {
            return name.length > 0 && !message.includes(name)
                ? `${name}: ${message}`
                : message;
        }
        if (name.length > 0) {
            return name;
        }
        try {
            return JSON.stringify(uploadError);
        } catch {
            return "";
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
    if (uploadError == null || uploadError === "") {
        return true;
    }

    if (typeof navigator !== "undefined" && navigator.onLine === false) {
        return true;
    }

    const text = formattedMessage.toLowerCase();

    const benignFragments = [
        "failed to fetch",
        "networkerror",
        "network request failed",
        "load failed",
        "net::err",
        "the internet connection appears to be offline",
        "aborted",
        "abort",
        "delaying due to previously encountered crud item",
    ];

    return benignFragments.some((fragment) => text.includes(fragment));
}

const isLoading = ref(true);
const errorMessage = ref("");
const programsDeserializationError = ref<unknown>(null);
const hasBootstrappedCollection = ref(false);
const persistenceUnavailable = ref(false);
const outboxPendingCount = ref(0);
const outboxCommitError = ref("");
let bootstrapPromise = null;

/** @type {import('vue').ShallowRef<import('@powersync/web').PowerSyncDatabase | null>} */
const powerSyncDbRef = shallowRef(null);

/** @type {import('vue').Ref<string>} */
const currentUserIdRef = ref("");

/** @type {null | (() => void)} */
let powerSyncStatusUnsubscribe = null;

const collectionRefs = {
    programs: shallowRef<ReturnType<typeof createProgramsCollection> | null>(
        null,
    ),
    boat_types: shallowRef<ReturnType<typeof createBoatTypesCollection> | null>(
        null,
    ),
    boats: shallowRef<ReturnType<typeof createBoatsCollection> | null>(null),
    trips: shallowRef<ReturnType<typeof createTripsCollection> | null>(null),
    ticket_types: shallowRef<ReturnType<
        typeof createTicketTypesCollection
    > | null>(null),
    booking_tickets: shallowRef<ReturnType<
        typeof createBookingTicketsCollection
    > | null>(null),
    water_routes: shallowRef<ReturnType<
        typeof createWaterRoutesCollection
    > | null>(null),
    template_days: shallowRef<ReturnType<
        typeof createTemplateDaysCollection
    > | null>(null),
    template_day_slots: shallowRef<ReturnType<
        typeof createTemplateDaySlotsCollection
    > | null>(null),
    template_day_dates: shallowRef<ReturnType<
        typeof createTemplateDayDatesCollection
    > | null>(null),
    media: shallowRef<ReturnType<typeof createMediaCollection> | null>(null),
};

/** @type {import('vue').Ref<string>} */
const activeProgramIdRef = ref("");

/**
 * Active program id for `program_scope` PowerSync stream (boat types, media, roster, trips, water routes, template days).
 *
 * @returns {import('vue').Ref<string>}
 */
export function getActiveProgramIdRef() {
    return activeProgramIdRef;
}

/**
 * @param {string | null | undefined} programId
 */
export function setActiveProgramId(programId) {
    activeProgramIdRef.value =
        programId == null || programId === "" ? "" : String(programId).trim();
}

export async function refreshOutboxSnapshot() {
    const db = powerSyncDbRef.value;

    if (!db) {
        outboxPendingCount.value = 0;
        return;
    }

    try {
        const stats = await db.getUploadQueueStats(false);
        outboxPendingCount.value =
            typeof stats?.count === "number" ? stats.count : 0;
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
    if (
        !session.isAuthenticated ||
        u == null ||
        u.id === undefined ||
        u.id === null
    ) {
        throw new Error("Missing authenticated user id.");
    }

    return String(u.id);
}

const collectionFactories = {
    programs: (db: PowerSyncDatabase, onError: (error: unknown) => void) =>
        createProgramsCollection(db, (error) => {
            programsDeserializationError.value = error;
            onError(error);
        }),
    boat_types: (db: PowerSyncDatabase, onError: (error: unknown) => void) =>
        createBoatTypesCollection(db, onError),
    boats: (db: PowerSyncDatabase, onError: (error: unknown) => void) =>
        createBoatsCollection(db, onError),
    trips: (db: PowerSyncDatabase, onError: (error: unknown) => void) =>
        createTripsCollection(db, onError),
    ticket_types: (db: PowerSyncDatabase, onError: (error: unknown) => void) =>
        createTicketTypesCollection(db, onError),
    booking_tickets: (
        db: PowerSyncDatabase,
        onError: (error: unknown) => void,
    ) => createBookingTicketsCollection(db, onError),
    water_routes: (db: PowerSyncDatabase, onError: (error: unknown) => void) =>
        createWaterRoutesCollection(db, onError),
    template_days: (db: PowerSyncDatabase, onError: (error: unknown) => void) =>
        createTemplateDaysCollection(db, onError),
    template_day_slots: (
        db: PowerSyncDatabase,
        onError: (error: unknown) => void,
    ) => createTemplateDaySlotsCollection(db, onError),
    template_day_dates: (
        db: PowerSyncDatabase,
        onError: (error: unknown) => void,
    ) => createTemplateDayDatesCollection(db, onError),
    media: (db: PowerSyncDatabase, onError: (error: unknown) => void) =>
        createMediaCollection(db, onError),
};

/**
 * @returns {Promise<void>}
 */
export async function bootstrapAppPowerSync() {
    if (hasBootstrappedCollection.value && powerSyncDbRef.value) {
        errorMessage.value = "";
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
                ...(import.meta.env.DEV
                    ? { flags: { useWebWorker: false } }
                    : {}),
            });

            await db.init();

            powerSyncDbRef.value = db;

            powerSyncStatusUnsubscribe = db.registerListener({
                statusChanged: (status) => {
                    const uploadError = status.dataFlowStatus?.uploadError;
                    const formatted = formatPowerSyncUploadError(uploadError);
                    outboxCommitError.value =
                        isBenignPowerSyncUploadFailure(
                            uploadError,
                            formatted,
                        ) || formatted.length === 0
                            ? ""
                            : formatted;
                    void refreshOutboxSnapshot();
                },
            });

            const sharedOnError = (error: unknown) => {
                errorMessage.value =
                    error instanceof Error ? error.message : loadFailedMessage;
            };

            for (const name of Object.keys(collectionRefs)) {
                const factory =
                    collectionFactories[
                        name as keyof typeof collectionFactories
                    ];
                if (!factory) continue;

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const collection: any = factory(db, sharedOnError);

                if (name === "programs") {
                    collection.onLoad(async () => {
                        const sub = await db
                            .syncStream("user_scope")
                            .subscribe();
                        return () => {
                            sub.unsubscribe();
                        };
                    });
                } else {
                    collection.onLoad(async () => {
                        const pid = activeProgramIdRef.value.trim();
                        if (pid.length === 0) return;
                        const sub = await db
                            .syncStream("program_scope", { program_id: pid })
                            .subscribe();
                        return () => {
                            sub.unsubscribe();
                        };
                    });
                }

                collectionRefs[name].value = collection;
            }

            const connector = createAppPowerSyncConnector();

            await db.connect(connector);

            hasBootstrappedCollection.value = true;
            errorMessage.value = "";
            persistenceUnavailable.value = false;
            await refreshOutboxSnapshot();
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
            for (const ref of Object.values(collectionRefs)) {
                ref.value = null;
            }
            persistenceUnavailable.value = true;
            errorMessage.value =
                error instanceof Error ? error.message : loadFailedMessage;
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
        hasOutboxCommitError: computed(
            () => outboxCommitError.value.length > 0,
        ),
        dismissOutboxCommitError: () => {
            outboxCommitError.value = "";
        },
        refreshOutbox: refreshOutboxSnapshot,
        hasPendingOutboxWrites: computed(() => outboxPendingCount.value > 0),
    };
}

export function getPowerSyncDbRef() {
    return powerSyncDbRef;
}

export function getProgramsCollection() {
    return collectionRefs.programs;
}

export function getProgramsDeserializationErrorRef() {
    return programsDeserializationError;
}

export function getBoatTypesCollection() {
    return collectionRefs.boat_types;
}

export function getBoatsCollection() {
    return collectionRefs.boats;
}

export function getTripsCollection() {
    return collectionRefs.trips;
}

export function getTicketTypesCollection() {
    return collectionRefs.ticket_types;
}

export function getBookingTicketsCollection() {
    return collectionRefs.booking_tickets;
}

export function getWaterRoutesCollection() {
    return collectionRefs.water_routes;
}

export function getTemplateDaysCollection() {
    return collectionRefs.template_days;
}

export function getTemplateDaySlotsCollection() {
    return collectionRefs.template_day_slots;
}

export function getTemplateDayDatesCollection() {
    return collectionRefs.template_day_dates;
}

export function getMediaCollection() {
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
