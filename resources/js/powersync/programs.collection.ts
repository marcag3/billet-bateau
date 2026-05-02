import { createCollection } from '@tanstack/db';
import { powerSyncCollectionOptions } from '@tanstack/powersync-db-collection';
import { z } from 'zod';
import { appProgramsPowerSyncTable } from './app.powersync-schema';

export const programSchema = z.object({
    id: z.string(),
    name: z.string().nullable().default(null),
    description: z.string().nullable().default(null),
    theme_color: z.string().nullable().default(null),
    is_active: z.boolean().nullable().default(null),
    is_archived: z.boolean().nullable().default(null),
    slug: z.string().nullable().default(null),
    line_1: z.string().nullable().default(null),
    line_2: z.string().nullable().default(null),
    city: z.string().nullable().default(null),
    postal_code: z.string().nullable().default(null),
    country: z.string().nullable().default(null),
    created_at: z.string().nullable().default(null),
    updated_at: z.string().nullable().default(null),
});

export type ProgramInput = z.input<typeof programSchema>;
export type ProgramOutput = z.output<typeof programSchema>;

export const programDeserializationSchema = z.object({
    id: z.string(),
    name: z.string().nullable().default(null),
    description: z.string().nullable().default(null),
    theme_color: z.string().nullable().default(null),
    is_active: z.number().nullable().default(null).transform((v) => (v != null ? v === 1 : null)),
    is_archived: z.number().nullable().default(null).transform((v) => (v != null ? v === 1 : null)),
    slug: z.string().nullable().default(null),
    line_1: z.string().nullable().default(null),
    line_2: z.string().nullable().default(null),
    city: z.string().nullable().default(null),
    postal_code: z.string().nullable().default(null),
    country: z.string().nullable().default(null),
    created_at: z.string().nullable().default(null),
    updated_at: z.string().nullable().default(null),
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
