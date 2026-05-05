import { createCollection } from '@tanstack/db';
import { powerSyncCollectionOptions } from '@tanstack/powersync-db-collection';
import { z } from 'zod';
import { appTemplateDayDatesPowerSyncTable } from './app.powersync-schema';

export const templateDayDatesSchema = z.object({
    id: z.string(),
    program_id: z.string().nullable().default(null),
    template_day_id: z.string().nullable().default(null),
    service_date: z.string().transform((v) => new Date(v)).nullable().default(null),
});

export type TemplateDayDateInput = z.input<typeof templateDayDatesSchema>;
export type TemplateDayDateOutput = z.output<typeof templateDayDatesSchema>;

export function createTemplateDayDatesCollection(
    database: import('@powersync/web').PowerSyncDatabase,
    onError: (error: unknown) => void,
    onLoad?: () => void | (() => void) | Promise<void | (() => void)>,
) {
    return createCollection(
        powerSyncCollectionOptions({
            database,
            table: appTemplateDayDatesPowerSyncTable,
            schema: templateDayDatesSchema,
            onDeserializationError: (error) => {
                onError(error);
            },
            ...(onLoad ? { onLoad } : {}),
        }),
    );
}
