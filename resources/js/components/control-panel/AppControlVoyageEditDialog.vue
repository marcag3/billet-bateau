<template>
    <q-dialog :model-value="open" persistent @update:model-value="onDialogUpdate">
        <q-card style="min-width: 320px; max-width: 720px; width: 100%">
            <q-card-section class="row items-center q-pb-none">
                <div class="text-h6 col">{{ t('programsControlAdmin.editVoyageTitle') }}</div>
                <q-btn v-close-popup flat round dense icon="close" />
            </q-card-section>

            <q-card-section class="scroll" style="max-height: 75vh">
                <AppControlVoyageEditForm
                    v-if="normalizedVoyageId.length > 0"
                    :voyage-id="normalizedVoyageId"
                    @deleted="onVoyageDeleted"
                    @open-booking="onOpenBooking"
                />
            </q-card-section>
        </q-card>
    </q-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import AppControlVoyageEditForm from './AppControlVoyageEditForm.vue';

const props = defineProps<{
    open: boolean;
    voyageId: string;
}>();

const emit = defineEmits<{
    'update:open': [value: boolean];
    'open-booking': [bookingId: string];
}>();

const { t } = useI18n();

const normalizedVoyageId = computed(() => String(props.voyageId ?? '').trim());

function onDialogUpdate(value: boolean): void {
    emit('update:open', value);
}

function onVoyageDeleted(): void {
    emit('update:open', false);
}

function onOpenBooking(bookingId: string): void {
    emit('open-booking', bookingId);
}
</script>
