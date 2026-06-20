<template>
    <q-dialog :model-value="open" persistent @update:model-value="onDialogUpdate">
        <q-card style="min-width: 320px; max-width: 480px">
            <q-card-section class="text-h6">
                {{ t('programsControl.startDepartTitle') }}
            </q-card-section>

            <q-card-section class="column gap-4">
                <q-select
                    v-model="selectedBoatIds"
                    :options="boatOptions"
                    :label="t('programsControl.selectBoats')"
                    multiple
                    use-chips
                    emit-value
                    map-options
                    option-value="value"
                    option-label="label"
                />
                <q-select
                    v-model="selectedGuideIds"
                    :options="guideOptions"
                    :label="t('programsControl.selectGuides')"
                    multiple
                    use-chips
                    emit-value
                    map-options
                    option-value="value"
                    option-label="label"
                />
            </q-card-section>

            <q-card-actions align="right">
                <q-btn v-close-popup flat no-caps :label="t('common.cancel')" />
                <q-btn
                    color="primary"
                    no-caps
                    :label="t('programsControl.confirmDepart')"
                    :loading="submitting"
                    @click="emit('confirm', { boatIds: selectedBoatIds, guideIds: selectedGuideIds })"
                />
            </q-card-actions>
        </q-card>
    </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

export type ControlPanelSelectOption = {
    label: string;
    value: string;
};

const props = defineProps<{
    open: boolean;
    boatOptions: ControlPanelSelectOption[];
    guideOptions: ControlPanelSelectOption[];
    initialBoatIds: string[];
    initialGuideIds: string[];
    submitting?: boolean;
}>();

const emit = defineEmits<{
    'update:open': [value: boolean];
    confirm: [payload: { boatIds: string[]; guideIds: string[] }];
}>();

const { t } = useI18n();

const selectedBoatIds = ref<string[]>([]);
const selectedGuideIds = ref<string[]>([]);

watch(
    () => props.open,
    (isOpen) => {
        if (!isOpen) {
            return;
        }
        selectedBoatIds.value = [...props.initialBoatIds];
        selectedGuideIds.value = [...props.initialGuideIds];
    },
);

function onDialogUpdate(value: boolean): void {
    emit('update:open', value);
}
</script>
