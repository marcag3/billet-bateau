import { ref, shallowRef, type Ref, type ShallowRef } from "vue";
import type { PowerSyncDatabase } from "@powersync/web";
import type { createProgramsCollection } from "./programs.collection";
import type { createBoatTypesCollection } from "./boat-types.collection";
import type { createTicketTypesCollection } from "./ticket-types.collection";
import type { createBoatsCollection } from "./boats.collection";
import type { createWaterRoutesCollection } from "./water-routes.collection";
import type { createTripsCollection } from "./trips.collection";
import type { createBookingTicketsCollection } from "./booking-tickets.collection";
import type { createTemplateDaysCollection } from "./template-days.collection";
import type { createTemplateDaySlotsCollection } from "./template-day-slots.collection";
import type { createTemplateDayDatesCollection } from "./template-day-dates.collection";
import type { createMediaCollection } from "./media.collection";
import { translate } from "../utilities/i18n";

export const DB_FILENAME = "billbateau-app-v17.db";

export const loadFailedMessage = translate("sync.unableLoadSync");
export const persistenceLimitedMessage = translate("sync.persistenceLimited");

export type PowerSyncCollectionKey =
    | "programs"
    | "boat_types"
    | "boats"
    | "trips"
    | "ticket_types"
    | "booking_tickets"
    | "water_routes"
    | "template_days"
    | "template_day_slots"
    | "template_day_dates"
    | "media";

export type PowerSyncCollectionRefs = {
    [K in PowerSyncCollectionKey]: ShallowRef<PowerSyncCollectionInstance<K> | null>;
};

type PowerSyncCollectionInstanceMap = {
    programs: ReturnType<typeof createProgramsCollection>;
    boat_types: ReturnType<typeof createBoatTypesCollection>;
    boats: ReturnType<typeof createBoatsCollection>;
    trips: ReturnType<typeof createTripsCollection>;
    ticket_types: ReturnType<typeof createTicketTypesCollection>;
    booking_tickets: ReturnType<typeof createBookingTicketsCollection>;
    water_routes: ReturnType<typeof createWaterRoutesCollection>;
    template_days: ReturnType<typeof createTemplateDaysCollection>;
    template_day_slots: ReturnType<typeof createTemplateDaySlotsCollection>;
    template_day_dates: ReturnType<typeof createTemplateDayDatesCollection>;
    media: ReturnType<typeof createMediaCollection>;
};

type PowerSyncCollectionInstance<K extends PowerSyncCollectionKey> =
    PowerSyncCollectionInstanceMap[K];

export const collectionRefs: PowerSyncCollectionRefs = {
    programs: shallowRef<PowerSyncCollectionInstance<"programs"> | null>(null),
    boat_types: shallowRef<PowerSyncCollectionInstance<"boat_types"> | null>(null),
    boats: shallowRef<PowerSyncCollectionInstance<"boats"> | null>(null),
    trips: shallowRef<PowerSyncCollectionInstance<"trips"> | null>(null),
    ticket_types: shallowRef<PowerSyncCollectionInstance<"ticket_types"> | null>(
        null,
    ),
    booking_tickets: shallowRef<
        PowerSyncCollectionInstance<"booking_tickets"> | null
    >(null),
    water_routes: shallowRef<PowerSyncCollectionInstance<"water_routes"> | null>(
        null,
    ),
    template_days: shallowRef<PowerSyncCollectionInstance<"template_days"> | null>(
        null,
    ),
    template_day_slots: shallowRef<
        PowerSyncCollectionInstance<"template_day_slots"> | null
    >(null),
    template_day_dates: shallowRef<
        PowerSyncCollectionInstance<"template_day_dates"> | null
    >(null),
    media: shallowRef<PowerSyncCollectionInstance<"media"> | null>(null),
};

export const isLoading = ref(true);
export const errorMessage = ref("");
export const programsDeserializationError = ref<unknown>(null);
export const hasBootstrappedCollection = ref(false);
export const persistenceUnavailable = ref(false);
export const outboxPendingCount = ref(0);
export const outboxCommitError = ref("");
export let bootstrapPromise: Promise<void> | null = null;

export function setBootstrapPromise(value: Promise<void> | null): void {
    bootstrapPromise = value;
}

export const powerSyncDbRef = shallowRef<PowerSyncDatabase | null>(null);

export const currentUserIdRef = ref("");

export const activeProgramIdRef = ref("");

export let powerSyncStatusUnsubscribe: null | (() => void) = null;

export function setPowerSyncStatusUnsubscribe(
    value: null | (() => void),
): void {
    powerSyncStatusUnsubscribe = value;
}

/**
 * True only after `PowerSyncDatabase.connect()` resolves. Used so `program_scope`
 * is not subscribed before the connector is live.
 */
export let powerSyncConnectorConnected = false;

export function setPowerSyncConnectorConnected(value: boolean): void {
    powerSyncConnectorConnected = value;
}

/**
 * @param programId
 */
export function setActiveProgramId(programId: string | null | undefined): void {
    activeProgramIdRef.value =
        programId == null || programId === "" ? "" : String(programId).trim();
}

export function getActiveProgramIdRef(): Ref<string> {
    return activeProgramIdRef;
}
