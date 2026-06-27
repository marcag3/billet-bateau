<template>
    <q-list
        dense
        bordered
        class="sync-panel"
        style="min-width: 280px; max-width: 320px"
    >
        <q-item class="q-pa-md">
            <q-item-section avatar>
                <q-spinner
                    v-if="syncHealth.showActivitySpinner"
                    color="primary"
                    size="md"
                />
                <q-icon
                    v-else
                    :name="syncHealth.toolbarIcon"
                    :color="connectionIconColor"
                    size="md"
                />
            </q-item-section>
            <q-item-section>
                <q-item-label class="text-subtitle2 text-weight-medium">
                    {{ syncHealth.activityLabel }}
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
                <q-item-label
                    v-if="syncHealth.uploadError.length > 0"
                    caption
                    class="text-negative"
                >
                    {{ t("sync.diagnosticsUploadError") }}:
                    {{ syncHealth.uploadError }}
                </q-item-label>
            </q-item-section>
        </q-item>

        <q-item v-if="activeOperations.length > 0" class="q-pt-none">
            <q-item-section>
                <div class="row q-gutter-xs">
                    <q-chip
                        v-for="operation in activeOperations"
                        :key="operation.key"
                        dense
                        outline
                        color="primary"
                        :icon="operation.icon"
                        :label="operation.label"
                    />
                </div>
            </q-item-section>
        </q-item>

        <q-separator />

        <q-item class="q-py-sm">
            <q-item-section>
                <div class="row q-gutter-xs">
                    <q-chip
                        v-for="scope in scopeChips"
                        :key="scope.key"
                        dense
                        :outline="scope.synced"
                        :color="scope.synced ? 'positive' : 'warning'"
                        :icon="scope.icon"
                        :label="scope.label"
                    />
                </div>
            </q-item-section>
        </q-item>

        <template v-if="hasOutboxCommitError">
            <q-separator />
            <q-item class="bg-red-1 text-negative">
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
                        @click="emit('dismissOutboxCommitError')"
                    />
                </q-item-section>
            </q-item>
        </template>

        <template v-if="outboxPendingCount > 0">
            <q-separator />
            <q-item class="bg-amber-1">
                <q-item-section avatar>
                    <q-icon name="cloud_upload" color="amber-9" />
                </q-item-section>
                <q-item-section>
                    <q-item-label class="text-weight-medium">{{
                        pendingWritesLabel
                    }}</q-item-label>
                    <q-item-label caption>{{
                        t("sync.rowPendingSync")
                    }}</q-item-label>
                </q-item-section>
            </q-item>
        </template>

        <template v-if="showTechnicalDetails">
            <q-separator />
            <q-expansion-item
                dense
                expand-separator
                icon="tune"
                :label="t('sync.diagnosticsDetailsLabel')"
                header-class="text-caption text-grey-8"
            >
                <q-item v-for="row in technicalRows" :key="row.label">
                    <q-item-section>
                        <q-item-label caption>{{ row.label }}</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                        <q-item-label>{{ row.value }}</q-item-label>
                    </q-item-section>
                </q-item>
            </q-expansion-item>
        </template>
    </q-list>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useSyncHealth } from "../composables/useSyncHealth";

const props = defineProps<{
    outboxPendingCount: number;
    outboxCommitError: string;
    hasOutboxCommitError: boolean;
    connectionIconColor: string;
}>();

const emit = defineEmits<{
    dismissOutboxCommitError: [];
}>();

const { t } = useI18n();
const syncHealth = useSyncHealth();

type ActiveOperation = {
    key: string;
    icon: string;
    label: string;
};

const activeOperations = computed((): ActiveOperation[] => {
    const operations: ActiveOperation[] = [];

    if (syncHealth.connecting) {
        operations.push({
            key: "connecting",
            icon: "sync",
            label: t("sync.diagnosticsConnecting"),
        });
    }
    if (syncHealth.isDownloading) {
        operations.push({
            key: "downloading",
            icon: "cloud_download",
            label: t("sync.diagnosticsDownloading"),
        });
    }
    if (syncHealth.isUploading) {
        operations.push({
            key: "uploading",
            icon: "cloud_upload",
            label: t("sync.diagnosticsUploading"),
        });
    }

    return operations;
});

type ScopeChip = {
    key: string;
    label: string;
    icon: string;
    synced: boolean;
};

const scopeChips = computed((): ScopeChip[] => [
    {
        key: "user",
        label: t("sync.diagnosticsUserScope"),
        icon: syncHealth.userScopeSynced ? "check_circle" : "schedule",
        synced: syncHealth.userScopeSynced,
    },
    {
        key: "program",
        label: t("sync.diagnosticsProgramScope"),
        icon: syncHealth.programScopeSynced ? "check_circle" : "schedule",
        synced: syncHealth.programScopeSynced,
    },
]);

const showTechnicalDetails = computed(
    () =>
        !syncHealth.hasSynced ||
        !syncHealth.connected ||
        !syncHealth.userScopeSynced ||
        !syncHealth.programScopeSynced,
);

const technicalRows = computed(() => [
    {
        label: t("sync.diagnosticsConnected"),
        value: syncHealth.formatBooleanLabel(syncHealth.connected),
    },
    {
        label: t("sync.diagnosticsHasSynced"),
        value: syncHealth.formatBooleanLabel(syncHealth.hasSynced),
    },
]);

const pendingWritesLabel = computed(() =>
    t(
        "sync.pendingWritesCount",
        { count: props.outboxPendingCount },
        props.outboxPendingCount,
    ),
);
</script>
