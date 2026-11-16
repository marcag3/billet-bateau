<template>
    <q-dialog v-model="isOpen" persistent>
        <q-card style="min-width: 320px; max-width: 480px">
            <q-card-section class="text-h6">
                {{ t('programsControlAdmin.editTicket') }}
            </q-card-section>
            <q-form @submit.prevent="emit('submit')">
                <q-card-section class="column gap-4">
                    <q-select
                        v-model="ticketTypeId"
                        outlined
                        emit-value
                        map-options
                        :options="ticketTypeOptions"
                        :label="t('programsControl.ticketType')"
                    />
                    <q-input
                        v-model="name"
                        outlined
                        :label="t('programsControl.passengerName')"
                    />
                    <q-input
                        v-model="email"
                        outlined
                        type="email"
                        :label="t('publicBooking.contactEmail')"
                    />
                    <AppCountrySelect
                        v-model="country"
                        :label="t('publicBooking.country')"
                    />
                </q-card-section>
                <q-card-actions align="right">
                    <q-btn v-close-popup flat :label="t('common.cancel')" />
                    <q-btn color="primary" type="submit" :label="t('common.save')" />
                </q-card-actions>
            </q-form>
        </q-card>
    </q-dialog>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import AppCountrySelect from './AppCountrySelect.vue';

defineProps<{
    ticketTypeOptions: { value: string; label: string }[];
}>();

const emit = defineEmits<{
    submit: [];
}>();

const isOpen = defineModel<boolean>({ required: true });
const ticketTypeId = defineModel<string>('ticketTypeId', { required: true });
const name = defineModel<string>('name', { required: true });
const email = defineModel<string>('email', { required: true });
const country = defineModel<string>('country', { required: true });

const { t } = useI18n();
</script>
