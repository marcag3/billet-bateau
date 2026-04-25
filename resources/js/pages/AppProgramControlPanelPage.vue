<template>
    <q-page class="q-pa-xl">
        <AppPageHeader
            :title="t('programsControl.title')"
            :description="t('programsControl.placeholderDescription')"
            description-size="body2"
        />
    </q-page>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import AppPageHeader from "../components/ui/AppPageHeader.vue";
import { usePageLayout } from "../composables/usePageLayout";

const { t } = useI18n();

usePageLayout({ documentTitleKey: "programsControl.title" });
</script>
