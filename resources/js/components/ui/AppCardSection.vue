<template>
    <q-card
        flat
        bordered
        class="app-card-section bg-white rounded-borders q-pa-md"
    >
        <div
            v-if="label"
            class="text-subtitle2 q-mb-sm"
        >
            {{ label }}
        </div>
        <div
            v-else-if="$slots.label"
            class="text-subtitle2 q-mb-sm"
        >
            <slot name="label" />
        </div>
        <slot />
    </q-card>
</template>

<script setup>
defineProps({
    label: {
        type: String,
        default: '',
    },
});
</script>
