<template>
    <div>
        <q-inner-loading :showing="!ready" />
        <slot v-if="ready" />
    </div>
</template>

<script setup lang="ts">
withDefaults(
    defineProps<{
        ready?: boolean;
    }>(),
    {
        ready: false,
    },
);
</script>
