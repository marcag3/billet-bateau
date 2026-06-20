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
import { queryRef } from "./live-query-casts";

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
    B extends Collection<any, string | number>,
    BT extends Collection<any, string | number>,
>(qb: InitialQueryBuilder, boatsCollection: B, boatTypesCollection: BT) {
    return qb
        .from({ b: boatsCollection })
        .leftJoin({ bt: boatTypesCollection }, ({ b, bt }) =>
            eq(queryRef(b).boat_type_id, queryRef(bt).id),
        )
        .select(({ b, bt }) => ({
            id: queryRef(b).id,
            boat_type_id: queryRef(b).boat_type_id,
            program_id: queryRef(b).program_id,
            name: queryRef(b).name,
            capacity: queryRef(b).capacity,
            notes: queryRef(b).notes,
            boatTypeName: queryRef(bt).name,
            boatTypeBannerObjectKey: queryRef(bt).banner_object_key,
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
 * Chain `.where()` on the returned builder **before** calling `.select(...)`.
 *
 * @example
 * ```ts
 * return joinTripsWithRelationsFrom(qb, col, pCol, btCol, wrCol)
 *   .where(({ trip }) => eq(trip.program_id, pid))
 *   .select(selectTripWithRelationsProjection)
 *   .orderBy(({ scheduled_departure_at }) => scheduled_departure_at, "desc")
 * ```
 */
export function joinTripsWithRelationsFrom<
    T extends Collection<any, string | number>,
    P extends Collection<any, string | number>,
    BT extends Collection<any, string | number>,
    WR extends Collection<any, string | number>,
>(
    qb: InitialQueryBuilder,
    tripsCollection: T,
    productsCollection: P,
    boatTypesCollection: BT,
    waterRoutesCollection: WR,
) {
    return qb
        .from({ trip: tripsCollection })
        .innerJoin({ product: productsCollection }, ({ trip, product }) =>
            eq(queryRef(trip).product_id, queryRef(product).id),
        )
        .leftJoin({ boatType: boatTypesCollection }, ({ product, boatType }) =>
            eq(queryRef(product).boat_type_id, queryRef(boatType).id),
        )
        .leftJoin({ waterRoute: waterRoutesCollection }, ({ product, waterRoute }) =>
            eq(queryRef(product).water_route_id, queryRef(waterRoute).id),
        );
}

/** Join + select in one step (no further table-alias filters). */
export function joinTripsWithRelations<
    T extends Collection<any, string | number>,
    P extends Collection<any, string | number>,
    BT extends Collection<any, string | number>,
    WR extends Collection<any, string | number>,
>(
    qb: InitialQueryBuilder,
    tripsCollection: T,
    productsCollection: P,
    boatTypesCollection: BT,
    waterRoutesCollection: WR,
) {
    return joinTripsWithRelationsFrom(
        qb,
        tripsCollection,
        productsCollection,
        boatTypesCollection,
        waterRoutesCollection,
    ).select(({ trip, product, boatType, waterRoute }) => ({
        id: queryRef(trip).id,
        program_id: queryRef(trip).program_id,
        product_id: queryRef(trip).product_id,
        product_name: queryRef(product).name,
        scheduled_departure_at: queryRef(trip).scheduled_departure_at,
        boat_type_id: queryRef(product).boat_type_id,
        water_route_id: queryRef(product).water_route_id,
        capacity: queryRef(product).capacity,
        boatTypeName: queryRef(boatType).name,
        waterRouteName: queryRef(waterRoute).name,
        waterRouteDurationMinutes: queryRef(waterRoute).duration_minutes,
        productBannerObjectKey: queryRef(product).banner_object_key,
    }));
}
