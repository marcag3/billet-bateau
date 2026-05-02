import { createCollection } from '@tanstack/db';
import { powerSyncCollectionOptions } from '@tanstack/powersync-db-collection';
import { z } from 'zod';
import { appBoatTypesPowerSyncTable } from './app.powersync-schema';

export const boatTypesSchema = z.object({
    id: z.string(),
    user_id: z.number().int().nullable(),
    program_id: z.string().nullable(),
    name: z.string().nullable(),
    created_at: z.string().nullable(),
    updated_at: z.string().nullable(),
});

export type BoatTypeInput = z.input<typeof boatTypesSchema>;
export type BoatTypeOutput = z.output<typeof boatTypesSchema>;

export const boatTypesDeserializationSchema = z.object({
    id: z.string(),
    user_id: z.number().int().nullable(),
    program_id: z.string().nullable(),
    name: z.string().nullable(),
    created_at: z.string().nullable(),
    updated_at: z.string().nullable(),
});

export function createBoatTypesCollection(
    database: import('@powersync/web').PowerSyncDatabase,
    onError: (error: unknown) => void,
) {
    return createCollection(
        powerSyncCollectionOptions({
            database,
            table: appBoatTypesPowerSyncTable,
            schema: boatTypesSchema,
            deserializationSchema: boatTypesDeserializationSchema,
            onDeserializationError: (error) => {
                onError(error);
            },
        }),
    );
}
