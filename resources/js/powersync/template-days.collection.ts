import { createCollection } from '@tanstack/db';
import { powerSyncCollectionOptions } from '@tanstack/powersync-db-collection';
import { z } from 'zod';
import { appTemplateDaysPowerSyncTable } from './app.powersync-schema';

export const templateDaysSchema = z.object({
    id: z.string(),
    program_id: z.string().nullable(),
    name: z.string().nullable(),
    created_at: z.string().nullable(),
    updated_at: z.string().nullable(),
});

export type TemplateDayInput = z.input<typeof templateDaysSchema>;
export type TemplateDayOutput = z.output<typeof templateDaysSchema>;

export const templateDaysDeserializationSchema = z.object({
    id: z.string(),
    program_id: z.string().nullable(),
    name: z.string().nullable(),
    created_at: z.string().nullable(),
    updated_at: z.string().nullable(),
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
            deserializationSchema: templateDaysDeserializationSchema,
            onDeserializationError: (error) => {
                onError(error);
            },
        }),
    );
}
