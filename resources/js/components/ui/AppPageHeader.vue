<template>
    <header class="app-page-header">
        <h1
            v-if="title"
            class="text-h4 q-mb-sm"
        >
            {{ title }}
        </h1>
        <slot
            v-else
            name="title"
        />
        <p
            v-if="description"
            class="text-body1 text-grey-8 q-mb-lg"
        >
            {{ description }}
        </p>
        <p
            v-else-if="hasDefaultSlot"
            class="text-body1 text-grey-8 q-mb-lg"
        >
            <slot />
        </p>
        <div
            v-if="$slots.actions"
            class="q-mt-sm row justify-end"
        >
            <slot name="actions" />
        </div>
    </header>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue';

const props = withDefaults(
    defineProps<{
        title?: string;
        description?: string;
    }>(),
    {
        title: '',
        description: '',
    },
);

const slots = useSlots();
const hasDefaultSlot = computed(() => Boolean(slots.default));

</script>
