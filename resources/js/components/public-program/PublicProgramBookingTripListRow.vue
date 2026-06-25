<template>
    <tr class="cursor-pointer" @click="emit('select')">
        <td class="text-center align-top w-10 sm:w-14">
            <q-avatar v-if="bannerUrl != null" rounded class="!size-9 sm:!size-12">
                <q-img :src="bannerUrl" :alt="trip.product_name" fit="cover" />
            </q-avatar>
        </td>
        <td class="align-top whitespace-nowrap !whitespace-nowrap" style="width: 1%">
            <div v-if="departureDateLabel != null && departureDateLabel.length > 0">{{ departureDateLabel }}</div>
            <div :class="departureDateLabel != null && departureDateLabel.length > 0 ? 'text-body2 text-grey-7' : undefined">
                {{ departureTimeLabel }}
            </div>
        </td>
        <td class="align-top min-w-0 !whitespace-normal break-words">
            <div class="text-weight-medium">{{ trip.product_name }}</div>
            <div v-if="waterRouteLine != null" class="text-body2 text-grey-7">
                {{ waterRouteLine }}
            </div>
        </td>
        <td class="align-top whitespace-nowrap !whitespace-nowrap" style="width: 1%">{{ availabilityLabel }}</td>
    </tr>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { BookingTripOption } from '../../models/public-booking/public-booking.types';
import {
    formatWaterRouteDurationLabel,
    formatWaterRouteLine,
    pickTripBannerUrl,
} from '../../utilities/public-booking-trip-display';

const props = defineProps<{
    trip: BookingTripOption;
    departureDateLabel?: string | null;
    departureTimeLabel: string;
    availabilityLabel: string;
}>();

const emit = defineEmits<{
    select: [];
}>();

const { t } = useI18n();

const bannerUrl = computed(() => pickTripBannerUrl(props.trip));

const waterRouteLine = computed(() =>
    formatWaterRouteLine(props.trip, (minutes) => formatWaterRouteDurationLabel(minutes, t)),
);
</script>
