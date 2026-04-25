<template>
    <q-page :class="pageClass">
        <div class="q-gutter-y-md">
            <div
                v-if="backTo"
                class="row items-center"
            >
                <q-btn
                    flat
                    color="primary"
                    icon="arrow_back"
                    :to="backTo"
                    :label="backLabel"
                />
            </div>
            <AppPageHeader
                v-if="title || description || $slots['header-extra']"
                :title="title"
                :description="description"
            >
                <template
                    v-if="$slots['header-extra']"
                    #actions
                >
                    <slot name="header-extra" />
                </template>
            </AppPageHeader>
            <slot name="alerts" />
            <AppBootstrapGate
                :ready="ready"
                :content-class="bootstrapContentClass"
            >
                <slot />
            </AppBootstrapGate>
        </div>
    </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { RouteLocationRaw } from 'vue-router';
import AppPageHeader from '../components/ui/AppPageHeader.vue';
import AppBootstrapGate from '../components/ui/AppBootstrapGate.vue';

const props = withDefaults(
    defineProps<{
        title?: string;
        description?: string;
        backTo?: RouteLocationRaw | null;
        backLabel?: string;
        ready: boolean;
        paddingClass?: string;
        /** Passed to `AppBootstrapGate` for vertical spacing. */
        bootstrapContentClass?: string;
    }>(),
    {
        title: '',
        description: '',
        backTo: null,
        backLabel: '',
        paddingClass: 'q-pa-xl',
        bootstrapContentClass: 'q-gutter-y-md',
    },
);

const pageClass = computed(() => props.paddingClass);
</script>
