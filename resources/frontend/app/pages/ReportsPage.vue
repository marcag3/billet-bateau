<template>
    <q-page class="page-wrap">
        <div class="content-width">
            <h1 class="text-h4 q-mb-sm">{{ t('reports.title') }}</h1>
            <p class="text-body1 text-grey-8 q-mb-lg">
                {{ t('legacyReports.startupDescription') }}
            </p>

            <q-table
                flat
                bordered
                row-key="name"
                :rows="rows"
                :columns="columns"
                hide-bottom
            />
        </div>
    </q-page>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const columns = computed(() => [
    { name: 'line', label: t('legacyReports.line'), field: 'line', align: 'left' },
    { name: 'bookings', label: t('legacyReports.bookings'), field: 'bookings', align: 'right' },
    { name: 'fillRate', label: t('legacyReports.fillRate'), field: 'fillRate', align: 'right' },
]);

const rows = computed(() => [
    { line: t('legacyReports.morningFerry'), bookings: 184, fillRate: '92%' },
    { line: t('legacyReports.afternoonFerry'), bookings: 166, fillRate: '83%' },
    { line: t('legacyReports.eveningFerry'), bookings: 152, fillRate: '76%' },
]);
</script>
