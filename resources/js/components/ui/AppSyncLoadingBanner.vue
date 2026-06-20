<template>
    <q-banner rounded class="bg-grey-2 text-body2">
        <template #avatar>
            <q-spinner color="primary" size="sm" />
        </template>
        <div class="text-weight-medium">
            {{ title }}
        </div>
        <div v-if="hint != null && hint !== ''" class="text-caption text-grey-8">
            {{ hint }}
        </div>
    </q-banner>
</template>

<script setup lang="ts">
defineProps<{
    title: string;
    hint?: string;
}>();
</script>
