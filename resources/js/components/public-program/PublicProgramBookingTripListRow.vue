<template>
    <tr class="cursor-pointer" @click="emit('select')">
        <td class="text-center" style="width: 3.5rem">
            <q-avatar v-if="bannerUrl != null" rounded size="48px">
                <q-img :src="bannerUrl" :alt="trip.product_name" fit="cover" />
            </q-avatar>
        </td>
        <td class="whitespace-pre-line">{{ departureLabel }}</td>
        <td>
            <div class="text-weight-medium">{{ trip.product_name }}</div>
            <div v-if="waterRouteLine != null" class="text-body2 text-grey-7">
                {{ waterRouteLine }}
            </div>
        </td>
        <td>{{ availabilityLabel }}</td>
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
    departureLabel: string;
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
