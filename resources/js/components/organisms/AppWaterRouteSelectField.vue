<template>
    <AppMapSelect
        :model-value="modelValue"
        :options="optionItems"
        :label="label"
        :disable="disable"
        v-bind="$attrs"
        @update:model-value="onModelValueUpdate"
    />
</template>

<script setup lang="ts">
import { computed, toRef } from 'vue';
import { useProgramWaterRoutes } from '../../composables/useProgramWaterRoutes';
import AppMapSelect from '../molecules/AppMapSelect.vue';

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

const programIdRef = toRef(props, 'programId');
const { data: waterRoutes } = useProgramWaterRoutes(programIdRef);

const optionItems = computed(() =>
    (waterRoutes.value ?? []).map((wr) => ({
        label: String(wr.name ?? ''),
        value: String(wr.id),
    })),
);
</script>
