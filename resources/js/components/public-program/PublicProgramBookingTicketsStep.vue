<template>
    <div>
        <div v-if="ticketTypeOptions.length === 0" class="text-body1 text-grey-8">
            {{ t('publicBooking.noTicketTypes') }}
        </div>
        <div v-else class="column q-gutter-md">
            <div v-for="tt in ticketTypeOptions" :key="`tt-${String(tt.id)}`"
                class=" flex items-center justify-around md:gap-6 md:px-6 q-col-gutter-sm">
                <div class="col-12 col-sm-6">
                    <div class="text-subtitle1 text-weight-medium">{{ tt.title }}</div>
                    <div class="text-caption text-grey-7">{{ formatTicketTypePrice(tt) }}</div>
                </div>
                <div class="col-12 col-sm-6">
                    <div class="row items-start no-wrap justify-end">
                        <q-btn round dense flat color="primary" icon="remove" :disable="getTicketQuantity(tt.id) === 0"
                            @click="decrementTicketQuantity(tt.id)" />
                        <q-input class="q-mx-sm" dense outlined type="number" min="0"
                            :model-value="getTicketQuantity(tt.id)" :error="Boolean(getTicketErrorMessage(tt.id))"
                            :error-message="getTicketErrorMessage(tt.id)" input-class="text-center" style="width: 170px"
                            @update:model-value="setTicketQuantity(tt.id, $event)" @blur="markTicketTouched(tt.id)" />
                        <q-btn round dense flat color="primary" icon="add" @click="incrementTicketQuantity(tt.id)" />
                    </div>
                </div>
            </div>
        </div>
        <div class="row q-gutter-sm q-mt-md justify-between">
            <q-btn flat no-caps color="primary" :label="t('publicBooking.back')" @click="emit('back')" />
            <q-btn color="primary" no-caps :label="t('publicBooking.continue')" :disable="!props.canContinue"
                @click="emit('continue')" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { BookingTicketTypeOption } from '../../models/public-booking/public-booking.types';

const props = withDefaults(
    defineProps<{
        ticketTypeOptions: BookingTicketTypeOption[];
        formatTicketTypePrice: (tt: BookingTicketTypeOption) => string;
        canContinue: boolean;
        ticketErrors?: Record<string, string>;
    }>(),
    {
        ticketErrors: () => ({}),
    },
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
