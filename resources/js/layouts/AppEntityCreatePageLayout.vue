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
            <slot />
        </div>
    </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { RouteLocationRaw } from 'vue-router';
import AppPageHeader from '../components/ui/AppPageHeader.vue';

const props = withDefaults(
    defineProps<{
        title?: string;
        description?: string;
        backTo?: RouteLocationRaw | null;
        backLabel?: string;
        paddingClass?: string;
    }>(),
    {
        title: '',
        description: '',
        backTo: null,
        backLabel: '',
        paddingClass: 'q-pa-xl',
    },
);

const pageClass = computed(() => props.paddingClass);
</script>
