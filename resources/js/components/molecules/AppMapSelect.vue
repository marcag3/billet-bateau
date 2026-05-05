<template>
    <q-select
        :model-value="modelValue"
        :options="resolvedOptions"
        :label="label"
        :disable="disable"
        emit-value
        map-options
        outlined
        :clearable="clearable"
        :use-input="filterable"
        :input-debounce="filterable ? inputDebounce : undefined"
        v-bind="attrs"
        @update:model-value="$emit('update:modelValue', $event)"
        @filter="onFilter"
    >
        <template v-if="$slots.option" #option="slotProps">
            <slot name="option" v-bind="slotProps" />
        </template>
        <template v-if="$slots.after" #after>
            <slot name="after" />
        </template>
        <template v-if="$slots.before" #before>
            <slot name="before" />
        </template>
        <template v-if="$slots.error" #error>
            <slot name="error" />
        </template>
    </q-select>
</template>

<script setup lang="ts">
import { computed, ref, useAttrs, watch } from 'vue';

defineOptions({
    inheritAttrs: false,
});

const props = withDefaults(
    defineProps<{
        modelValue: string | number | null;
        options: readonly Record<string, unknown>[];
        label?: string;
        disable?: boolean;
        /** Client-side filter on `option.label` (case-insensitive). */
        filterable?: boolean;
        clearable?: boolean;
        /** Milliseconds when `filterable` is true. */
        inputDebounce?: number;
    }>(),
    {
        label: undefined,
        disable: false,
        filterable: false,
        clearable: true,
        inputDebounce: 0,
    },
);

defineEmits<{
    (e: 'update:modelValue', value: string | number | null | undefined): void;
}>();

const attrs = useAttrs();

const filteredOptions = ref<Record<string, unknown>[]>([]);

watch(
    () => props.options,
    (next) => {
        filteredOptions.value = [...next];
    },
    { deep: true, immediate: true },
);

const resolvedOptions = computed(() =>
    props.filterable ? filteredOptions.value : props.options,
);

function onFilter(
    val: string,
    update: (arg: () => void, ref?: () => void) => void,
) {
    if (!props.filterable) {
        return;
    }
    update(() => {
        const needle = String(val).toLowerCase();
        filteredOptions.value = props.options.filter((opt) =>
            String((opt as { label?: string }).label ?? '')
                .toLowerCase()
                .includes(needle),
        );
    });
}
</script>
