<template>
    <q-dialog :model-value="open" persistent @update:model-value="onDialogUpdate">
        <q-card style="min-width: 320px; max-width: 640px; width: 100%">
            <q-card-section class="row items-center q-pb-none">
                <div class="text-h6 col">{{ t('programsControlAdmin.editBookingTitle') }}</div>
                <q-btn v-close-popup flat round dense icon="close" />
            </q-card-section>

            <q-card-section class="scroll" style="max-height: 75vh">
                <AppControlBookingEditForm
                    v-if="normalizedBookingId.length > 0"
                    :booking-id="normalizedBookingId"
                    @deleted="onBookingDeleted"
                />
            </q-card-section>
        </q-card>
    </q-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import AppControlBookingEditForm from './AppControlBookingEditForm.vue';

const props = defineProps<{
    open: boolean;
    bookingId: string;
}>();

const emit = defineEmits<{
    'update:open': [value: boolean];
}>();

const { t } = useI18n();

const normalizedBookingId = computed(() => String(props.bookingId ?? '').trim());

function onDialogUpdate(value: boolean): void {
    emit('update:open', value);
}

function onBookingDeleted(): void {
    emit('update:open', false);
}
</script>
