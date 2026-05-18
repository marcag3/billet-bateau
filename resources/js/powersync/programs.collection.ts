import { BasicIndex, createCollection } from '@tanstack/db';
import { powerSyncCollectionOptions } from '@tanstack/powersync-db-collection';
import { z } from 'zod';
import { appProgramsPowerSyncTable } from './app.powersync-schema';

export const programSchema = z.object({
    id: z.string(),
    name: z.string()
        .min(1, "Program name is required")
        .nullable()
        .default(null),
    description: z.string()
        .max(1000, "Description must be under 1000 characters")
        .nullable()
        .default(null),
    theme_color: z.string()
        .regex(/^#[0-9a-fA-F]{6}$/, "Theme color must be a valid hex color (e.g. #FF5733)")
        .nullable()
        .default(null),
    is_active: z.number().int().transform((v) => v === 1).nullable().default(true),
    slug: z.string()
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be URL-safe (e.g. "my-program")')
        .nullable()
        .default(null),
    booking_questions: z.string().nullable().default('[]'),
    start_date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .nullable()
        .default(null),
    end_date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .nullable()
        .default(null),
    line_1: z.string().nullable().default(null),
    line_2: z.string().nullable().default(null),
    city: z.string().nullable().default(null),
    postal_code: z.string().nullable().default(null),
    country: z.string().nullable().default(null),
    banner_object_key: z.string().nullable().default(null),
    banner_mime_type: z.string().nullable().default(null),
    banner_size_bytes: z.number().nullable().default(null),
    banner_etag: z.string().nullable().default(null),
    banner_uploaded_at: z.string().nullable().default(null),
});

export type ProgramInput = z.input<typeof programSchema>;
export type ProgramOutput = z.output<typeof programSchema>;

export function createProgramsCollection(
    database: import('@powersync/web').PowerSyncDatabase,
    onError: (error: unknown) => void,
    onLoad?: () => void | (() => void) | Promise<void | (() => void)>,
) {
    const collection = createCollection({
        defaultIndexType: BasicIndex,
        ...powerSyncCollectionOptions({
            database,
            table: appProgramsPowerSyncTable,
            schema: programSchema,
            onDeserializationError: (error) => {
                onError(error);
            },
            ...(onLoad ? { onLoad } : {}),
        }),
    });

    collection.createIndex((row) => row.id);

    return collection;
}
