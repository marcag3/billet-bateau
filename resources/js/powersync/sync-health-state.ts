import type { SyncStatus } from "@powersync/common";
import { shallowRef } from "vue";
import {
    errorMessage,
    hasBootstrappedCollection,
    persistenceUnavailable,
} from "./powersync-runtime-state";
import { isProgramScopePrioritySynced } from "./program-scope-sync-status";
import { isUserScopePrioritySynced } from "./user-scope-sync-status";
import {
    formatSyncErrorMessage,
    type SyncHealthSnapshot,
} from "./sync-health";

function readBrowserOnline(): boolean {
    if (typeof navigator === "undefined") {
        return true;
    }

    return navigator.onLine;
}

function createDefaultSnapshot(): SyncHealthSnapshot {
    return {
        hasBootstrapped: false,
        persistenceUnavailable: false,
        bootstrapError: "",
        browserOnline: readBrowserOnline(),
        connected: false,
        connecting: false,
        uploading: false,
        downloading: false,
        hasSynced: false,
        lastSyncedAt: undefined,
        downloadError: "",
        uploadError: "",
        userScopeHasSynced: false,
        programScopeHasSynced: false,
        connectingSinceMs: null,
    };
}

export const syncHealthSnapshot = shallowRef<SyncHealthSnapshot>(
    createDefaultSnapshot(),
);

let connectingSinceMs: number | null = null;
let browserOnlineTrackingStarted = false;

function resolveHasSynced(status: SyncStatus): boolean {
    return status.hasSynced === true;
}

function mergeBootstrapSnapshot(
    partial: Partial<SyncHealthSnapshot>,
): SyncHealthSnapshot {
    return {
        ...syncHealthSnapshot.value,
        hasBootstrapped: hasBootstrappedCollection.value,
        persistenceUnavailable: persistenceUnavailable.value,
        bootstrapError: errorMessage.value,
        browserOnline: readBrowserOnline(),
        ...partial,
    };
}

export function publishSyncHealthSnapshot(
    partial: Partial<SyncHealthSnapshot> = {},
): void {
    syncHealthSnapshot.value = mergeBootstrapSnapshot(partial);
}

export function resetSyncHealthSnapshot(): void {
    connectingSinceMs = null;
    syncHealthSnapshot.value = createDefaultSnapshot();
}

export function markSyncHealthUnavailable(message: string): void {
    publishSyncHealthSnapshot({
        bootstrapError: message,
        connected: false,
        connecting: false,
        connectingSinceMs: null,
    });
}

/**
 * @param status
 * @param nowMs
 */
export function applySyncHealthFromStatus(
    status: SyncStatus,
    nowMs: number = Date.now(),
): void {
    const connecting = status.connecting === true;

    if (connecting && connectingSinceMs == null) {
        connectingSinceMs = nowMs;
    }

    if (!connecting && status.connected === true) {
        connectingSinceMs = null;
    }

    if (!connecting && !status.connected && connectingSinceMs != null) {
        const graceElapsed =
            nowMs - connectingSinceMs >= 8_000;
        if (graceElapsed) {
            connectingSinceMs = null;
        }
    }

    publishSyncHealthSnapshot({
        connected: status.connected === true,
        connecting,
        uploading: status.dataFlowStatus?.uploading === true,
        downloading: status.dataFlowStatus?.downloading === true,
        hasSynced: resolveHasSynced(status),
        lastSyncedAt: status.lastSyncedAt,
        downloadError: formatSyncErrorMessage(
            status.dataFlowStatus?.downloadError,
        ),
        uploadError: formatSyncErrorMessage(
            status.dataFlowStatus?.uploadError,
        ),
        userScopeHasSynced: isUserScopePrioritySynced(status),
        programScopeHasSynced: isProgramScopePrioritySynced(status),
        connectingSinceMs,
    });
}

export function trackBrowserOnlineForSyncHealth(): void {
    if (browserOnlineTrackingStarted || typeof window === "undefined") {
        return;
    }

    browserOnlineTrackingStarted = true;

    const refresh = (): void => {
        publishSyncHealthSnapshot({
            browserOnline: readBrowserOnline(),
        });
    };

    window.addEventListener("online", refresh);
    window.addEventListener("offline", refresh);
}

export function getConnectingSinceMs(): number | null {
    return connectingSinceMs;
}
