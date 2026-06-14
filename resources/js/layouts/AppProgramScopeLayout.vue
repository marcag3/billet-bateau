<template>
    <AppBootstrapGate
        :ready="!sync.isBootstrapping"
        :loading-title="t('sync.preparingLocal')"
        :loading-subcopy="t('sync.preparingLocalHint')"
        :error-message="sync.errorMessage"
    >
        <q-page v-if="sync.isContentPending" class="q-pa-md">
            <AppSyncLoadingBanner
                :title="t(sync.contentLoadingTitleKey)"
                :hint="t(sync.contentLoadingHintKey)"
            />
        </q-page>
        <router-view v-else />
    </AppBootstrapGate>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useSyncReadiness } from "../composables/useSyncReadiness";
import AppBootstrapGate from "../components/ui/AppBootstrapGate.vue";
import AppSyncLoadingBanner from "../components/ui/AppSyncLoadingBanner.vue";

const { t } = useI18n();
const sync = useSyncReadiness();
</script>
