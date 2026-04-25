<template>
    <q-page class="q-pa-xl">
        <AppPageHeader
            :title="t('programsCheckin.title')"
            :description="t('programsCheckin.placeholderDescription')"
            description-size="body2"
        />
    </q-page>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import AppPageHeader from "../components/ui/AppPageHeader.vue";
import { usePageLayout } from "../composables/usePageLayout";

const { t } = useI18n();

usePageLayout({ documentTitleKey: "programsCheckin.title" });
</script>
