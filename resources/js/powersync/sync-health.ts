export const SYNC_CONNECTING_GRACE_MS = 8_000;

export type SyncHealthPhase =
    | "unavailable"
    | "offline"
    | "idle"
    | "connecting"
    | "live"
    | "stale_local"
    | "sync_blocked";

export type SyncHealthSnapshot = {
    hasBootstrapped: boolean;
    persistenceUnavailable: boolean;
    bootstrapError: string;
    browserOnline: boolean;
    connected: boolean;
    connecting: boolean;
    uploading: boolean;
    downloading: boolean;
    hasSynced: boolean;
    lastSyncedAt: Date | undefined;
    downloadError: string;
    uploadError: string;
    userScopeHasSynced: boolean;
    programScopeHasSynced: boolean;
    connectingSinceMs: number | null;
};

export type DerivedSyncHealth = {
    phase: SyncHealthPhase;
    showBanner: boolean;
    bannerVariant: "warning" | "error" | "info";
    bannerTitleKey: string;
    bannerHintKey: string;
    toolbarIcon: "cloud_done" | "cloud_off" | "cloud_sync" | "cloud_upload";
    toolbarSeverity: "none" | "warning" | "error";
    toolbarStatusKey: string;
};

export function isInsideConnectingGrace(
    connectingSinceMs: number | null,
    nowMs: number,
): boolean {
    if (connectingSinceMs == null) {
        return false;
    }

    return nowMs - connectingSinceMs < SYNC_CONNECTING_GRACE_MS;
}

export function formatSyncErrorMessage(error: unknown): string {
    if (error == null || error === "") {
        return "";
    }

    if (typeof error === "string") {
        return error;
    }

    if (error instanceof Error) {
        return error.message || error.name || "";
    }

    if (typeof error === "object") {
        const errObj = error as Record<string, unknown>;
        const name = typeof errObj.name === "string" ? errObj.name : "";
        const message =
            typeof errObj.message === "string" ? errObj.message : "";
        if (message.length > 0) {
            return name.length > 0 && !message.includes(name)
                ? `${name}: ${message}`
                : message;
        }
        if (name.length > 0) {
            return name;
        }
        try {
            return JSON.stringify(error);
        } catch {
            return "";
        }
    }

    return String(error);
}

/**
 * @param input
 * @param nowMs
 */
export function deriveSyncHealth(
    input: SyncHealthSnapshot,
    nowMs: number,
): DerivedSyncHealth {
    if (input.persistenceUnavailable || input.bootstrapError.trim().length > 0) {
        return {
            phase: "unavailable",
            showBanner: input.hasBootstrapped || input.persistenceUnavailable,
            bannerVariant: "error",
            bannerTitleKey: "sync.healthUnavailableTitle",
            bannerHintKey:
                input.bootstrapError.trim().length > 0
                    ? "sync.healthUnavailableHint"
                    : "sync.unableLoadSync",
            toolbarIcon: "cloud_off",
            toolbarSeverity: "error",
            toolbarStatusKey: "sync.toolbarStatusUnavailable",
        };
    }

    if (!input.browserOnline) {
        return {
            phase: "offline",
            showBanner: input.hasBootstrapped && input.hasSynced,
            bannerVariant: "info",
            bannerTitleKey: "sync.healthOfflineTitle",
            bannerHintKey: "sync.healthOfflineHint",
            toolbarIcon: "cloud_off",
            toolbarSeverity: "none",
            toolbarStatusKey: "sync.toolbarStatusOffline",
        };
    }

    if (!input.hasBootstrapped) {
        return {
            phase: "idle",
            showBanner: false,
            bannerVariant: "info",
            bannerTitleKey: "",
            bannerHintKey: "",
            toolbarIcon: "cloud_off",
            toolbarSeverity: "none",
            toolbarStatusKey: "sync.toolbarStatusConnecting",
        };
    }

    const insideGrace = isInsideConnectingGrace(
        input.connectingSinceMs,
        nowMs,
    );
    const hasDownloadError = input.downloadError.trim().length > 0;

    if (input.connected && !hasDownloadError && input.uploading) {
        return {
            phase: "live",
            showBanner: false,
            bannerVariant: "info",
            bannerTitleKey: "sync.toolbarStatusUploading",
            bannerHintKey: "",
            toolbarIcon: "cloud_sync",
            toolbarSeverity: "none",
            toolbarStatusKey: "sync.toolbarStatusUploading",
        };
    }

    if (input.connected && !hasDownloadError && input.downloading) {
        return {
            phase: "live",
            showBanner: false,
            bannerVariant: "info",
            bannerTitleKey: "sync.toolbarStatusDownloading",
            bannerHintKey: "",
            toolbarIcon: "cloud_sync",
            toolbarSeverity: "none",
            toolbarStatusKey: "sync.toolbarStatusDownloading",
        };
    }

    if (input.connected && !hasDownloadError) {
        return {
            phase: "live",
            showBanner: false,
            bannerVariant: "info",
            bannerTitleKey: "sync.toolbarStatusLive",
            bannerHintKey: "",
            toolbarIcon: "cloud_done",
            toolbarSeverity: "none",
            toolbarStatusKey: "sync.toolbarStatusLive",
        };
    }

    if (insideGrace && !hasDownloadError && !input.connected) {
        return {
            phase: "connecting",
            showBanner: false,
            bannerVariant: "info",
            bannerTitleKey: "sync.healthConnectingTitle",
            bannerHintKey: "sync.healthConnectingHint",
            toolbarIcon: "cloud_sync",
            toolbarSeverity: "none",
            toolbarStatusKey: "sync.toolbarStatusConnecting",
        };
    }

    if (input.hasSynced && !input.connected) {
        return {
            phase: "stale_local",
            showBanner: true,
            bannerVariant: "warning",
            bannerTitleKey: "sync.healthStaleTitle",
            bannerHintKey: hasDownloadError
                ? "sync.healthDownloadError"
                : "sync.healthStaleHint",
            toolbarIcon: "cloud_off",
            toolbarSeverity: "warning",
            toolbarStatusKey: "sync.toolbarStatusStale",
        };
    }

    return {
        phase: "sync_blocked",
        showBanner: true,
        bannerVariant: "error",
        bannerTitleKey: "sync.healthBlockedTitle",
        bannerHintKey: hasDownloadError
            ? "sync.healthDownloadError"
            : "sync.healthBlockedHint",
        toolbarIcon: "cloud_off",
        toolbarSeverity: "error",
        toolbarStatusKey: "sync.toolbarStatusBlocked",
    };
}

/**
 * Whether an upload network failure should be hidden while sync is degraded.
 *
 * @param formattedMessage
 * @param options
 */
export function isBenignUploadFailureForSyncHealth(
    formattedMessage: string,
    options: {
        browserOnline: boolean;
        connected: boolean;
        connectingSinceMs: number | null;
        nowMs: number;
    },
): boolean {
    if (formattedMessage.trim().length === 0) {
        return true;
    }

    if (!options.browserOnline) {
        return true;
    }

    if (isInsideConnectingGrace(options.connectingSinceMs, options.nowMs)) {
        return true;
    }

    if (!options.connected) {
        return false;
    }

    const text = formattedMessage.toLowerCase();

    const benignFragments = [
        "failed to fetch",
        "networkerror",
        "network request failed",
        "load failed",
        "net::err",
        "the internet connection appears to be offline",
        "aborted",
        "abort",
        "delaying due to previously encountered crud item",
    ];

    return benignFragments.some((fragment) => text.includes(fragment));
}
