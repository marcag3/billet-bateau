import { computed, reactive } from "vue";
import { useI18n } from "vue-i18n";
import { deriveSyncHealth } from "../powersync/sync-health";
import { syncHealthSnapshot } from "../powersync/sync-health-state";
import { outboxCommitError } from "../powersync/powersync-runtime-state";

/**
 * @param value
 * @param locale
 */
export function formatLastSyncedAt(
    value: Date | undefined,
    locale: string,
): string {
    if (value == null) {
        return "";
    }

    return new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(value);
}

export function useSyncHealth() {
    const { t, locale } = useI18n();

    const derived = computed(() =>
        deriveSyncHealth(syncHealthSnapshot.value, Date.now()),
    );

    const toolbarStatusLabel = computed(() =>
        t(derived.value.toolbarStatusKey),
    );

    const lastSyncedLabel = computed(() => {
        const lastSyncedTime = formatLastSyncedAt(
            syncHealthSnapshot.value.lastSyncedAt,
            locale.value,
        );

        if (lastSyncedTime.length === 0) {
            return t("sync.toolbarLastSyncedNever");
        }

        return t("sync.toolbarLastSynced", { time: lastSyncedTime });
    });

    const hasToolbarHealthAlert = computed(() => {
        if (derived.value.toolbarSeverity !== "none") {
            return true;
        }

        return syncHealthSnapshot.value.downloadError.trim().length > 0;
    });

    const toolbarIcon = computed(() => {
        if (outboxCommitError.value.length > 0 || hasToolbarHealthAlert.value) {
            return "cloud_upload";
        }

        return derived.value.toolbarIcon;
    });

    const snapshot = computed(() => syncHealthSnapshot.value);

    const isUploading = computed(() => snapshot.value.uploading);
    const isDownloading = computed(() => snapshot.value.downloading);
    const hasSynced = computed(() => snapshot.value.hasSynced);
    const connected = computed(() => snapshot.value.connected);
    const connecting = computed(() => snapshot.value.connecting);
    const userScopeSynced = computed(() => snapshot.value.userScopeHasSynced);
    const programScopeSynced = computed(
        () => snapshot.value.programScopeHasSynced,
    );
    const uploadError = computed(() => snapshot.value.uploadError);

    const showActivitySpinner = computed(
        () =>
            isUploading.value ||
            isDownloading.value ||
            connecting.value,
    );

    const hasSyncActivity = computed(
        () => isUploading.value || isDownloading.value,
    );

    const activityLabel = computed(() => toolbarStatusLabel.value);

    const formatBooleanLabel = (value: boolean): string =>
        value ? t("sync.diagnosticsYes") : t("sync.diagnosticsNo");

    return reactive({
        phase: computed(() => derived.value.phase),
        toolbarIcon,
        toolbarSeverity: computed(() => derived.value.toolbarSeverity),
        toolbarStatusLabel,
        lastSyncedLabel,
        hasToolbarHealthAlert,
        downloadError: computed(
            () => syncHealthSnapshot.value.downloadError,
        ),
        hasOutboxCommitError: computed(
            () => outboxCommitError.value.length > 0,
        ),
        isUploading,
        isDownloading,
        hasSynced,
        connected,
        connecting,
        userScopeSynced,
        programScopeSynced,
        uploadError,
        showActivitySpinner,
        hasSyncActivity,
        activityLabel,
        formatBooleanLabel,
    });
}
