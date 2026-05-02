import { createCollection } from '@tanstack/db';
import { powerSyncCollectionOptions } from '@tanstack/powersync-db-collection';
import { z } from 'zod';
import { appBoatsPowerSyncTable } from './app.powersync-schema';

export const boatsSchema = z.object({
    id: z.string(),
    user_id: z.number().int().nullable(),
    boat_type_id: z.string().nullable(),
    program_id: z.string().nullable(),
    name: z.string().nullable(),
    capacity: z.number().int().nullable(),
    notes: z.string().nullable(),
    created_at: z.string().nullable(),
    updated_at: z.string().nullable(),
});

export type BoatInput = z.input<typeof boatsSchema>;
export type BoatOutput = z.output<typeof boatsSchema>;

export const boatsDeserializationSchema = z.object({
    id: z.string(),
    user_id: z.number().int().nullable(),
    boat_type_id: z.string().nullable(),
    program_id: z.string().nullable(),
    name: z.string().nullable(),
    capacity: z.number().int().nullable(),
    notes: z.string().nullable(),
    created_at: z.string().nullable(),
    updated_at: z.string().nullable(),
});

export function createBoatsCollection(
    database: import('@powersync/web').PowerSyncDatabase,
    onError: (error: unknown) => void,
) {
    return createCollection(
        powerSyncCollectionOptions({
            database,
            table: appBoatsPowerSyncTable,
            schema: boatsSchema,
            deserializationSchema: boatsDeserializationSchema,
            onDeserializationError: (error) => {
                onError(error);
            },
        }),
    );
}
