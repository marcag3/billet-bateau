<template>
    <div>
        <div v-if="bookableTripOptions.length === 0" class="text-body1 text-grey-8">
            {{ t('publicBooking.noTrips') }}
        </div>
        <template v-else>
            <div class="row items-center q-gutter-sm q-mb-md flex-wrap">
                <PublicProgramBookingDateFilter v-model:selected-date-ymd="selectedDateYmd"
                    :daily-availability-by-date="dailyAvailabilityByDate"
                    :program-start-date-ymd="props.programStartDateYmd"
                    :program-end-date-ymd="props.programEndDateYmd" />

                <PublicProgramProductFilterSelect v-model:selected-product-id="selectedProductId"
                    :product-filter-options="productFilterOptions" />
                <q-btn v-if="hasActiveTripFilters" flat dense no-caps color="primary" class="text-weight-bold"
                    :label="t('publicBooking.clearAllFilters')" @click="clearAllFilters" />
            </div>

            <q-banner v-if="filteredTripOptions.length === 0 && hasActiveTripFilters" rounded outline
                class="text-grey-8 q-mb-md">
                {{ t('publicBooking.noTripsForFilters') }}
            </q-banner>

            <q-virtual-scroll v-if="filteredTripOptions.length > 0" type="table" style="max-height: 70vh"
                :virtual-scroll-item-size="48" :virtual-scroll-sticky-size-start="48"
                :virtual-scroll-sticky-size-end="32" bordered separator="horizontal" class="h-100"
                :items="filteredTripOptions">
                <template v-slot:before>
                    <thead class="thead-sticky text-left">
                        <tr>
                            <th>{{ t('publicBooking.departure') }}</th>
                            <th>{{ t('publicBooking.productFilterButton') }}</th>
                            <th>{{ t('publicBooking.tripAvailabilityColumn') }}</th>
                        </tr>
                    </thead>
                </template>

                <template v-slot="{ item: row }">
                    <tr :key="row.id" class="cursor-pointer" @click="emit('continue', row.id)">
                        <td class="whitespace-pre-line">{{ formatDeparture(row.scheduled_departure_at) }}</td>
                        <td>{{ row.product_name }}</td>
                        <td>{{ formatTripPlacesRatio(row) }}</td>
                    </tr>
                </template>
            </q-virtual-scroll>
        </template>
    </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import PublicProgramProductFilterSelect from './PublicProgramProductFilter.vue';
import PublicProgramBookingDateFilter from './PublicProgramBookingDateFilter.vue';
import type { BookingTripOption, PublicBookingProductFilterOption } from '../../models/public-booking/public-booking.types';
import {
    buildDailyAvailabilityMap,
    filterPublicBookingTrips,
    publicBookingTripHasAvailability,
} from '../../utilities/public-booking-filters';

const props = defineProps<{
    tripOptions: BookingTripOption[];
    /** Inclusive program bounds (`YYYY-MM-DD`) for the date filter. */
    programStartDateYmd?: string;
    programEndDateYmd?: string;
}>();

const emit = defineEmits<{
    continue: [tripId: string];
}>();

const { t, locale } = useI18n();

const bookableTripOptions = computed(() => props.tripOptions.filter(publicBookingTripHasAvailability));

const selectedProductId = defineModel<string>('selectedProductId', { required: true });
const selectedDateYmd = defineModel<string>('selectedDateYmd', { required: true });

watch(
    () =>
        [
            props.programStartDateYmd,
            props.programEndDateYmd,
            selectedDateYmd.value,
        ] as const,
    () => {
        const d = selectedDateYmd.value.trim();
        if (d.length === 0) {
            return;
        }
        const s = String(props.programStartDateYmd ?? '').trim();
        const e = String(props.programEndDateYmd ?? '').trim();
        if (
            /^\d{4}-\d{2}-\d{2}$/.test(s) &&
            /^\d{4}-\d{2}-\d{2}$/.test(e) &&
            (d < s || d > e)
        ) {
            selectedDateYmd.value = '';
        }
    },
);

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

const productFilterOptions = computed((): PublicBookingProductFilterOption[] => {
    const map = new Map<string, PublicBookingProductFilterOption>();
    for (const trip of bookableTripOptions.value) {
        const id = String(trip.product_id ?? '').trim();
        if (id.length === 0) {
            continue;
        }
        const name = String(trip.product_name ?? '').trim() || t('publicBooking.unknownProduct');
        const description = String(trip.product_description ?? '').trim() || null;
        const bannerUrl = pickTripBannerUrl(trip);
        const existing = map.get(id);
        if (existing === undefined) {
            map.set(id, {
                id,
                name,
                description,
                bannerUrl,
            });
        } else if (existing.bannerUrl == null && bannerUrl != null) {
            map.set(id, {
                ...existing,
                bannerUrl,
            });
        } else if (existing.description == null && description != null) {
            map.set(id, {
                ...existing,
                description,
            });
        }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
});

const dailyAvailabilityByDate = computed(() => buildDailyAvailabilityMap(bookableTripOptions.value));

const filteredTripOptions = computed((): BookingTripOption[] => {
    const filtered = filterPublicBookingTrips(bookableTripOptions.value, {
        productId: selectedProductId.value,
        dateYmd: selectedDateYmd.value,
    });
    return filtered as BookingTripOption[];
});

const hasActiveTripFilters = computed(
    () => selectedProductId.value.trim().length > 0 || selectedDateYmd.value.trim().length > 0,
);

function formatTripPlacesRatio(trip: BookingTripOption): string {
    return `${trip.remaining_capacity}/${trip.capacity}`;
}

function formatDeparture(iso: string): string {
    try {
        const d = new Date(iso);
        const localeTag = String(locale.value);
        const datePart = new Intl.DateTimeFormat(localeTag, { dateStyle: 'medium' }).format(d);
        const timePart = new Intl.DateTimeFormat(localeTag, { timeStyle: 'short' }).format(d);
        return `${datePart}\n${timePart}`;
    } catch {
        return iso;
    }
}

function clearAllFilters(): void {
    selectedProductId.value = '';
    selectedDateYmd.value = '';
}

</script>

<style scoped>
:deep(.thead-sticky tr > *),
:deep(.tfoot-sticky tr > *) {
    position: sticky;
    opacity: 1;
    z-index: 2;
    background-color: #fff;
}

:deep(.q-markup-table.q-dark .thead-sticky tr > *),
:deep(.q-markup-table.q-dark .tfoot-sticky tr > *) {
    background-color: var(--q-dark);
}

:deep(.thead-sticky tr:last-child > *) {
    top: 0;
}

:deep(.tfoot-sticky tr:first-child > *) {
    bottom: 0;
}
</style>
