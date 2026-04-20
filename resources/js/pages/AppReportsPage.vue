<template>
    <q-page class="q-pa-xl">
        <h1 class="text-h4 q-mb-md">{{ t('reports.title') }}</h1>
        <p class="text-body1">{{ t('reports.lazyDescription') }}</p>
    </q-page>
</template>

<script setup>
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>
