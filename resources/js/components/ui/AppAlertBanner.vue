<template>
    <q-banner
        v-bind="$attrs"
        :class="bannerClass"
        rounded
    >
        <slot />
        <template
            v-if="dismissible || $slots.action"
            #action
        >
            <slot name="action" />
            <q-btn
                v-if="dismissible && !$slots.action"
                flat
                color="primary"
                :label="dismissLabel"
                @click="emit('dismiss')"
            />
        </template>
    </q-banner>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
    defineProps<{
        /** error | warning | info */
        variant?: 'error' | 'warning' | 'info';
        dismissible?: boolean;
        dismissLabel?: string;
    }>(),
    {
        variant: 'warning',
        dismissible: false,
        dismissLabel: '',
    },
);

const emit = defineEmits<{
    dismiss: [];
}>();

const bannerClass = computed(() => {
    const base = 'mb-4';
    if (props.variant === 'error') {
        return `bg-red-1 text-negative ${base}`;
    }
    if (props.variant === 'info') {
        return `bg-blue-1 text-dark ${base}`;
    }
    return `bg-amber-1 text-dark ${base}`;
});
</script>
