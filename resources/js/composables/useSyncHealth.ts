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

    const bannerTitle = computed(() => t(derived.value.bannerTitleKey));

    const bannerHint = computed(() => {
        const hintKey = derived.value.bannerHintKey;
        if (hintKey.length === 0) {
            return "";
        }

        const snapshot = syncHealthSnapshot.value;
        const lastSyncedTime = formatLastSyncedAt(
            snapshot.lastSyncedAt,
            locale.value,
        );

        if (hintKey === "sync.healthStaleHint") {
            return lastSyncedTime.length > 0
                ? t(hintKey, { time: lastSyncedTime })
                : t("sync.healthStaleHintNoTime");
        }

        if (hintKey === "sync.healthOfflineHint") {
            return lastSyncedTime.length > 0
                ? t(hintKey, { time: lastSyncedTime })
                : t("sync.healthOfflineHintNoTime");
        }

        if (hintKey === "sync.healthDownloadError") {
            return snapshot.downloadError.length > 0
                ? snapshot.downloadError
                : t("sync.healthBlockedHint");
        }

        if (
            hintKey === "sync.healthUnavailableHint" &&
            snapshot.bootstrapError.length > 0
        ) {
            return snapshot.bootstrapError;
        }

        return t(hintKey);
    });

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

    return reactive({
        phase: computed(() => derived.value.phase),
        showBanner: computed(() => derived.value.showBanner),
        bannerVariant: computed(() => derived.value.bannerVariant),
        bannerTitle,
        bannerHint,
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
    });
}
