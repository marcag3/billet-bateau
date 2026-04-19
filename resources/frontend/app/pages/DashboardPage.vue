<template>
    <q-page class="page-wrap">
        <div class="content-width">
            <h1 class="text-h4 q-mb-sm">{{ t('dashboard.title') }}</h1>
            <p class="text-body1 text-grey-8 q-mb-lg">
                {{ t('legacyDashboard.featureRichDescription') }}
            </p>

            <div class="row q-col-gutter-md">
                <div class="col-12 col-md-6">
                    <q-card flat bordered>
                        <q-card-section>
                            <div class="text-subtitle1">{{ t('legacyDashboard.operationsTitle') }}</div>
                            <div class="text-caption text-grey-7">{{ t('legacyDashboard.operationsSubtitle') }}</div>
                        </q-card-section>
                    </q-card>
                </div>
                <div class="col-12 col-md-6">
                    <q-card flat bordered>
                        <q-card-section>
                            <div class="text-subtitle1">{{ t('legacyDashboard.analyticsTitle') }}</div>
                            <div class="text-caption text-grey-7">{{ t('legacyDashboard.analyticsSubtitle') }}</div>
                        </q-card-section>
                        <q-separator />
                        <q-card-actions align="right">
                            <q-btn color="primary" to="/app/reports" :label="t('legacyDashboard.openReports')" />
                        </q-card-actions>
                    </q-card>
                </div>
            </div>
        </div>
    </q-page>
</template>

<script setup>
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>
