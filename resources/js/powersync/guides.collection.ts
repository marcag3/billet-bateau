import { createAppPowerSyncCollection } from './collection-defaults';
import { powerSyncCollectionOptions } from "@tanstack/powersync-db-collection";
import { z } from "zod";
import { appGuidesPowerSyncTable } from "./app.powersync-schema";

export const guidesSchema = z.object({
    id: z.string(),
    name: z.string().nullable().default(null),
    staff_user_id: z.string().nullable().default(null),
});

export type GuideInput = z.input<typeof guidesSchema>;
export type GuideOutput = z.output<typeof guidesSchema>;

export function createGuidesCollection(
    database: import("@powersync/web").PowerSyncDatabase,
    onError: (error: unknown) => void,
    onLoad?: () => void | (() => void) | Promise<void | (() => void)>,
) {
    const collection = createAppPowerSyncCollection('guides', {
        ...powerSyncCollectionOptions({
            database,
            table: appGuidesPowerSyncTable,
            schema: guidesSchema,
            onDeserializationError: (error) => {
                onError(error);
            },
            ...(onLoad ? { onLoad } : {}),
        }),
    });

    collection.createIndex((row) => row.id);

    return collection;
}
