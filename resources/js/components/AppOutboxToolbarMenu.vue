<template>
    <q-btn-dropdown
        v-if="authStore.isAuthenticated || authStore.canAccessProtectedRoute()"
        flat
        dense
        stretch
        color="white"
        no-icon-animation
        class="q-mr-sm app-outbox-toolbar-menu__btn"
        :aria-label="t('sync.outboxTitle')"
    >
        <template #label>
            <div class="relative-position inline-block">
                <q-icon name="cloud_upload" size="md" />
                <q-badge
                    floating
                    rounded
                    :color="outboxPendingCount > 0 ? 'amber' : 'grey-7'"
                    :text-color="outboxPendingCount > 0 ? 'black' : 'white'"
                    :label="String(outboxPendingCount)"
                />
            </div>
        </template>

        <q-list dense bordered class="q-pa-sm" style="min-width: 280px">
            <q-item v-if="hasOutboxCommitError" class="bg-red-1 text-negative rounded-borders q-mb-xs">
                <q-item-section avatar>
                    <q-icon name="error_outline" color="negative" />
                </q-item-section>
                <q-item-section>
                    <q-item-label class="text-weight-medium">{{ t('sync.outboxCommitFailed') }}</q-item-label>
                    <q-item-label caption class="text-negative">{{ outboxCommitError }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                    <q-btn
                        flat
                        dense
                        color="negative"
                        :label="t('common.dismiss')"
                        @click="dismissOutboxCommitError"
                    />
                </q-item-section>
            </q-item>

            <q-item-label header class="text-caption text-grey-8">
                {{ t('sync.outboxTitle') }}
                <span class="q-ml-xs">({{ outboxPendingCount }})</span>
            </q-item-label>

            <q-item v-if="outboxPendingCount === 0">
                <q-item-section>{{ t('sync.outboxEmpty') }}</q-item-section>
            </q-item>
            <q-item v-else>
                <q-item-section>{{ t('sync.rowPendingSync') }}</q-item-section>
            </q-item>
        </q-list>
    </q-btn-dropdown>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '../store/auth.store';
import { useAppPowerSyncOutbox } from '../powersync/app-powersync.runtime';

const authStore = useAuthStore();
const { t } = useI18n();

const {
    outboxPendingCount,
    outboxCommitError,
    hasOutboxCommitError,
    dismissOutboxCommitError,
    refreshOutbox,
} = useAppPowerSyncOutbox();

onMounted(() => {
    if (authStore.canAccessProtectedRoute()) {
        void refreshOutbox();
    }
});
</script>

<style scoped>
.app-outbox-toolbar-menu__btn :deep(.q-btn-dropdown__arrow) {
    display: none;
}
</style>
