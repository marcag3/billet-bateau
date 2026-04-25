<template>
    <q-page class="q-pa-xl">
        <AppPageHeader
            :title="t('settings.title')"
            :description="t('settings.isolatedDescription')"
        />
    </q-page>
</template>

<script setup>
import { useI18n } from 'vue-i18n';
import AppPageHeader from '../components/ui/AppPageHeader.vue';

const { t } = useI18n();
</script>
