import { computed, toValue, type MaybeRefOrGetter, type Ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useLiveQuery } from '@tanstack/vue-db';
import { eq } from '@tanstack/db';
import { isScheduledDeparturePast } from '../utilities/booking-admin-validation';
import { getAppPowerSyncContext } from '../powersync/app-powersync.runtime';
import {
    joinTripsWithRelationsFrom,
    selectTripWithRelationsProjection,
    type TripWithRelationsRow,
} from '../powersync/joined-queries';
import { liveQueryRows } from '../powersync/live-query-casts';
import {
    formatDepartureParts,
    resolveProgramTimezone,
} from '../utilities/program-timezone-datetime';

export type ProgramTripSelectOption = {
    value: string;
    label: string;
    waterRouteId?: string;
};

function formatTripSelectLabel(
    trip: Pick<TripWithRelationsRow, 'scheduled_departure_at' | 'product_name'>,
    timezone: string,
    locale: string,
): string {
    const product = String(trip.product_name ?? '—');
    const dep = trip.scheduled_departure_at;
    if (dep == null || String(dep).trim() === '') {
        return `— · ${product}`;
    }

    const { date, time } = formatDepartureParts(String(dep), timezone, locale);

    return `${date} ${time} · ${product}`;
}

export function useProgramTripSelectOptions(options?: {
    includeWaterRouteId?: boolean;
    /** Omit trips whose scheduled departure is in the past. */
    excludePastTrips?: boolean;
    /** Trip ids to keep visible even when past (e.g. a booking's current trip). */
    alwaysIncludeTripIds?: MaybeRefOrGetter<readonly string[]>;
}) {
    const powersync = getAppPowerSyncContext();
    const { locale } = useI18n();
    const activeProgramIdRef = powersync.activeProgramIdRef;

    const { data: programRow } = useLiveQuery(
        (qb) => {
            const col = powersync.collections.programs.value;
            const pid = activeProgramIdRef.value.trim();
            if (!col || pid.length === 0) {
                return undefined;
            }
            return qb
                .from({ p: col })
                .where(({ p }) => eq(p.id, pid))
                .select(({ p }) => ({ timezone: p.timezone }));
        },
        [powersync.collections.programs, activeProgramIdRef],
    );

    const programTimezone = computed(() =>
        resolveProgramTimezone(
            liveQueryRows<{ timezone: string | null }>(programRow.value)[0]?.timezone,
        ),
    );

    const { data: tripsRaw } = useLiveQuery(
        (qb) => {
            const tripsCol = powersync.collections.trips.value;
            const productsCol = powersync.collections.products.value;
            const boatTypesCol = powersync.collections.boat_types.value;
            const waterRoutesCol = powersync.collections.water_routes.value;
            const pid = activeProgramIdRef.value.trim();
            if (!tripsCol || !productsCol || !boatTypesCol || !waterRoutesCol || pid.length === 0) {
                return undefined;
            }
            return joinTripsWithRelationsFrom(
                qb,
                tripsCol,
                productsCol,
                boatTypesCol,
                waterRoutesCol,
            )
                .where(({ trip }) => eq(trip.program_id, pid))
                .select(selectTripWithRelationsProjection)
                .orderBy(({ scheduled_departure_at }) => scheduled_departure_at, 'asc');
        },
        [
            powersync.collections.trips,
            powersync.collections.products,
            powersync.collections.boat_types,
            powersync.collections.water_routes,
            activeProgramIdRef,
        ],
    );

    const allTripRows = computed(() => liveQueryRows<TripWithRelationsRow>(tripsRaw.value));

    const tripRows = computed((): TripWithRelationsRow[] => {
        if (options?.excludePastTrips !== true) {
            return allTripRows.value;
        }

        const includeIds = new Set(
            toValue(options.alwaysIncludeTripIds ?? [])
                .map((id) => String(id).trim())
                .filter((id) => id.length > 0),
        );

        return allTripRows.value.filter((trip) => {
            const tripId = String(trip.id).trim();
            if (includeIds.has(tripId)) {
                return true;
            }

            return !isScheduledDeparturePast(trip.scheduled_departure_at);
        });
    });

    const tripOptions = computed((): ProgramTripSelectOption[] => {
        const tz = programTimezone.value;
        const loc = String(locale.value);

        return tripRows.value.map((trip) => ({
            value: String(trip.id),
            label: formatTripSelectLabel(trip, tz, loc),
            ...(options?.includeWaterRouteId
                ? { waterRouteId: String(trip.water_route_id ?? '') }
                : {}),
        }));
    });

    return {
        tripOptions,
        tripRows,
        programTimezone,
        tripsRaw: tripsRaw as Ref<unknown>,
    };
}
