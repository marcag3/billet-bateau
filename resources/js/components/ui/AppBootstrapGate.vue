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

<script setup>
defineProps({
    ready: {
        type: Boolean,
        default: false,
    },
    /** Optional wrapper class for the ready slot (e.g. `q-gutter-y-md`). */
    contentClass: {
        type: String,
        default: '',
    },
});
</script>
