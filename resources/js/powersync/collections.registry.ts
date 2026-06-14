import type { PowerSyncDatabase } from "@powersync/web";
import { createProgramsCollection } from "./programs.collection";
import { createProgramUserCollection } from "./program-user.collection";
import { createBoatTypesCollection } from "./boat-types.collection";
import { createTicketTypesCollection } from "./ticket-types.collection";
import { createBoatsCollection } from "./boats.collection";
import { createWaterRoutesCollection } from "./water-routes.collection";
import { createTripsCollection } from "./trips.collection";
import { createProductsCollection } from "./products.collection";
import { createBookingTicketsCollection } from "./booking-tickets.collection";
import { createBookingsCollection } from "./bookings.collection";
import { createTemplateDaysCollection } from "./template-days.collection";
import { createTemplateDaySlotsCollection } from "./template-day-slots.collection";
import { createTemplateDayDatesCollection } from "./template-day-dates.collection";
import { createGuidesCollection } from "./guides.collection";
import { createVoyagesCollection } from "./voyages.collection";
import { createPassengersCollection } from "./passengers.collection";
import { createCheckInsCollection } from "./check-ins.collection";
import { createVoyageBoatCollection } from "./voyage-boat.collection";
import { createVoyageGuideCollection } from "./voyage-guide.collection";
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
    program_user: (db, onError, onLoad) =>
        createProgramUserCollection(db, onError, onLoad),
    boat_types: (db, onError, onLoad) =>
        createBoatTypesCollection(db, onError, onLoad),
    boats: (db, onError, onLoad) => createBoatsCollection(db, onError, onLoad),
    products: (db, onError, onLoad) =>
        createProductsCollection(db, onError, onLoad),
    trips: (db, onError, onLoad) => createTripsCollection(db, onError, onLoad),
    ticket_types: (db, onError, onLoad) =>
        createTicketTypesCollection(db, onError, onLoad),
    bookings: (db, onError, onLoad) =>
        createBookingsCollection(db, onError, onLoad),
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
    guides: (db, onError, onLoad) => createGuidesCollection(db, onError, onLoad),
    voyages: (db, onError, onLoad) => createVoyagesCollection(db, onError, onLoad),
    passengers: (db, onError, onLoad) =>
        createPassengersCollection(db, onError, onLoad),
    check_ins: (db, onError, onLoad) =>
        createCheckInsCollection(db, onError, onLoad),
    voyage_boat: (db, onError, onLoad) =>
        createVoyageBoatCollection(db, onError, onLoad),
    voyage_guide: (db, onError, onLoad) =>
        createVoyageGuideCollection(db, onError, onLoad),
};

export function wirePowerSyncCollections(db: PowerSyncDatabase): void {
    const sharedOnError = (err: unknown) => {
        console.error("PowerSync collection deserialization failed:", err);
        errorMessage.value =
            err instanceof Error ? err.message : loadFailedMessage;
    };

    for (const name of Object.keys(collectionRefs) as PowerSyncCollectionKey[]) {
        const factory = collectionFactories[name];
        const collection = factory(db, sharedOnError, noopOnLoad);
        collectionRefs[name].value = collection;
    }
}
