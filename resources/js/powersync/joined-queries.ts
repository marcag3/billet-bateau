/**
 * TanStack DB joined live query collections.
 *
 * These derived collections define relations between entities,
 * eliminating the need for .find() lookups in Vue components.
 *
 * Relations defined:
 *   boats  ->  boat_types   (boats.boat_type_id  -> boat_types.id)
 *   trips  ->  boat_types   (trips.boat_type_id  -> boat_types.id)
 *   trips  ->  water_routes (trips.water_route_id -> water_routes.id)
 */

import { eq, type Collection, type InitialQueryBuilder } from "@tanstack/db";

/* eslint-disable @typescript-eslint/no-explicit-any -- TanStack Collection generics */

// ---------------------------------------------------------------------------
// Boats + BoatType join
// ---------------------------------------------------------------------------

export interface BoatWithBoatTypeRow {
    id: string;
    boat_type_id: string | null;
    program_id: string | null;
    name: string | null;
    capacity: number | null;
    notes: string | null;
    /** Resolved boat type name (null if no boat_type_id) */
    boatTypeName: string | null;
}

/**
 * Build a query fragment that joins boats -> boat_types.
 * Use inside useLiveQuery or createLiveQueryCollection.
 *
 * @example
 * ```ts
 * const { data: boats } = useLiveQuery((qb) => {
 *   const col = boatsCollection.value
 *   const btCol = boatTypesCollection.value
 *   if (!col || !btCol || pid.length === 0) return undefined
 *   return joinBoatsWithBoatTypes(qb, col, btCol)
 *     .where(({ b }) => b.program_id, "=", pid)
 *     .orderBy(({ b }) => b.id, "desc")
 * })
 * ```
 */
export function joinBoatsWithBoatTypes<
    B extends Collection<any, any>,
    BT extends Collection<any, any>,
>(qb: InitialQueryBuilder, boatsCollection: B, boatTypesCollection: BT) {
    return qb
        .from({ b: boatsCollection })
        .leftJoin({ bt: boatTypesCollection }, ({ b, bt }) =>
            eq(b.boat_type_id, bt.id),
        )
        .select(({ b, bt }) => ({
            id: b.id,
            boat_type_id: b.boat_type_id,
            program_id: b.program_id,
            name: b.name,
            capacity: b.capacity,
            notes: b.notes,
            boatTypeName: bt.name,
        }));
}

// ---------------------------------------------------------------------------
// Trips + BoatType + WaterRoute join
// ---------------------------------------------------------------------------

export interface TripWithRelationsRow {
    id: string;
    program_id: string | null;
    boat_type_id: string | null;
    water_route_id: string | null;
    template_day_slot_id: string | null;
    scheduled_departure_at: string | null;
    capacity: number | null;
    /** Resolved boat type name */
    boatTypeName: string | null;
    /** Resolved water route name */
    waterRouteName: string | null;
}

/**
 * Build a query fragment that joins trips -> boat_types and trips -> water_routes.
 *
 * @example
 * ```ts
 * const { data: trips } = useLiveQuery((qb) => {
 *   const col = tripsCollection.value
 *   const btCol = boatTypesCollection.value
 *   const wrCol = waterRoutesCollection.value
 *   if (!col || !btCol || !wrCol || pid.length === 0) return undefined
 *   return joinTripsWithRelations(qb, col, btCol, wrCol)
 *     .where(({ t }) => t.program_id, "=", pid)
 *     .orderBy(({ t }) => t.scheduled_departure_at, "desc")
 * })
 * ```
 */
export function joinTripsWithRelations<
    T extends Collection<any, any>,
    BT extends Collection<any, any>,
    WR extends Collection<any, any>,
>(
    qb: InitialQueryBuilder,
    tripsCollection: T,
    boatTypesCollection: BT,
    waterRoutesCollection: WR,
) {
    return qb
        .from({ t: tripsCollection })
        .leftJoin({ bt: boatTypesCollection }, ({ t, bt }) =>
            eq(t.boat_type_id, bt.id),
        )
        .leftJoin({ wr: waterRoutesCollection }, ({ t, wr }) =>
            eq(t.water_route_id, wr.id),
        )
        .select(({ t, bt, wr }) => ({
            id: t.id,
            program_id: t.program_id,
            boat_type_id: t.boat_type_id,
            water_route_id: t.water_route_id,
            template_day_slot_id: t.template_day_slot_id,
            scheduled_departure_at: t.scheduled_departure_at,
            capacity: t.capacity,
            boatTypeName: bt.name,
            waterRouteName: wr.name,
        }));
}
