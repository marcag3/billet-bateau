<template>
    <q-page class="q-pa-md">
        <AppPageHeader :title="t('programsCheckin.title')" />
    </q-page>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import AppPageHeader from "../components/ui/AppPageHeader.vue";
import { usePageLayout } from "../composables/usePageLayout";

const { t } = useI18n();

usePageLayout({ documentTitleKey: "programsCheckin.title" });
</script>
