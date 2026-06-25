<template>
    <div v-if="ticketTypeOptions.length === 0" class="text-body1 text-grey-8">
        {{ t('publicBooking.noTicketTypes') }}
    </div>
    <div v-else class="column gap-4">
        <div
            v-for="tt in ticketTypeOptions"
            :key="`tt-${String(tt.id)}`"
            class="grid grid-cols-2 items-center gap-2 md:gap-6 md:px-6"
        >
            <div>
                <div class="text-subtitle1 text-weight-medium">{{ tt.title }}</div>
                <div class="text-caption text-grey-7">{{ formatTicketTypePrice(tt) }}</div>
            </div>
            <div>
                <div class="row items-start no-wrap justify-end">
                    <q-btn
                        round
                        dense
                        flat
                        color="primary"
                        icon="remove"
                        :disable="getTicketQuantity(tt.id) === 0"
                        @click="decrementTicketQuantity(tt.id)"
                    />
                    <q-input
                        class="mx-0"
                        dense
                        outlined
                        type="number"
                        min="0"
                        :model-value="getTicketQuantity(tt.id)"
                        :error="Boolean(getTicketErrorMessage(tt.id))"
                        :error-message="getTicketErrorMessage(tt.id)"
                        input-class="text-center"
                        style="width: 170px"
                        @update:model-value="setTicketQuantity(tt.id, $event)"
                        @blur="markTicketTouched(tt.id)"
                    />
                    <q-btn
                        round
                        dense
                        flat
                        color="primary"
                        icon="add"
                        @click="incrementTicketQuantity(tt.id)"
                    />
                </div>
            </div>
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
        ticketErrors?: Record<string, string>;
    }>(),
    {
        ticketErrors: () => ({}),
    },
);

const ticketQuantities = defineModel<Record<string, number>>('ticketQuantities', { required: true });
const touchedTicketTypes = ref<Record<string, boolean>>({});

const { t } = useI18n();

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

function resetTouchedState(): void {
    touchedTicketTypes.value = {};
}

defineExpose({ resetTouchedState, markTicketTouched });
</script>
