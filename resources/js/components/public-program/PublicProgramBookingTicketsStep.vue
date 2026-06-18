<template>
    <div>
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

        <div v-if="ticketTypeOptions.length === 0" class="text-body1 text-grey-8">
            {{ t('publicBooking.noTicketTypes') }}
        </div>
        <div v-else class="column gap-4">
            <div v-for="tt in ticketTypeOptions" :key="`tt-${String(tt.id)}`"
                class="grid grid-cols-1 sm:grid-cols-2 items-center gap-2 md:gap-6 md:px-6">
                <div>
                    <div class="text-subtitle1 text-weight-medium">{{ tt.title }}</div>
                    <div class="text-caption text-grey-7">{{ formatTicketTypePrice(tt) }}</div>
                </div>
                <div>
                    <div class="row items-start no-wrap justify-end">
                        <q-btn round dense flat color="primary" icon="remove" :disable="getTicketQuantity(tt.id) === 0"
                            @click="decrementTicketQuantity(tt.id)" />
                        <q-input class="mx-2" dense outlined type="number" min="0"
                            :model-value="getTicketQuantity(tt.id)" :error="Boolean(getTicketErrorMessage(tt.id))"
                            :error-message="getTicketErrorMessage(tt.id)" input-class="text-center" style="width: 170px"
                            @update:model-value="setTicketQuantity(tt.id, $event)" @blur="markTicketTouched(tt.id)" />
                        <q-btn round dense flat color="primary" icon="add" @click="incrementTicketQuantity(tt.id)" />
                    </div>
                </div>
            </div>
        </div>
        <div class="row gap-2 mt-4 justify-between">
            <q-btn flat no-caps color="primary" :label="t('publicBooking.back')" @click="emit('back')" />
            <q-btn color="primary" no-caps :label="t('publicBooking.continue')" :disable="!props.canContinue"
                @click="emit('continue')" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { BookingTicketTypeOption, BookingTripOption } from '../../models/public-booking/public-booking.types';
import { pickTripBannerUrl } from '../../utilities/public-booking-trip-display';

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
const touchedTicketTypes = ref<Record<string, boolean>>({});

const markTicketTouched = (ticketTypeId: BookingTicketTypeOption['id']): void => {
    const key = String(ticketTypeId);
    touchedTicketTypes.value[key] = true;
};

const getTicketErrorMessage = (ticketTypeId: BookingTicketTypeOption['id']): string => {
    const key = String(ticketTypeId);
    if (touchedTicketTypes.value[key] !== true) {
        return '';
    }

    return props.ticketErrors[key] ?? '';
};

const getTicketQuantity = (ticketTypeId: BookingTicketTypeOption['id']): number => {
    const key = String(ticketTypeId);
    const currentQuantity = Number(ticketQuantities.value[key] ?? 0);

    if (!Number.isFinite(currentQuantity) || currentQuantity < 0) {
        ticketQuantities.value[key] = 0;
        return 0;
    }

    const normalizedQuantity = Math.floor(currentQuantity);

    if (normalizedQuantity !== currentQuantity) {
        ticketQuantities.value[key] = normalizedQuantity;
    }

    return normalizedQuantity;
};

const incrementTicketQuantity = (ticketTypeId: BookingTicketTypeOption['id']): void => {
    const key = String(ticketTypeId);
    ticketQuantities.value[key] = getTicketQuantity(ticketTypeId) + 1;
    markTicketTouched(ticketTypeId);
};

const decrementTicketQuantity = (ticketTypeId: BookingTicketTypeOption['id']): void => {
    const key = String(ticketTypeId);
    ticketQuantities.value[key] = Math.max(0, getTicketQuantity(ticketTypeId) - 1);
    markTicketTouched(ticketTypeId);
};

const setTicketQuantity = (ticketTypeId: BookingTicketTypeOption['id'], value: number | string | null): void => {
    const key = String(ticketTypeId);
    const parsed = Number(value ?? 0);
    const normalized = Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
    ticketQuantities.value[key] = normalized;
};

const { t } = useI18n();
</script>
