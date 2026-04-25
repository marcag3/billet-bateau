<template>
    <div :class="rootClass">
        <slot />
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
    defineProps<{
        /** Quasar column gutter between `col-*` children. */
        gutter?: 'xs' | 'sm' | 'md' | 'lg';
        /** Cross-axis alignment for the flex row (Quasar `items-*`). */
        items?: 'start' | 'center' | 'end' | 'stretch';
    }>(),
    { gutter: 'md', items: 'start' },
);

const rootClass = computed(() => `row q-col-gutter-${props.gutter} items-${props.items}`);
</script>
