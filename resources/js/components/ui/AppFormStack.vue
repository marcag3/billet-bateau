<template>
    <div :class="rootClass">
        <slot />
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
    defineProps<{
        /**
         * Vertical spacing between stacked fields (Quasar gutter utilities).
         * Use `md` for card-section create forms (matches auth/setup vertical rhythm).
         */
        gutter?: 'none' | 'sm' | 'md' | 'lg';
    }>(),
    { gutter: 'md' },
);

const rootClass = computed(() => {
    if (props.gutter === 'none') {
        return 'app-form-stack';
    }
    return `app-form-stack q-gutter-y-${props.gutter}`;
});
</script>

<style scoped>
.app-form-stack {
    display: flex;
    flex-direction: column;
}
</style>
