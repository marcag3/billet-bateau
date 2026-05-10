import { BasicIndex, createCollection } from '@tanstack/db';
import { powerSyncCollectionOptions } from '@tanstack/powersync-db-collection';
import { z } from 'zod';
import { appBoatTypesPowerSyncTable } from './app.powersync-schema';

export const boatTypesSchema = z.object({
    id: z.string(),
    program_id: z.string().nullable().default(null),
    name: z.string().min(1, "Boat type name is required").nullable().default(null),
    banner_object_key: z.string().nullable().default(null),
    banner_mime_type: z.string().nullable().default(null),
    banner_size_bytes: z.number().nullable().default(null),
    banner_etag: z.string().nullable().default(null),
    banner_uploaded_at: z.string().nullable().default(null),
});

export type BoatTypeInput = z.input<typeof boatTypesSchema>;
export type BoatTypeOutput = z.output<typeof boatTypesSchema>;

export function createBoatTypesCollection(
    database: import('@powersync/web').PowerSyncDatabase,
    onError: (error: unknown) => void,
    onLoad?: () => void | (() => void) | Promise<void | (() => void)>,
) {
    const collection = createCollection({
        defaultIndexType: BasicIndex,
        ...powerSyncCollectionOptions({
            database,
            table: appBoatTypesPowerSyncTable,
            schema: boatTypesSchema,
            onDeserializationError: (error) => {
                onError(error);
            },
            ...(onLoad ? { onLoad } : {}),
        }),
    });

    collection.createIndex((row) => row.id);

    return collection;
}
