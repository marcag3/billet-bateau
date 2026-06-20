<template>
    <q-page :class="pageClass">
        <div class="column gap-4">
            <div v-if="backTo" class="row items-center">
                <q-btn flat color="primary" icon="arrow_back" :to="backTo" :label="backLabel" />
            </div>
            <AppPageHeader v-if="title || $slots['header-extra']" :title="title">
                <template v-if="$slots['header-extra']" #actions>
                    <slot name="header-extra" />
                </template>
            </AppPageHeader>
            <slot name="alerts" />
            <div v-if="$slots.quickNav">
                <slot name="quickNav" />
            </div>
            <slot />
        </div>
    </q-page>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { RouteLocationRaw } from "vue-router";
import AppPageHeader from "../components/ui/AppPageHeader.vue";

const props = withDefaults(
    defineProps<{
        title?: string;
        backTo?: RouteLocationRaw | null;
        backLabel?: string;
        paddingClass?: string;
    }>(),
    {
        title: "",
        backTo: null,
        backLabel: "",
        paddingClass: "p-4",
    },
);

const pageClass = computed(() => props.paddingClass);
</script>
