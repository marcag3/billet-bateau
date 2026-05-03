<template>
    <q-btn
        v-if="authStore.isAuthenticated || authStore.canAccessProtectedRoute()"
        flat
        dense
        round
        icon="cloud_upload"
        :aria-label="t('sync.outboxTitle')"
    >
        <q-badge
            v-if="hasOutboxCommitError"
            floating
            rounded
            color="red"
            text-color="white"
            label="!"
        />
        <q-badge
            v-else-if="outboxPendingCount > 0"
            floating
            rounded
            color="amber"
            text-color="black"
            :label="String(outboxPendingCount)"
        />

        <q-menu>
        <q-list dense bordered class="q-pa-sm" style="min-width: 280px">
            <q-item
                v-if="hasOutboxCommitError"
                class="bg-red-1 text-negative rounded-borders q-mb-xs"
            >
                <q-item-section avatar>
                    <q-icon name="error_outline" color="negative" />
                </q-item-section>
                <q-item-section>
                    <q-item-label class="text-weight-medium">{{
                        t("sync.outboxCommitFailed")
                    }}</q-item-label>
                    <q-item-label caption class="text-negative">{{
                        outboxCommitError
                    }}</q-item-label>
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
                {{ t("sync.outboxTitle") }}
                <span class="q-ml-xs">({{ outboxPendingCount }})</span>
            </q-item-label>

            <q-item v-if="outboxPendingCount === 0">
                <q-item-section>{{ t("sync.outboxEmpty") }}</q-item-section>
            </q-item>
            <q-item v-else>
                <q-item-section>{{ t("sync.rowPendingSync") }}</q-item-section>
            </q-item>
        </q-list>
    </q-menu>
    </q-btn>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useAuthStore } from "../store/auth.store";
import { useAppPowerSyncOutbox } from "../powersync/app-powersync.runtime";

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
