import { BasicIndex, createCollection } from '@tanstack/db';
import { powerSyncCollectionOptions } from '@tanstack/powersync-db-collection';
import { z } from 'zod';
import { appTemplateDaysPowerSyncTable } from './app.powersync-schema';

export const templateDaysSchema = z.object({
    id: z.string(),
    program_id: z.string().nullable().default(null),
    name: z.string().min(1, 'Template day name is required').nullable().default(null),
});

export type TemplateDayInput = z.input<typeof templateDaysSchema>;
export type TemplateDayOutput = z.output<typeof templateDaysSchema>;

export function createTemplateDaysCollection(
    database: import('@powersync/web').PowerSyncDatabase,
    onError: (error: unknown) => void,
    onLoad?: () => void | (() => void) | Promise<void | (() => void)>,
) {
    const collection = createCollection({
        defaultIndexType: BasicIndex,
        ...powerSyncCollectionOptions({
            database,
            table: appTemplateDaysPowerSyncTable,
            schema: templateDaysSchema,
            onDeserializationError: (error) => {
                onError(error);
            },
            ...(onLoad ? { onLoad } : {}),
        }),
    });

    collection.createIndex((row) => row.id);

    return collection;
}
