import { createAppPowerSyncCollection } from "./collection-defaults";
import { powerSyncCollectionOptions } from "@tanstack/powersync-db-collection";
import { z } from "zod";
import { appTripsPowerSyncTable } from "./app.powersync-schema";

export const tripsSchema = z.object({
    id: z.string(),
    program_id: z.string().nullable().default(null),
    product_id: z.string().nullable().default(null),
    scheduled_departure_at: z.string().transform((v) => new Date(v)).nullable().default(null),
});

export type TripInput = z.input<typeof tripsSchema>;
export type TripOutput = z.output<typeof tripsSchema>;

export function createTripsCollection(
    database: import("@powersync/web").PowerSyncDatabase,
    onError: (error: unknown) => void,
    onLoad?: () => void | (() => void) | Promise<void | (() => void)>,
) {
    const collection = createAppPowerSyncCollection('trips', {
        ...powerSyncCollectionOptions({
            database,
            table: appTripsPowerSyncTable,
            schema: tripsSchema,
            onDeserializationError: (error) => {
                onError(error);
            },
            ...(onLoad ? { onLoad } : {}),
        }),
    });

    collection.createIndex((row) => row.id);
    collection.createIndex((row) => row.program_id);
    collection.createIndex((row) => row.product_id);

    return collection;
}
