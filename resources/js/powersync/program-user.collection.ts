import { createAppPowerSyncCollection } from './collection-defaults';
import { powerSyncCollectionOptions } from '@tanstack/powersync-db-collection';
import { z } from 'zod';
import { appProgramUserPowerSyncTable } from './app.powersync-schema';

export const programUserSchema = z.object({
    id: z.string(),
    program_id: z.string().nullable().default(null),
    user_id: z.string().nullable().default(null),
    role: z.string().nullable().default(null),
});

export type ProgramUserInput = z.input<typeof programUserSchema>;
export type ProgramUserOutput = z.output<typeof programUserSchema>;

export function createProgramUserCollection(
    database: import('@powersync/web').PowerSyncDatabase,
    onError: (error: unknown) => void,
    onLoad?: () => void | (() => void) | Promise<void | (() => void)>,
) {
    const collection = createAppPowerSyncCollection('program_user', {
        ...powerSyncCollectionOptions({
            database,
            table: appProgramUserPowerSyncTable,
            schema: programUserSchema,
            onDeserializationError: (error) => {
                onError(error);
            },
            ...(onLoad ? { onLoad } : {}),
        }),
    });

    collection.createIndex((row) => row.id);
    collection.createIndex((row) => row.program_id);

    return collection;
}
