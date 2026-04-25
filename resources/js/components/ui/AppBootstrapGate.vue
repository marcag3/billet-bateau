<template>
    <div>
        <q-inner-loading :showing="!ready" />
        <div
            v-if="ready"
            :class="contentClass"
        >
            <slot />
        </div>
    </div>
</template>

<script setup lang="ts">
withDefaults(
    defineProps<{
        ready?: boolean;
        /** Optional wrapper class for the ready slot (e.g. `q-gutter-y-md`). */
        contentClass?: string;
    }>(),
    {
        ready: false,
        contentClass: '',
    },
);
</script>
