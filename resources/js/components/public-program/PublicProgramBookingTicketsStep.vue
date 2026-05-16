<template>
    <div>
        <div v-if="ticketTypeOptions.length === 0" class="text-body1 text-grey-8">
            {{ t('publicBooking.noTicketTypes') }}
        </div>
        <div v-else class="column q-gutter-md">
            <div
                v-for="tt in ticketTypeOptions"
                :key="`tt-${String(tt.id)}`"
                class="row items-center q-col-gutter-sm"
            >
                <div class="col-12 col-sm-6">
                    <div class="text-subtitle1 text-weight-medium">{{ tt.title }}</div>
                    <div class="text-caption text-grey-7">{{ formatTicketTypePrice(tt) }}</div>
                </div>
                <div class="col-12 col-sm-4">
                    <q-input
                        v-model.number="ticketQuantities[String(tt.id)]"
                        type="number"
                        outlined
                        dense
                        :min="0"
                        :label="t('publicBooking.ticketQuantityLabel', { title: tt.title })"
                    />
                </div>
            </div>
        </div>
        <div class="row q-gutter-sm q-mt-md justify-between">
            <q-btn flat no-caps color="primary" :label="t('publicBooking.back')" @click="emit('back')" />
            <q-btn
                color="primary"
                no-caps
                :label="t('publicBooking.continue')"
                :disable="ticketTypeOptions.length === 0"
                @click="emit('continue')"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import type { BookingTicketTypeOption } from '../../models/public-booking/public-booking.types';

defineProps<{
    ticketTypeOptions: BookingTicketTypeOption[];
    formatTicketTypePrice: (tt: BookingTicketTypeOption) => string;
}>();

const emit = defineEmits<{
    back: [];
    continue: [];
}>();

const ticketQuantities = defineModel<Record<string, number>>('ticketQuantities', { required: true });

const { t } = useI18n();
</script>
