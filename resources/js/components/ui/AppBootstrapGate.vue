<template>
    <div class="relative-position">
        <q-inner-loading v-if="!ready && hasLoadingCopy" :showing="true">
            <div class="column items-center q-gutter-sm q-px-md">
                <q-spinner color="primary" size="42px" />
                <div
                    v-if="loadingTitle != null && loadingTitle !== ''"
                    class="text-subtitle1 text-center"
                >
                    {{ loadingTitle }}
                </div>
                <div
                    v-if="loadingSubcopy != null && loadingSubcopy !== ''"
                    class="text-caption text-grey-7 text-center"
                >
                    {{ loadingSubcopy }}
                </div>
            </div>
        </q-inner-loading>
        <q-inner-loading v-else-if="!ready" :showing="true" />
        <slot v-if="ready" />
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
    defineProps<{
        ready?: boolean;
        loadingTitle?: string;
        loadingSubcopy?: string;
    }>(),
    {
        ready: false,
        loadingTitle: "",
        loadingSubcopy: "",
    },
);

const hasLoadingCopy = computed(
    () =>
        (props.loadingTitle != null && props.loadingTitle !== "") ||
        (props.loadingSubcopy != null && props.loadingSubcopy !== ""),
);
</script>
