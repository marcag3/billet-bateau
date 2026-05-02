import { createCollection } from '@tanstack/db';
import { powerSyncCollectionOptions } from '@tanstack/powersync-db-collection';
import { z } from 'zod';
import { appTripsPowerSyncTable } from './app.powersync-schema';

export const tripsSchema = z.object({
    id: z.string(),
    program_id: z.string().nullable(),
    boat_type_id: z.string().nullable(),
    water_route_id: z.string().nullable(),
    template_day_slot_id: z.string().nullable(),
    scheduled_departure_at: z.string().nullable(),
    capacity: z.number().int().nullable(),
    created_at: z.string().nullable(),
    updated_at: z.string().nullable(),
});

export type TripInput = z.input<typeof tripsSchema>;
export type TripOutput = z.output<typeof tripsSchema>;

export const tripsDeserializationSchema = z.object({
    id: z.string(),
    program_id: z.string().nullable(),
    boat_type_id: z.string().nullable(),
    water_route_id: z.string().nullable(),
    template_day_slot_id: z.string().nullable(),
    scheduled_departure_at: z.string().nullable(),
    capacity: z.number().int().nullable(),
    created_at: z.string().nullable(),
    updated_at: z.string().nullable(),
});

export function createTripsCollection(
    database: import('@powersync/web').PowerSyncDatabase,
    onError: (error: unknown) => void,
) {
    return createCollection(
        powerSyncCollectionOptions({
            database,
            table: appTripsPowerSyncTable,
            schema: tripsSchema,
            deserializationSchema: tripsDeserializationSchema,
            onDeserializationError: (error) => {
                onError(error);
            },
        }),
    );
}
