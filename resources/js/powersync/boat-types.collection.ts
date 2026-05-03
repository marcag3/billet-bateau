import { createCollection } from '@tanstack/db';
import { powerSyncCollectionOptions } from '@tanstack/powersync-db-collection';
import { z } from 'zod';
import { appBoatTypesPowerSyncTable } from './app.powersync-schema';

export const boatTypesSchema = z.object({
    id: z.string(),
    user_id: z.number().int().nullable().default(null),
    program_id: z.string().nullable().default(null),
    name: z.string().nullable().default(null),
    created_at: z.string().nullable().default(null),
    updated_at: z.string().nullable().default(null),
});

export type BoatTypeInput = z.input<typeof boatTypesSchema>;
export type BoatTypeOutput = z.output<typeof boatTypesSchema>;

export const boatTypesDeserializationSchema = z.object({
    id: z.string(),
    user_id: z.number().int().nullable().default(null),
    program_id: z.string().nullable().default(null),
    name: z.string().nullable().default(null),
    created_at: z.string().nullable().default(null),
    updated_at: z.string().nullable().default(null),
});

export function createBoatTypesCollection(
    database: import('@powersync/web').PowerSyncDatabase,
    onError: (error: unknown) => void,
    onLoad?: () => void | (() => void) | Promise<void | (() => void)>,
) {
    return createCollection(
        powerSyncCollectionOptions({
            database,
            table: appBoatTypesPowerSyncTable,
            schema: boatTypesSchema,
            onDeserializationError: (error) => {
                onError(error);
            },
            ...(onLoad ? { onLoad } : {}),
        }),
    );
}
