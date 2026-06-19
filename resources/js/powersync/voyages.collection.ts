import { createAppPowerSyncCollection } from './collection-defaults';
import { powerSyncCollectionOptions } from "@tanstack/powersync-db-collection";
import { z } from "zod";
import { appVoyagesPowerSyncTable } from "./app.powersync-schema";

const voyageDateField = () =>
    z.string().transform((v) => new Date(v)).nullable().default(null);

export const voyagesSchema = z.object({
    id: z.string(),
    program_id: z.string().nullable().default(null),
    user_id: z.string().nullable().default(null),
    trip_id: z.string().nullable().default(null),
    water_route_id: z.string().nullable().default(null),
    scheduled_departure_at: voyageDateField(),
    started_at: voyageDateField(),
    arrived_at: voyageDateField(),
    status: z.string().nullable().default(null),
});

export type VoyageInput = z.input<typeof voyagesSchema>;
export type VoyageOutput = z.output<typeof voyagesSchema>;

export function createVoyagesCollection(
    database: import("@powersync/web").PowerSyncDatabase,
    onError: (error: unknown) => void,
    onLoad?: () => void | (() => void) | Promise<void | (() => void)>,
) {
    const collection = createAppPowerSyncCollection('voyages', {
        ...powerSyncCollectionOptions({
            database,
            table: appVoyagesPowerSyncTable,
            schema: voyagesSchema,
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
