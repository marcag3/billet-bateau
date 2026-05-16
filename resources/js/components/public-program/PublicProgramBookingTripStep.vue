<template>
    <div>
        <div v-if="tripOptions.length === 0" class="text-body1 text-grey-8">
            {{ t('publicBooking.noTrips') }}
        </div>
        <template v-else>
            <div class="row items-center q-gutter-sm q-mb-md flex-wrap">
                <PublicProgramBoatTypeFilterSelect
                    v-model:selected-boat-type-id="selectedBoatTypeId"
                    :boat-type-filter-options="boatTypeFilterOptions"
                />

                <PublicProgramWaterRouteFilterSelect
                    v-model:selected-water-route-id="selectedWaterRouteId"
                    :water-route-filter-options="waterRouteFilterOptions"
                />

                <PublicProgramBookingDateFilter
                    v-model:selected-date-ymd="selectedDateYmd"
                    :daily-availability-by-date="dailyAvailabilityByDate"
                />

                <q-btn
                    v-if="hasActiveTripFilters"
                    flat
                    dense
                    no-caps
                    color="primary"
                    class="text-weight-bold"
                    :label="t('publicBooking.clearAllFilters')"
                    @click="clearAllFilters"
                />
            </div>

            <q-banner
                v-if="filteredTripOptions.length === 0 && hasActiveTripFilters"
                rounded
                outline
                class="text-grey-8 q-mb-md"
            >
                {{ t('publicBooking.noTripsForFilters') }}
            </q-banner>

            <q-list
                v-if="filteredTripOptions.length > 0"
                bordered
                separator
                class="rounded-borders"
            >
                <q-item
                    v-for="trip in filteredTripOptions"
                    :key="String(trip.id)"
                    v-ripple
                    tag="label"
                    clickable
                    :active="String(selectedTripId) === String(trip.id)"
                    active-class="bg-blue-1"
                >
                    <q-item-section side top class="q-pt-sm">
                        <q-radio v-model="selectedTripId" :val="String(trip.id)" />
                    </q-item-section>
                    <q-item-section avatar top>
                        <q-img
                            v-if="
                                trip.product_banner_url != null &&
                                trip.product_banner_url.length > 0
                            "
                            :src="trip.product_banner_url"
                            :alt="trip.product_name"
                            class="public-trip-thumb rounded-borders"
                            ratio="1"
                            fit="cover"
                        />
                        <div
                            v-else
                            class="public-trip-thumb public-trip-thumb--placeholder rounded-borders"
                        >
                            <q-icon name="image_not_supported" size="22px" />
                        </div>
                    </q-item-section>
                    <q-item-section>
                        <q-item-label class="text-body1">{{
                            formatTripOptionLabel(trip)
                        }}</q-item-label>
                    </q-item-section>
                </q-item>
            </q-list>
        </template>
        <div class="row q-gutter-sm q-mt-md justify-end">
            <q-btn
                color="primary"
                no-caps
                :label="t('publicBooking.continue')"
                :disable="!canContinueFromTripStep"
                @click="emit('continue')"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import PublicProgramBoatTypeFilterSelect from './PublicProgramBoatTypeFilter.vue';
import PublicProgramWaterRouteFilterSelect from './PublicProgramWaterRouteFilter.vue';
import PublicProgramBookingDateFilter from './PublicProgramBookingDateFilter.vue';
import type {
    BookingTripOption,
    PublicBookingBoatTypeFilterOption,
    PublicBookingWaterRouteFilterOption,
} from '../../models/public-booking/public-booking.types';
import { buildDailyAvailabilityMap, filterPublicBookingTrips } from '../../utilities/public-booking-filters';

const props = defineProps<{
    tripOptions: BookingTripOption[];
}>();

const emit = defineEmits<{
    continue: [];
}>();

const selectedTripId = defineModel<string>('selectedTripId', { required: true });

const { t, locale } = useI18n();

const selectedBoatTypeId = ref('');
const selectedWaterRouteId = ref('');
const selectedDateYmd = ref('');

