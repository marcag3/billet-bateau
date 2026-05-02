import { createCollection } from '@tanstack/db';
import { powerSyncCollectionOptions } from '@tanstack/powersync-db-collection';
import { z } from 'zod';
import { appTemplateDaysPowerSyncTable } from './app.powersync-schema';

export const templateDaysSchema = z.object({
    id: z.string(),
    program_id: z.string().nullable().default(null),
    name: z.string().nullable().default(null),
    created_at: z.string().nullable().default(null),
    updated_at: z.string().nullable().default(null),
});

export type TemplateDayInput = z.input<typeof templateDaysSchema>;
export type TemplateDayOutput = z.output<typeof templateDaysSchema>;

export const templateDaysDeserializationSchema = z.object({
    id: z.string(),
    program_id: z.string().nullable().default(null),
    name: z.string().nullable().default(null),
    created_at: z.string().nullable().default(null),
    updated_at: z.string().nullable().default(null),
});

export function createTemplateDaysCollection(
    database: import('@powersync/web').PowerSyncDatabase,
    onError: (error: unknown) => void,
) {
    return createCollection(
        powerSyncCollectionOptions({
            database,
            table: appTemplateDaysPowerSyncTable,
            schema: templateDaysSchema,
            onDeserializationError: (error) => {
                onError(error);
            },
        }),
    );
}
