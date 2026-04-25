<template>
    <q-page class="q-pa-xl">
        <AppPageHeader
            :title="t('reports.title')"
            :description="t('reports.lazyDescription')"
        />
    </q-page>
</template>

<script setup>
import { useI18n } from 'vue-i18n';
import AppPageHeader from '../components/ui/AppPageHeader.vue';

const { t } = useI18n();
</script>
