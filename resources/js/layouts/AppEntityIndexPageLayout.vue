<template>
    <q-page :class="pageClass">
        <div class="column gap-4">
            <slot name="header" />
            <div v-if="$slots.filters">
                <slot name="filters" />
            </div>
            <slot />
        </div>
    </q-page>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
    defineProps<{
        /** Default page padding (`p-4`). */
        paddingClass?: string;
    }>(),
    {
        paddingClass: "p-4",
    },
);

const pageClass = computed(() => props.paddingClass);
</script>
