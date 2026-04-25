<template>
    <q-list
        bordered
        separator
        class="app-entity-list bg-white rounded-borders"
        :class="listClass"
    >
        <slot />
    </q-list>
</template>

<script setup>
defineProps({
    listClass: {
        type: String,
        default: '',
    },
});
</script>

<style scoped>
.app-entity-list {
    border-color: rgba(0, 22, 77, 0.12);
}
</style>
