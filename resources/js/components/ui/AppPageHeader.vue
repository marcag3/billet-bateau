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
            class="q-mt-sm"
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

<style scoped>
.app-page-header--hero {
    border-radius: var(--app-radius-lg);
    padding: 1.5rem;
    background: linear-gradient(
        122deg,
        rgba(0, 22, 77, 0.95) 0%,
        rgba(8, 44, 116, 0.94) 64%,
        rgba(234, 29, 44, 0.9) 100%
    );
    color: #ffffff;
    box-shadow: var(--app-hero-shadow);
}

.app-page-header__hero-copy {
    color: rgba(255, 255, 255, 0.9);
}
</style>
