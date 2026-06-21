<template>
    <q-select
        :model-value="modelValue"
        outlined
        emit-value
        map-options
        use-input
        input-debounce="200"
        :options="filteredOptions"
        :label="label"
        :hint="hint"
        :disable="disable"
        :error="error"
        :error-message="errorMessage"
        @filter="onFilter"
        @update:model-value="onModelValueUpdate"
    />
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useTimezoneOptions, type TimezoneOption } from '../../composables/useTimezoneOptions';

defineProps<{
    modelValue: string;
    label: string;
    hint?: string;
    disable?: boolean;
    error?: boolean;
    errorMessage?: string;
}>();

const emit = defineEmits<{
    'update:modelValue': [value: string];
}>();

const { options } = useTimezoneOptions();
const filteredOptions = ref<TimezoneOption[]>([]);

watch(
    options,
    (next) => {
        filteredOptions.value = next;
    },
    { immediate: true },
);

function onFilter(
    inputValue: string,
    update: (callback: () => void) => void,
): void {
    const needle = inputValue.trim().toLowerCase();

    update(() => {
        if (needle.length === 0) {
            filteredOptions.value = options.value;
            return;
        }

        filteredOptions.value = options.value.filter(
            (option) =>
                option.label.toLowerCase().includes(needle) ||
                option.value.toLowerCase().includes(needle),
        );
    });
}

function onModelValueUpdate(value: string | null): void {
    emit('update:modelValue', value ?? '');
}
</script>
