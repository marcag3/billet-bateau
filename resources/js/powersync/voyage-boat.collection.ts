import { BasicIndex, createCollection } from "@tanstack/db";
import { powerSyncCollectionOptions } from "@tanstack/powersync-db-collection";
import { z } from "zod";
import { appVoyageBoatPowerSyncTable } from "./app.powersync-schema";

export const voyageBoatSchema = z.object({
    id: z.string(),
    voyage_id: z.string().nullable().default(null),
    boat_id: z.string().nullable().default(null),
});

export type VoyageBoatInput = z.input<typeof voyageBoatSchema>;
export type VoyageBoatOutput = z.output<typeof voyageBoatSchema>;

export function createVoyageBoatCollection(
    database: import("@powersync/web").PowerSyncDatabase,
    onError: (error: unknown) => void,
    onLoad?: () => void | (() => void) | Promise<void | (() => void)>,
) {
    const collection = createCollection({
        defaultIndexType: BasicIndex,
        ...powerSyncCollectionOptions({
            database,
            table: appVoyageBoatPowerSyncTable,
            schema: voyageBoatSchema,
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
