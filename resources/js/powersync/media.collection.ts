import { createCollection } from '@tanstack/db';
import { powerSyncCollectionOptions } from '@tanstack/powersync-db-collection';
import { z } from 'zod';
import { appMediaPowerSyncTable } from './app.powersync-schema';

export const mediaSchema = z.object({
    id: z.string(),
    program_id: z.string().nullable().default(null),
    model_type: z.string().nullable().default(null),
    model_id: z.string().nullable().default(null),
    uuid: z.string().nullable().default(null),
    collection_name: z.string().nullable().default(null),
    name: z.string().nullable().default(null),
    file_name: z.string().nullable().default(null),
    mime_type: z.string().nullable().default(null),
    disk: z.string().nullable().default(null),
    conversions_disk: z.string().nullable().default(null),
    size: z.number().int().nullable().default(null),
    manipulations: z.string().nullable().default(null),
    custom_properties: z.string().nullable().default(null),
    generated_conversions: z.string().nullable().default(null),
    responsive_images: z.string().nullable().default(null),
    order_column: z.number().int().nullable().default(null),
    created_at: z.string().nullable().default(null),
    updated_at: z.string().nullable().default(null),
});

export type MediaInput = z.input<typeof mediaSchema>;
export type MediaOutput = z.output<typeof mediaSchema>;

export const mediaDeserializationSchema = z.object({
    id: z.string(),
    program_id: z.string().nullable().default(null),
    model_type: z.string().nullable().default(null),
    model_id: z.string().nullable().default(null),
    uuid: z.string().nullable().default(null),
    collection_name: z.string().nullable().default(null),
    name: z.string().nullable().default(null),
    file_name: z.string().nullable().default(null),
    mime_type: z.string().nullable().default(null),
    disk: z.string().nullable().default(null),
    conversions_disk: z.string().nullable().default(null),
    size: z.number().int().nullable().default(null),
    manipulations: z.string().nullable().default(null),
    custom_properties: z.string().nullable().default(null),
    generated_conversions: z.string().nullable().default(null),
    responsive_images: z.string().nullable().default(null),
    order_column: z.number().int().nullable().default(null),
    created_at: z.string().nullable().default(null),
    updated_at: z.string().nullable().default(null),
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
            onDeserializationError: (error) => {
                onError(error);
            },
        }),
    );
}
