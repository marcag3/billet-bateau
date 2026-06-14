import { computed } from "vue";
import {
    outboxCommitError,
    outboxPendingCount,
    powerSyncDbRef,
} from "./powersync-runtime-state";
import { isBenignUploadFailureForSyncHealth } from "./sync-health";
import { syncHealthSnapshot } from "./sync-health-state";

/**
 * @param uploadError
 */
export function formatPowerSyncUploadError(uploadError: unknown): string {
    if (uploadError == null || uploadError === "") {
        return "";
    }

    if (typeof uploadError === "string") {
        return uploadError;
    }

    if (uploadError instanceof Error) {
        return uploadError.message || uploadError.name || "";
    }

    if (typeof uploadError === "object") {
        const errObj = uploadError as Record<string, unknown>;
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
            return JSON.stringify(uploadError);
        } catch {
            return "";
        }
    }

    return String(uploadError);
}

/**
 * @param uploadError
 * @param formattedMessage
 */
export function isBenignPowerSyncUploadFailure(
    uploadError: unknown,
    formattedMessage: string,
): boolean {
    if (uploadError == null || uploadError === "") {
        return true;
    }

    const snapshot = syncHealthSnapshot.value;

    return isBenignUploadFailureForSyncHealth(formattedMessage, {
        browserOnline: snapshot.browserOnline,
        connected: snapshot.connected,
        connectingSinceMs: snapshot.connectingSinceMs,
        nowMs: Date.now(),
    });
}

/**
 * @param uploadError
 * @param formattedMessage
 */
export function resolveOutboxCommitError(
    uploadError: unknown,
    formattedMessage: string,
): string {
    if (
        isBenignPowerSyncUploadFailure(uploadError, formattedMessage) ||
        formattedMessage.length === 0
    ) {
        return "";
    }

    return formattedMessage;
}

export async function refreshOutboxSnapshot(): Promise<void> {
    const db = powerSyncDbRef.value;

    if (!db) {
        outboxPendingCount.value = 0;
        return;
    }

    try {
        const stats = await db.getUploadQueueStats(false);
        outboxPendingCount.value =
            typeof stats?.count === "number" ? stats.count : 0;
    } catch (error) {
        console.error("PowerSync outbox stats refresh failed:", error);
        outboxPendingCount.value = 0;
    }
}

export function useAppPowerSyncOutbox() {
    return {
        outboxPendingCount,
        outboxCommitError,
        hasOutboxCommitError: computed(
            () => outboxCommitError.value.length > 0,
        ),
        dismissOutboxCommitError: () => {
            outboxCommitError.value = "";
        },
        refreshOutbox: refreshOutboxSnapshot,
        hasPendingOutboxWrites: computed(() => outboxPendingCount.value > 0),
    };
}
