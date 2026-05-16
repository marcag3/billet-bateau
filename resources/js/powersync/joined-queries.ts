/**
 * TanStack DB joined live query collections.
 *
 * These derived collections define relations between entities,
 * eliminating the need for .find() lookups in Vue components.
 *
 * Relations defined:
 *   boats  ->  boat_types   (boats.boat_type_id  -> boat_types.id)
 *   trips  ->  products     (trips.product_id -> products.id)
 *   products -> boat_types  (products.boat_type_id -> boat_types.id)
 *   products -> water_routes (products.water_route_id -> water_routes.id)
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
    /** Boat type banner storage key (null if no type or no banner) */
    boatTypeBannerObjectKey: string | null;
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
            boatTypeBannerObjectKey: bt.banner_object_key,
        }));
}

// ---------------------------------------------------------------------------
// Trips + Product + BoatType + WaterRoute join
// ---------------------------------------------------------------------------

export interface TripWithRelationsRow {
    id: string;
    program_id: string | null;
    product_id: string | null;
    product_name: string | null;
    scheduled_departure_at: string | null;
    boat_type_id: string | null;
    water_route_id: string | null;
    capacity: number | null;
    /** Resolved boat type name */
    boatTypeName: string | null;
    /** Resolved water route name */
    waterRouteName: string | null;
    /** Resolved water route duration in minutes (null if no route join) */
    waterRouteDurationMinutes: number | null;
    /** Product banner storage key (null if none) */
    productBannerObjectKey: string | null;
}

/**
 * Build a query fragment that joins trips -> products -> boat_types / water_routes.
 *
 * @example
 * ```ts
 * const { data: trips } = useLiveQuery((qb) => {
 *   const col = tripsCollection.value
 *   const pCol = productsCollection.value
 *   const btCol = boatTypesCollection.value
 *   const wrCol = waterRoutesCollection.value
 *   if (!col || !pCol || !btCol || !wrCol || pid.length === 0) return undefined
 *   return joinTripsWithRelations(qb, col, pCol, btCol, wrCol)
 *     .where(({ t }) => t.program_id, "=", pid)
 *     .orderBy(({ t }) => t.scheduled_departure_at, "desc")
 * })
 * ```
 */
export function joinTripsWithRelations<
    T extends Collection<any, any>,
    P extends Collection<any, any>,
    BT extends Collection<any, any>,
    WR extends Collection<any, any>,
>(
    qb: InitialQueryBuilder,
    tripsCollection: T,
    productsCollection: P,
    boatTypesCollection: BT,
    waterRoutesCollection: WR,
) {
    return qb
        .from({ t: tripsCollection })
        .innerJoin({ p: productsCollection }, ({ t, p }) =>
            eq(t.product_id, p.id),
        )
        .leftJoin({ bt: boatTypesCollection }, ({ p, bt }) =>
            eq(p.boat_type_id, bt.id),
        )
        .leftJoin({ wr: waterRoutesCollection }, ({ p, wr }) =>
            eq(p.water_route_id, wr.id),
        )
        .select(({ t, p, bt, wr }) => ({
            id: t.id,
            program_id: t.program_id,
            product_id: t.product_id,
            product_name: p.name,
            scheduled_departure_at: t.scheduled_departure_at,
            boat_type_id: p.boat_type_id,
            water_route_id: p.water_route_id,
            capacity: p.capacity,
            boatTypeName: bt.name,
            waterRouteName: wr.name,
            waterRouteDurationMinutes: wr.duration_minutes,
            productBannerObjectKey: p.banner_object_key,
        }));
}
