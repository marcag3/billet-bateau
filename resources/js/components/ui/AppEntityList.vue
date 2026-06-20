<template>
    <q-list
        bordered
        separator
        class="bg-white rounded-borders border-[hsla(226,97%,12%,0.12)]"
        :class="listClass"
    >
        <slot />
    </q-list>
</template>

<script setup lang="ts">
withDefaults(
    defineProps<{
        listClass?: string;
    }>(),
    { listClass: '' },
);
</script>