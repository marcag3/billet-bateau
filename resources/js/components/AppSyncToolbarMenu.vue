<template>
    <q-btn
        v-if="authStore.isAuthenticated || authStore.canAccessProtectedRoute()"
        flat
        dense
        round
        :icon="syncHealth.toolbarIcon"
        :aria-label="t('sync.toolbarTitle')"
    >
        <q-badge
            v-if="showErrorBadge"
            floating
            rounded
            class="pointer-events-none"
            color="red"
            text-color="white"
            label="!"
        />
        <q-badge
            v-else-if="outboxPendingCount > 0"
            floating
            rounded
            class="pointer-events-none"
            color="amber"
            text-color="black"
            :label="String(outboxPendingCount)"
        />
        <q-badge
            v-else-if="syncHealth.hasSyncActivity"
            floating
            rounded
            class="pointer-events-none"
            color="amber"
            text-color="black"
            label="↕"
        />
        <q-badge
            v-else-if="syncHealth.toolbarSeverity === 'warning'"
            floating
            rounded
            class="pointer-events-none"
            color="amber"
            text-color="black"
            label="!"
        />

        <q-menu
            anchor="bottom right"
            self="top right"
            transition-show="jump-down"
            transition-hide="jump-up"
        >
            <AppSyncDiagnosticsPanel
                :outbox-pending-count="outboxPendingCount"
                :outbox-commit-error="outboxCommitError"
                :has-outbox-commit-error="hasOutboxCommitError"
                :connection-icon-color="connectionIconColor"
                @dismiss-outbox-commit-error="dismissOutboxCommitError"
            />
        </q-menu>
    </q-btn>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useAuthStore } from "../store/auth.store";
import { useSyncHealth } from "../composables/useSyncHealth";
import { getAppPowerSyncContext } from "../powersync/app-powersync.runtime";
import AppSyncDiagnosticsPanel from "./AppSyncDiagnosticsPanel.vue";

const authStore = useAuthStore();
const { t } = useI18n();
const syncHealth = useSyncHealth();

const {
    outboxPendingCount,
    outboxCommitError,
    hasOutboxCommitError,
    dismissOutboxCommitError,
    refreshOutbox,
} = getAppPowerSyncContext().useAppPowerSyncOutbox();

const showErrorBadge = computed(
    () =>
        hasOutboxCommitError.value ||
        syncHealth.toolbarSeverity === "error" ||
        (syncHealth.hasToolbarHealthAlert &&
            (syncHealth.downloadError.length > 0 ||
                syncHealth.uploadError.length > 0)),
);

const connectionIconColor = computed(() => {
    if (syncHealth.toolbarSeverity === "error") {
        return "negative";
    }
    if (syncHealth.toolbarSeverity === "warning") {
        return "warning";
    }
    if (syncHealth.phase === "live") {
        return "positive";
    }
    return "grey-7";
});

onMounted(() => {
    if (authStore.canAccessProtectedRoute()) {
        void refreshOutbox();
    }
});
</script>
