import { createAppPowerSyncCollection } from './collection-defaults';
import { powerSyncCollectionOptions } from "@tanstack/powersync-db-collection";
import { z } from "zod";
import { appBookingsPowerSyncTable } from "./app.powersync-schema";

export const bookingsSchema = z.object({
    id: z.string(),
    program_id: z.string().nullable().default(null),
    trip_id: z.string().nullable().default(null),
    contact_name: z.string().nullable().default(null),
    contact_email: z.string().nullable().default(null),
});

export type BookingInput = z.input<typeof bookingsSchema>;
export type BookingOutput = z.output<typeof bookingsSchema>;

export function createBookingsCollection(
    database: import("@powersync/web").PowerSyncDatabase,
    onError: (error: unknown) => void,
    onLoad?: () => void | (() => void) | Promise<void | (() => void)>,
) {
    const collection = createAppPowerSyncCollection('bookings', {
        ...powerSyncCollectionOptions({
            database,
            table: appBookingsPowerSyncTable,
            schema: bookingsSchema,
            onDeserializationError: (error) => {
                onError(error);
            },
            ...(onLoad ? { onLoad } : {}),
        }),
    });

    collection.createIndex((row) => row.id);
    collection.createIndex((row) => row.program_id);
    collection.createIndex((row) => row.trip_id);

    return collection;
}
