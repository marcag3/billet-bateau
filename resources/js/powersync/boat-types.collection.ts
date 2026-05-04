import { createCollection } from '@tanstack/db';
import { powerSyncCollectionOptions } from '@tanstack/powersync-db-collection';
import { z } from 'zod';
import { appBoatTypesPowerSyncTable } from './app.powersync-schema';

export const boatTypesSchema = z.object({
    id: z.string(),
    program_id: z.string().nullable().default(null),
    name: z.string().min(1, "Boat type name is required").nullable().default(null),
    created_at: z.string().transform((v) => new Date(v)).nullable().default(() => new Date()),
    updated_at: z.string().transform((v) => new Date(v)).nullable().default(() => new Date()),
});

export type BoatTypeInput = z.input<typeof boatTypesSchema>;
export type BoatTypeOutput = z.output<typeof boatTypesSchema>;

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
