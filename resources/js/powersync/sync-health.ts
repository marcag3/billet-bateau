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
            toolbarIcon: "cloud_off",
            toolbarSeverity: "error",
            toolbarStatusKey: "sync.toolbarStatusUnavailable",
        };
    }

    if (!input.browserOnline) {
        return {
            phase: "offline",
            toolbarIcon: "cloud_off",
            toolbarSeverity: "none",
            toolbarStatusKey: "sync.toolbarStatusOffline",
        };
    }

    if (!input.hasBootstrapped) {
        return {
            phase: "idle",
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
            toolbarIcon: "cloud_sync",
            toolbarSeverity: "none",
            toolbarStatusKey: "sync.toolbarStatusUploading",
        };
    }

    if (input.connected && !hasDownloadError && input.downloading) {
        return {
            phase: "live",
            toolbarIcon: "cloud_sync",
            toolbarSeverity: "none",
            toolbarStatusKey: "sync.toolbarStatusDownloading",
        };
    }

    if (input.connected && !hasDownloadError) {
        return {
            phase: "live",
            toolbarIcon: "cloud_done",
            toolbarSeverity: "none",
            toolbarStatusKey: "sync.toolbarStatusLive",
        };
    }

    if (insideGrace && !hasDownloadError && !input.connected) {
        return {
            phase: "connecting",
            toolbarIcon: "cloud_sync",
            toolbarSeverity: "none",
            toolbarStatusKey: "sync.toolbarStatusConnecting",
        };
    }

    if (input.hasSynced && !input.connected) {
        return {
            phase: "stale_local",
            toolbarIcon: "cloud_off",
            toolbarSeverity: "warning",
            toolbarStatusKey: "sync.toolbarStatusStale",
        };
    }

    return {
        phase: "sync_blocked",
        toolbarIcon: "cloud_off",
        toolbarSeverity: "error",
        toolbarStatusKey: "sync.toolbarStatusBlocked",
    };
}

const BENIGN_NETWORK_ERROR_FRAGMENTS = [
    "failed to fetch",
    "networkerror",
    "network request failed",
    "load failed",
    "net::err",
    "the internet connection appears to be offline",
    "aborted",
    "abort",
    "delaying due to previously encountered crud item",
    "failed to create websocket",
    "failed to connect websocket",
    "websocket connection",
] as const;

/** Expected during PowerSync JWT rotation and stream teardown before reconnect. */
const BENIGN_POWERSYNC_RECONNECT_FRAGMENTS = [
    "jwt has expired",
    "psync_s2103",
    "error: closed",
] as const;

function messageIncludesFragment(
    message: string,
    fragments: readonly string[],
): boolean {
    const text = message.toLowerCase();

    return fragments.some((fragment) => text.includes(fragment));
}

/**
 * @param message
 */
export function isBenignNetworkErrorMessage(message: string): boolean {
    return messageIncludesFragment(message, BENIGN_NETWORK_ERROR_FRAGMENTS);
}

function isBenignPowerSyncReconnectErrorMessage(message: string): boolean {
    return messageIncludesFragment(
        message,
        BENIGN_POWERSYNC_RECONNECT_FRAGMENTS,
    );
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

    return isBenignNetworkErrorMessage(formattedMessage);
}

/**
 * Whether a sync upload error should be reported to Sentry (same visibility as outbox commit error).
 *
 * @param formattedMessage
 * @param snapshot
 * @param nowMs
 */
export function shouldReportUploadSyncErrorToSentry(
    formattedMessage: string,
    snapshot: SyncHealthSnapshot,
    nowMs: number,
): boolean {
    if (formattedMessage.trim().length === 0) {
        return false;
    }

    return !isBenignUploadFailureForSyncHealth(formattedMessage, {
        browserOnline: snapshot.browserOnline,
        connected: snapshot.connected,
        connectingSinceMs: snapshot.connectingSinceMs,
        nowMs,
    });
}

/**
 * Whether a sync download error should be reported to Sentry (when sync is blocked in the UI).
 *
 * @param downloadError
 * @param snapshot
 * @param nowMs
 */
export function shouldReportDownloadSyncErrorToSentry(
    downloadError: string,
    snapshot: SyncHealthSnapshot,
    nowMs: number,
): boolean {
    if (downloadError.trim().length === 0) {
        return false;
    }

    return deriveSyncHealth(snapshot, nowMs).phase === "sync_blocked";
}

/**
 * Whether a PowerSync error should be suppressed before reporting to Sentry.
 *
 * @param message
 * @param options
 */
export function shouldSuppressPowerSyncErrorForSentry(
    message: string,
    options: {
        browserOnline: boolean;
        connectingSinceMs: number | null;
        nowMs: number;
    },
): boolean {
    if (message.trim().length === 0) {
        return true;
    }

    if (!options.browserOnline) {
        return true;
    }

    if (isInsideConnectingGrace(options.connectingSinceMs, options.nowMs)) {
        return true;
    }

    return (
        isBenignNetworkErrorMessage(message) ||
        isBenignPowerSyncReconnectErrorMessage(message)
    );
}
