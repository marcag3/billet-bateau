<template>
    <AppMapSelect
        :model-value="modelValue"
        :options="optionItems"
        :label="label"
        :disable="disable"
        v-bind="$attrs"
        @update:model-value="onModelValueUpdate"
    >
        <template #after>
            <q-btn
                flat
                round
                dense
                icon="add"
                @click="openWaterRouteFormCreate"
            />
        </template>
    </AppMapSelect>

    <q-dialog v-model="waterRouteFormDialogOpen" persistent>
        <q-card v-if="waterRouteFormDialogOpen" style="min-width: 320px">
            <q-card-section>
                <div class="text-h6">{{ waterRouteFormDialogTitle }}</div>
            </q-card-section>
            <q-card-section>
                <AppWaterRouteForm
                    :program-id="programId"
                    :water-route-id="waterRouteFormWaterRouteId"
                    @cancel="closeWaterRouteFormDialog"
                    @success="onWaterRouteFormSuccess"
                />
            </q-card-section>
        </q-card>
    </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, toRef } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useProgramWaterRoutes } from '../../composables/useProgramWaterRoutes';
import AppMapSelect from '../molecules/AppMapSelect.vue';
import AppWaterRouteForm from '../molecules/AppWaterRouteForm.vue';

const props = defineProps<{
    modelValue: string | null;
    programId: string;
    label: string;
    disable?: boolean;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: string | null): void;
}>();

function onModelValueUpdate(
    value: string | number | null | undefined,
): void {
    if (value == null || value === '') {
        emit('update:modelValue', null);
        return;
    }
    emit('update:modelValue', String(value));
}

const { t } = useI18n();
const $q = useQuasar();

const programIdRef = toRef(props, 'programId');
const { data: waterRoutes } = useProgramWaterRoutes(programIdRef);

const optionItems = computed(() =>
    (waterRoutes.value ?? []).map((wr) => ({
        label: String(wr.name ?? ''),
        value: String(wr.id),
    })),
);

const waterRouteFormDialogOpen = ref(false);
const waterRouteFormWaterRouteId = ref<string | null>(null);

const waterRouteFormDialogTitle = computed(() =>
    waterRouteFormWaterRouteId.value != null &&
    waterRouteFormWaterRouteId.value.length > 0
        ? t('waterRoutesList.editTitle')
        : t('waterRoutesList.addNew'),
);

function openWaterRouteFormCreate(): void {
    waterRouteFormWaterRouteId.value = null;
    waterRouteFormDialogOpen.value = true;
}

function closeWaterRouteFormDialog(): void {
    waterRouteFormDialogOpen.value = false;
}

function onWaterRouteFormSuccess(payload: { id: string; mode: 'create' | 'edit' }): void {
    closeWaterRouteFormDialog();
    $q.notify({
        type: 'positive',
        message:
            payload.mode === 'create'
                ? t('waterRoutesList.created')
                : t('waterRoutesList.updated'),
    });
    if (payload.mode === 'create') {
        emit('update:modelValue', payload.id);
    }
}
</script>
