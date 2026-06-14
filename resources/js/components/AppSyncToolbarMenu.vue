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
        <q-badge
            v-else-if="syncHealth.toolbarSeverity === 'warning'"
            floating
            rounded
            color="amber"
            text-color="black"
            label="!"
        />

        <q-menu>
            <q-list dense bordered class="q-pa-sm" style="min-width: 300px">
                <q-item-label header class="text-caption text-grey-8">
                    {{ t("sync.toolbarConnectionHeader") }}
                </q-item-label>

                <q-item>
                    <q-item-section avatar>
                        <q-icon
                            :name="syncHealth.toolbarIcon"
                            :color="connectionIconColor"
                        />
                    </q-item-section>
                    <q-item-section>
                        <q-item-label class="text-weight-medium">
                            {{ syncHealth.toolbarStatusLabel }}
                        </q-item-label>
                        <q-item-label caption>
                            {{ syncHealth.lastSyncedLabel }}
                        </q-item-label>
                        <q-item-label
                            v-if="syncHealth.downloadError.length > 0"
                            caption
                            class="text-negative"
                        >
                            {{ syncHealth.downloadError }}
                        </q-item-label>
                    </q-item-section>
                </q-item>

                <q-separator class="q-my-sm" />

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
                    {{ t("sync.toolbarPendingHeader") }}
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
import { computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useAuthStore } from "../store/auth.store";
import { useSyncHealth } from "../composables/useSyncHealth";
import { getAppPowerSyncContext } from "../powersync/app-powersync.runtime";

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
            syncHealth.downloadError.length > 0),
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