const boatTypeFilterOptions = computed((): PublicBookingBoatTypeFilterOption[] => {
    const map = new Map<string, PublicBookingBoatTypeFilterOption>();
    for (const trip of props.tripOptions) {
        const id = String(trip.boat_type_id ?? '').trim();
        if (id.length === 0 || map.has(id)) {
            continue;
        }
        map.set(id, {
            id,
            name: String(trip.boat_type_name ?? '').trim() || t('publicBooking.unknownBoatType'),
            bannerUrl: trip.boat_type_banner_url,
        });
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
});

function pickTripBannerUrl(trip: BookingTripOption): string | null {
    const product = trip.product_banner_url?.trim() ?? '';
    if (product.length > 0) {
        return trip.product_banner_url;
    }
    const boat = trip.boat_type_banner_url?.trim() ?? '';
    if (boat.length > 0) {
        return trip.boat_type_banner_url;
    }

    return null;
}

const waterRouteFilterOptions = computed((): PublicBookingWaterRouteFilterOption[] => {
    const map = new Map<string, PublicBookingWaterRouteFilterOption>();
    for (const trip of props.tripOptions) {
        const id = String(trip.water_route_id ?? '').trim();
        if (id.length === 0) {
            continue;
        }
        const name = String(trip.water_route_name ?? '').trim() || t('publicBooking.unknownWaterRoute');
        const bannerUrl = pickTripBannerUrl(trip);
        const existing = map.get(id);
        if (existing === undefined) {
            map.set(id, {
                id,
                name,
                durationMinutes: trip.water_route_duration_minutes,
                traceGeoJson: trip.water_route_trace_geojson,
                bannerUrl,
            });
        } else if (existing.bannerUrl == null && bannerUrl != null) {
            map.set(id, {
                ...existing,
                bannerUrl,
            });
        }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
});

const dailyAvailabilityByDate = computed(() => buildDailyAvailabilityMap(props.tripOptions));

const filteredTripOptions = computed((): BookingTripOption[] => {
    const filtered = filterPublicBookingTrips(props.tripOptions, {
        boatTypeId: selectedBoatTypeId.value,
        waterRouteId: selectedWaterRouteId.value,
        dateYmd: selectedDateYmd.value,
    });
    return filtered as BookingTripOption[];
});

const canContinueFromTripStep = computed(() => selectedTripId.value.trim().length > 0);

const hasActiveTripFilters = computed(
    () =>
        selectedBoatTypeId.value.trim().length > 0 ||
        selectedWaterRouteId.value.trim().length > 0 ||
        selectedDateYmd.value.trim().length > 0,
);

function formatTripOptionLabel(trip: BookingTripOption): string {
    const when = formatDeparture(trip.scheduled_departure_at);
    const seats = t('publicBooking.remainingSeats', { count: String(trip.remaining_capacity) });
    const boat = trip.boat_type_name != null && trip.boat_type_name.length > 0 ? trip.boat_type_name : '—';
    const route =
        trip.water_route_name != null && trip.water_route_name.length > 0 ? trip.water_route_name : '—';
    const metaLine = t('publicBooking.tripProductMeta', {
        boat,
        route,
        capacity: String(trip.capacity),
    });
    return `${when} — ${trip.product_name} — ${metaLine} — ${seats}`;
}

function formatDeparture(iso: string): string {
    try {
        const d = new Date(iso);
        return new Intl.DateTimeFormat(String(locale.value), {
            dateStyle: 'medium',
            timeStyle: 'short',
        }).format(d);
    } catch {
        return iso;
    }
}

function clearAllFilters(): void {
    selectedBoatTypeId.value = '';
    selectedWaterRouteId.value = '';
    selectedDateYmd.value = '';
}

watch(filteredTripOptions, (filtered) => {
    const selectedExists = filtered.some((trip) => String(trip.id) === selectedTripId.value);
    if (!selectedExists) {
        selectedTripId.value = '';
    }
});
</script>

<style scoped>
.public-trip-thumb {
    width: 64px;
    height: 64px;
}

.public-trip-thumb--placeholder {
    background: #eceff1;
    color: #546e7a;
    display: flex;
    align-items: center;
    justify-content: center;
}
</style>
