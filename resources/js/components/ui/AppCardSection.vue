<template>
    <q-card
        flat
        bordered
        class="app-card-section bg-white rounded-borders p-4"
    >
        <div
            v-if="label"
            class="text-subtitle2 mb-4"
        >
            {{ label }}
        </div>
        <div
            v-else-if="$slots.label"
            class="text-subtitle2 mb-4"
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
