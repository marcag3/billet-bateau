<template>
    <q-item v-if="show">
        <q-item-section>
            <q-item-label>{{ message }}</q-item-label>
        </q-item-section>
    </q-item>
</template>

<script setup lang="ts">
withDefaults(
    defineProps<{
        show?: boolean;
        message: string;
    }>(),
    { show: true },
);
</script>
