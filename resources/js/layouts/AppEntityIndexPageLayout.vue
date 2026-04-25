<template>
    <q-page :class="pageClass">
        <div class="q-gutter-y-md">
            <slot name="header" />
            <div v-if="$slots.filters">
                <slot name="filters" />
            </div>
            <slot />
        </div>
    </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
    defineProps<{
        /** Default `q-pa-xl` for list pages. */
        paddingClass?: string;
    }>(),
    {
        paddingClass: 'q-pa-xl',
    },
);

const pageClass = computed(() => props.paddingClass);
</script>
