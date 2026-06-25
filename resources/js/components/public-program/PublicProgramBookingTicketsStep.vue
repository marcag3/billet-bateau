<template>
    <div class="p-4">
        <q-card v-if="hasProductSummary" flat bordered class="mb-4">
            <q-img v-if="productBannerUrl != null" :src="productBannerUrl" :alt="productName ?? ''" height="180px"
                fit="cover" />
            <q-card-section v-if="productName != null || productDescription != null">
                <div v-if="productName != null" class="text-subtitle1 text-weight-medium">{{ productName }}</div>
                <p v-if="productDescription != null" class="text-body2 text-grey-8 mb-0"
                    :class="{ 'mt-2': productName != null }">
                    {{ productDescription }}
                </p>
            </q-card-section>
        </q-card>

        <AppTicketQuantityPicker
            v-model:ticket-quantities="ticketQuantities"
            :ticket-type-options="ticketTypeOptions"
            :format-ticket-type-price="formatTicketTypePrice"
            :ticket-errors="ticketErrors"
        />
        <div class="row gap-2 mt-4 justify-between">
            <q-btn flat no-caps color="primary" :label="t('publicBooking.back')" @click="emit('back')" />
            <q-btn color="primary" no-caps :label="t('publicBooking.continue')" :disable="!props.canContinue"
                @click="emit('continue')" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { BookingTicketTypeOption, BookingTripOption } from '../../models/public-booking/public-booking.types';
import { pickTripBannerUrl } from '../../utilities/public-booking-trip-display';
import AppTicketQuantityPicker from '../molecules/AppTicketQuantityPicker.vue';

const props = withDefaults(
    defineProps<{
        ticketTypeOptions: BookingTicketTypeOption[];
        formatTicketTypePrice: (tt: BookingTicketTypeOption) => string;
        canContinue: boolean;
        ticketErrors?: Record<string, string>;
        selectedTrip?: BookingTripOption;
    }>(),
    {
        ticketErrors: () => ({}),
        selectedTrip: undefined,
    },
);

const productName = computed((): string | null => {
    const name = String(props.selectedTrip?.product_name ?? '').trim();
    return name.length > 0 ? name : null;
});

const productDescription = computed((): string | null => {
    const description = String(props.selectedTrip?.product_description ?? '').trim();
    return description.length > 0 ? description : null;
});

const productBannerUrl = computed((): string | null => {
    if (props.selectedTrip == null) {
        return null;
    }

    return pickTripBannerUrl(props.selectedTrip);
});

const hasProductSummary = computed(
    () => productName.value != null || productDescription.value != null || productBannerUrl.value != null,
);

const emit = defineEmits<{
    back: [];
    continue: [];
}>();

const ticketQuantities = defineModel<Record<string, number>>('ticketQuantities', { required: true });

const { t } = useI18n();
</script>
