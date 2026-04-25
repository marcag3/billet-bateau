<template>
    <q-item v-if="show">
        <q-item-section>
            <q-item-label>{{ message }}</q-item-label>
        </q-item-section>
    </q-item>
</template>

<script setup>
defineProps({
    show: {
        type: Boolean,
        default: true,
    },
    message: {
        type: String,
        required: true,
    },
});
</script>
