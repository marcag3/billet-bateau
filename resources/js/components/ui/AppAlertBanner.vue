<template>
    <q-banner
        v-bind="$attrs"
        :class="bannerClass"
        rounded
    >
        <slot />
        <template
            v-if="dismissible"
            #action
        >
            <slot
                v-if="$slots.action"
                name="action"
            />
            <q-btn
                v-else
                flat
                color="primary"
                :label="dismissLabel"
                @click="emit('dismiss')"
            />
        </template>
    </q-banner>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
    /** error | warning | info */
    variant: {
        type: String,
        default: 'warning',
        validator: (v) => v === 'error' || v === 'warning' || v === 'info',
    },
    dismissible: {
        type: Boolean,
        default: false,
    },
    dismissLabel: {
        type: String,
        default: '',
    },
});

const emit = defineEmits(['dismiss']);

const bannerClass = computed(() => {
    const base = 'q-mb-md';
    if (props.variant === 'error') {
        return `bg-red-1 text-negative ${base}`;
    }
    if (props.variant === 'info') {
        return `bg-blue-1 text-dark ${base}`;
    }
    return `bg-amber-1 text-dark ${base}`;
});
</script>
