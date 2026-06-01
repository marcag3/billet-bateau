import { createAppPowerSyncCollection } from './collection-defaults';
import { powerSyncCollectionOptions } from "@tanstack/powersync-db-collection";
import { z } from "zod";
import { appCheckInsPowerSyncTable } from "./app.powersync-schema";

export const checkInsSchema = z.object({
    id: z.string(),
    booking_id: z.string().nullable().default(null),
    voyage_id: z.string().nullable().default(null),
    notes: z.string().nullable().default(null),
});

export type CheckInInput = z.input<typeof checkInsSchema>;
export type CheckInOutput = z.output<typeof checkInsSchema>;

export function createCheckInsCollection(
    database: import("@powersync/web").PowerSyncDatabase,
    onError: (error: unknown) => void,
    onLoad?: () => void | (() => void) | Promise<void | (() => void)>,
) {
    const collection = createAppPowerSyncCollection('check_ins', {
        ...powerSyncCollectionOptions({
            database,
            table: appCheckInsPowerSyncTable,
            schema: checkInsSchema,
            onDeserializationError: (error) => {
                onError(error);
            },
            ...(onLoad ? { onLoad } : {}),
        }),
    });

    collection.createIndex((row) => row.id);
    collection.createIndex((row) => row.voyage_id);
    collection.createIndex((row) => row.booking_id);

    return collection;
}
