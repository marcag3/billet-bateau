import { createAppPowerSyncCollection } from './collection-defaults';
import { powerSyncCollectionOptions } from "@tanstack/powersync-db-collection";
import { z } from "zod";
import { appPassengersPowerSyncTable } from "./app.powersync-schema";

export const passengersSchema = z.object({
    id: z.string(),
    voyage_id: z.string().nullable().default(null),
    name: z.string().nullable().default(null),
    booking_id: z.string().nullable().default(null),
    check_in_id: z.string().nullable().default(null),
    notes: z.string().nullable().default(null),
});

export type PassengerInput = z.input<typeof passengersSchema>;
export type PassengerOutput = z.output<typeof passengersSchema>;

export function createPassengersCollection(
    database: import("@powersync/web").PowerSyncDatabase,
    onError: (error: unknown) => void,
    onLoad?: () => void | (() => void) | Promise<void | (() => void)>,
) {
    const collection = createAppPowerSyncCollection('passengers', {
        ...powerSyncCollectionOptions({
            database,
            table: appPassengersPowerSyncTable,
            schema: passengersSchema,
            onDeserializationError: (error) => {
                onError(error);
            },
            ...(onLoad ? { onLoad } : {}),
        }),
    });

    collection.createIndex((row) => row.id);
    collection.createIndex((row) => row.voyage_id);

    return collection;
}
