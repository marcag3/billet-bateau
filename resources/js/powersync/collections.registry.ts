import type { PowerSyncDatabase } from "@powersync/web";
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
import {
    collectionRefs,
    errorMessage,
    loadFailedMessage,
    programsDeserializationError,
    type PowerSyncCollectionKey,
} from "./powersync-runtime-state";

const noopOnLoad = async (): Promise<void> => {
    // `user_scope` / `program_scope` are attached in `streams.ts` + `bootstrap.ts`
    // after `db.connect()` so replication ordering stays correct.
};

const collectionFactories: {
    [K in PowerSyncCollectionKey]: (
        db: PowerSyncDatabase,
        onError: (error: unknown) => void,
        onLoad?: () => void | (() => void) | Promise<void | (() => void)>,
    ) => NonNullable<(typeof collectionRefs)[K]["value"]>;
} = {
    programs: (db, onError, onLoad) =>
        createProgramsCollection(
            db,
            (err) => {
                programsDeserializationError.value = err;
                onError(err);
            },
            onLoad,
        ),
    boat_types: (db, onError, onLoad) =>
        createBoatTypesCollection(db, onError, onLoad),
    boats: (db, onError, onLoad) => createBoatsCollection(db, onError, onLoad),
    trips: (db, onError, onLoad) => createTripsCollection(db, onError, onLoad),
    ticket_types: (db, onError, onLoad) =>
        createTicketTypesCollection(db, onError, onLoad),
    booking_tickets: (db, onError, onLoad) =>
        createBookingTicketsCollection(db, onError, onLoad),
    water_routes: (db, onError, onLoad) =>
        createWaterRoutesCollection(db, onError, onLoad),
    template_days: (db, onError, onLoad) =>
        createTemplateDaysCollection(db, onError, onLoad),
    template_day_slots: (db, onError, onLoad) =>
        createTemplateDaySlotsCollection(db, onError, onLoad),
    template_day_dates: (db, onError, onLoad) =>
        createTemplateDayDatesCollection(db, onError, onLoad),
    media: (db, onError, onLoad) => createMediaCollection(db, onError, onLoad),
};

export function wirePowerSyncCollections(db: PowerSyncDatabase): void {
    const sharedOnError = (err: unknown) => {
        errorMessage.value =
            err instanceof Error ? err.message : loadFailedMessage;
    };

    for (const name of Object.keys(collectionRefs) as PowerSyncCollectionKey[]) {
        const factory = collectionFactories[name];
        const collection = factory(db, sharedOnError, noopOnLoad);
        collectionRefs[name].value = collection;
    }
}
