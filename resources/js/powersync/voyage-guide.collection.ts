import { BasicIndex, createCollection } from "@tanstack/db";
import { powerSyncCollectionOptions } from "@tanstack/powersync-db-collection";
import { z } from "zod";
import { appVoyageGuidePowerSyncTable } from "./app.powersync-schema";

export const voyageGuideSchema = z.object({
    id: z.string(),
    voyage_id: z.string().nullable().default(null),
    guide_id: z.string().nullable().default(null),
});

export type VoyageGuideInput = z.input<typeof voyageGuideSchema>;
export type VoyageGuideOutput = z.output<typeof voyageGuideSchema>;

export function createVoyageGuideCollection(
    database: import("@powersync/web").PowerSyncDatabase,
    onError: (error: unknown) => void,
    onLoad?: () => void | (() => void) | Promise<void | (() => void)>,
) {
    const collection = createCollection({
        defaultIndexType: BasicIndex,
        ...powerSyncCollectionOptions({
            database,
            table: appVoyageGuidePowerSyncTable,
            schema: voyageGuideSchema,
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
