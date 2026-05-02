import { createCollection } from '@tanstack/db';
import { powerSyncCollectionOptions } from '@tanstack/powersync-db-collection';
import { z } from 'zod';
import { appProgramsPowerSyncTable } from './app.powersync-schema';

export const programSchema = z.object({
    id: z.string(),
    name: z.string().nullable(),
    description: z.string().nullable(),
    theme_color: z.string().nullable(),
    is_active: z.boolean().nullable(),
    is_archived: z.boolean().nullable(),
    slug: z.string().nullable(),
    line_1: z.string().nullable(),
    line_2: z.string().nullable(),
    city: z.string().nullable(),
    postal_code: z.string().nullable(),
    country: z.string().nullable(),
    created_at: z.string().nullable(),
    updated_at: z.string().nullable(),
});

export type ProgramInput = z.input<typeof programSchema>;
export type ProgramOutput = z.output<typeof programSchema>;

export const programDeserializationSchema = z.object({
    id: z.string(),
    name: z.string().nullable(),
    description: z.string().nullable(),
    theme_color: z.string().nullable(),
    is_active: z.number().nullable().transform((v) => (v != null ? v === 1 : null)),
    is_archived: z.number().nullable().transform((v) => (v != null ? v === 1 : null)),
    slug: z.string().nullable(),
    line_1: z.string().nullable(),
    line_2: z.string().nullable(),
    city: z.string().nullable(),
    postal_code: z.string().nullable(),
    country: z.string().nullable(),
    created_at: z.string().nullable(),
    updated_at: z.string().nullable(),
});

export function createProgramsCollection(
    database: import('@powersync/web').PowerSyncDatabase,
    onError: (error: unknown) => void,
) {
    return createCollection(
        powerSyncCollectionOptions({
            database,
            table: appProgramsPowerSyncTable,
            schema: programSchema,
            deserializationSchema: programDeserializationSchema,
            onDeserializationError: (error) => {
                onError(error);
            },
        }),
    );
}
