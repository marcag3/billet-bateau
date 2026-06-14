<template>
    <q-card
        flat
        bordered
        class="app-card-section bg-white rounded-borders q-pa-md"
    >
        <div
            v-if="label"
            class="text-subtitle2 q-mb-md"
        >
            {{ label }}
        </div>
        <div
            v-else-if="$slots.label"
            class="text-subtitle2 q-mb-md"
        >
            <slot name="label" />
        </div>
        <slot />
    </q-card>
</template>

<script setup lang="ts">
withDefaults(
    defineProps<{
        label?: string;
    }>(),
    { label: '' },
);
</script>
