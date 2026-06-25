<template>
    <div class="min-w-0 overflow-x-hidden">
        <div v-if="bookableTripOptions.length === 0" class="text-body1 text-grey-8">
            {{ t('publicBooking.noTrips') }}
        </div>
        <template v-else>
            <div class="row items-center gap-1 sm:gap-2 mb-2 mx-2 sm:mx-4 flex-wrap">
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
                class="text-grey-8 mb-4">
                {{ t('publicBooking.noTripsForFilters') }}
            </q-banner>

            <div class="min-w-0 overflow-x-hidden w-full">
            <q-virtual-scroll v-if="virtualScrollItems.length > 0" type="table" style="max-height: 70vh"
                :virtual-scroll-item-size="80" :virtual-scroll-sticky-size-start="48"
                :virtual-scroll-sticky-size-end="32" bordered separator="horizontal"
                class="h-100 min-w-0 max-w-full table-fixed w-full [&_th]:!px-1.5 [&_td]:!px-1.5 sm:[&_th]:!px-4 sm:[&_td]:!px-4 [&_th]:!py-1.5 [&_td]:!py-1.5 sm:[&_th]:!py-2 sm:[&_td]:!py-2 [&_th:first-child]:!pl-2 [&_td:first-child]:!pl-2 sm:[&_th:first-child]:!pl-4 sm:[&_td:first-child]:!pl-4 [&_th:last-child]:!pr-2 [&_td:last-child]:!pr-2 sm:[&_th:last-child]:!pr-4 sm:[&_td:last-child]:!pr-4 [&_.thead-sticky_tr>*]:sticky [&_.thead-sticky_tr>*]:opacity-100 [&_.thead-sticky_tr>*]:z-[2] [&_.thead-sticky_tr>*]:bg-white [&_.q-markup-table.q-dark_.thead-sticky_tr>*]:bg-[var(--q-dark)] [&_.thead-sticky_tr:last-child>*]:top-0 [&_.tfoot-sticky_tr:first-child>*]:bottom-0"
                :items="virtualScrollItems">
                <template v-slot:before>
                    <thead class="thead-sticky text-left ">
                        <tr class="bg-accent">
                            <th class="text-center w-10 sm:w-14" />
                            <th style="width: 1%">{{ t('publicBooking.departure') }}</th>
                            <th>{{ t('publicBooking.tripColumn') }}</th>
                            <th style="width: 1%">{{ t('publicBooking.tripAvailabilityColumn') }}</th>
                        </tr>
                    </thead>
                </template>

                <template v-slot="{ item: row }">
                    <tr v-if="row.kind === 'day'" :key="`day-${row.id}`" class="bg-grey-2">
                        <td colspan="4" class="text-weight-medium" style="height: 80px">{{ row.dateLabel }}</td>
                    </tr>
                    <PublicProgramBookingTripListRow v-else :key="`trip-${row.id}`" :trip="row.trip"
                        :departure-date-label="showDaySeparators ? null : formatDeparturePartsForTrip(row.trip.scheduled_departure_at).date"
                        :departure-time-label="formatDeparturePartsForTrip(row.trip.scheduled_departure_at).time"
                        :availability-label="formatTripPlacesRatio(row.trip)"
                        @select="emit('continue', row.trip.id)" />
                </template>
            </q-virtual-scroll>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import PublicProgramProductFilterSelect from './PublicProgramProductFilter.vue';
import PublicProgramBookingDateFilter from './PublicProgramBookingDateFilter.vue';
import PublicProgramBookingTripListRow from './PublicProgramBookingTripListRow.vue';
import type { BookingTripOption, PublicBookingProductFilterOption } from '../../models/public-booking/public-booking.types';
import {
    buildDailyAvailabilityMap,
    filterPublicBookingTrips,
    publicBookingTripHasAvailability,
} from '../../utilities/public-booking-filters';
import { pickTripBannerUrl } from '../../utilities/public-booking-trip-display';
import { formatDepartureParts, toTimezoneDateYmd } from '../../utilities/program-timezone-datetime';

type TripListDayItem = {
    kind: 'day';
    id: string;
    dateLabel: string;
};

type TripListTripItem = {
    kind: 'trip';
    id: string;
    trip: BookingTripOption;
};

type TripListItem = TripListDayItem | TripListTripItem;

const props = defineProps<{
    tripOptions: BookingTripOption[];
    programTimezone: string;
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

const dailyAvailabilityByDate = computed(() =>
    buildDailyAvailabilityMap(bookableTripOptions.value, props.programTimezone),
);

const filteredTripOptions = computed((): BookingTripOption[] => {
    const filtered = filterPublicBookingTrips(
        bookableTripOptions.value,
        {
            productId: selectedProductId.value,
            dateYmd: selectedDateYmd.value,
        },
        props.programTimezone,
    );
    return filtered as BookingTripOption[];
});

const showDaySeparators = computed(() => selectedDateYmd.value.trim().length === 0);

const virtualScrollItems = computed((): TripListItem[] => {
    const items: TripListItem[] = [];
    let lastDayYmd = '';

    for (const trip of filteredTripOptions.value) {
        if (showDaySeparators.value) {
            const dayYmd = toTimezoneDateYmd(trip.scheduled_departure_at, props.programTimezone);
            if (dayYmd != null && dayYmd !== lastDayYmd) {
                items.push({
                    kind: 'day',
                    id: `day-${dayYmd}`,
                    dateLabel: formatDeparturePartsForTrip(trip.scheduled_departure_at).date,
                });
                lastDayYmd = dayYmd;
            }
        }

        items.push({
            kind: 'trip',
            id: trip.id,
            trip,
        });
    }

    return items;
});

const hasActiveTripFilters = computed(
    () => selectedProductId.value.trim().length > 0 || selectedDateYmd.value.trim().length > 0,
);

function formatTripPlacesRatio(trip: BookingTripOption): string {
    return `${trip.remaining_capacity}/${trip.capacity}`;
}

function formatDeparturePartsForTrip(iso: string): { date: string; time: string } {
    return formatDepartureParts(iso, props.programTimezone, String(locale.value));
}

function clearAllFilters(): void {
    selectedProductId.value = '';
    selectedDateYmd.value = '';
}

</script>