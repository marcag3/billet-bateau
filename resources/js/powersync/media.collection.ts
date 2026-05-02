import { createCollection } from '@tanstack/db';
import { powerSyncCollectionOptions } from '@tanstack/powersync-db-collection';
import { z } from 'zod';
import { appMediaPowerSyncTable } from './app.powersync-schema';

export const mediaSchema = z.object({
    id: z.string(),
    program_id: z.string().nullable(),
    model_type: z.string().nullable(),
    model_id: z.string().nullable(),
    uuid: z.string().nullable(),
    collection_name: z.string().nullable(),
    name: z.string().nullable(),
    file_name: z.string().nullable(),
    mime_type: z.string().nullable(),
    disk: z.string().nullable(),
    conversions_disk: z.string().nullable(),
    size: z.number().int().nullable(),
    manipulations: z.string().nullable(),
    custom_properties: z.string().nullable(),
    generated_conversions: z.string().nullable(),
    responsive_images: z.string().nullable(),
    order_column: z.number().int().nullable(),
    created_at: z.string().nullable(),
    updated_at: z.string().nullable(),
});

export type MediaInput = z.input<typeof mediaSchema>;
export type MediaOutput = z.output<typeof mediaSchema>;

export const mediaDeserializationSchema = z.object({
    id: z.string(),
    program_id: z.string().nullable(),
    model_type: z.string().nullable(),
    model_id: z.string().nullable(),
    uuid: z.string().nullable(),
    collection_name: z.string().nullable(),
    name: z.string().nullable(),
    file_name: z.string().nullable(),
    mime_type: z.string().nullable(),
    disk: z.string().nullable(),
    conversions_disk: z.string().nullable(),
    size: z.number().int().nullable(),
    manipulations: z.string().nullable(),
    custom_properties: z.string().nullable(),
    generated_conversions: z.string().nullable(),
    responsive_images: z.string().nullable(),
    order_column: z.number().int().nullable(),
    created_at: z.string().nullable(),
    updated_at: z.string().nullable(),
});

export function createMediaCollection(
    database: import('@powersync/web').PowerSyncDatabase,
    onError: (error: unknown) => void,
) {
    return createCollection(
        powerSyncCollectionOptions({
            database,
            table: appMediaPowerSyncTable,
            schema: mediaSchema,
            deserializationSchema: mediaDeserializationSchema,
            onDeserializationError: (error) => {
                onError(error);
            },
        }),
    );
}
