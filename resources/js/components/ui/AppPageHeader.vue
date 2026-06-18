<template>
    <header class="app-page-header mb-2">
        <h1 v-if="title" class="text-h4 mb-2">
            {{ title }}
        </h1>
        <slot v-else name="title" />
        <p v-if="hasDefaultSlot" class="text-body1 text-grey-8 mb-2">
            <slot />
        </p>
        <div v-if="$slots.actions" class="mt-2 row justify-end">
            <slot name="actions" />
        </div>
    </header>
</template>

<script setup lang="ts">
import { computed, useSlots } from "vue";

withDefaults(
    defineProps<{
        title?: string;
    }>(),
    {
        title: "",
    },
);

const slots = useSlots();
const hasDefaultSlot = computed(() => Boolean(slots.default));
</script>
