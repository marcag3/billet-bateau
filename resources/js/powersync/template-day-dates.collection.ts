import { createCollection } from '@tanstack/db';
import { powerSyncCollectionOptions } from '@tanstack/powersync-db-collection';
import { z } from 'zod';
import { appTemplateDayDatesPowerSyncTable } from './app.powersync-schema';

export const templateDayDatesSchema = z.object({
    id: z.string(),
    program_id: z.string().nullable(),
    template_day_id: z.string().nullable(),
    service_date: z.string().nullable(),
    created_at: z.string().nullable(),
    updated_at: z.string().nullable(),
});

export type TemplateDayDateInput = z.input<typeof templateDayDatesSchema>;
export type TemplateDayDateOutput = z.output<typeof templateDayDatesSchema>;

export const templateDayDatesDeserializationSchema = z.object({
    id: z.string(),
    program_id: z.string().nullable(),
    template_day_id: z.string().nullable(),
    service_date: z.string().nullable(),
    created_at: z.string().nullable(),
    updated_at: z.string().nullable(),
});

export function createTemplateDayDatesCollection(
    database: import('@powersync/web').PowerSyncDatabase,
    onError: (error: unknown) => void,
) {
    return createCollection(
        powerSyncCollectionOptions({
            database,
            table: appTemplateDayDatesPowerSyncTable,
            schema: templateDayDatesSchema,
            deserializationSchema: templateDayDatesDeserializationSchema,
            onDeserializationError: (error) => {
                onError(error);
            },
        }),
    );
}
