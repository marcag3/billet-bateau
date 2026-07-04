import type { SyncStatus } from "@powersync/common";
import * as Sentry from "@sentry/vue";
import {
    formatSyncErrorMessage,
    shouldReportDownloadSyncErrorToSentry,
    shouldReportUploadSyncErrorToSentry,
} from "./sync-health";
import { powerSyncDbRef } from "./powersync-runtime-state";
import { syncHealthSnapshot } from "./sync-health-state";

const DEDUPE_MS = 5_000;

let lastLoggedDownloadError = "";
let lastLoggedDownloadAtMs = 0;
let lastLoggedUploadError = "";
let lastLoggedUploadAtMs = 0;

function shouldLogError(
    message: string,
    lastMessage: string,
    lastAtMs: number,
    nowMs: number,
): boolean {
    if (message.length === 0) {
        return false;
    }

    if (message === lastMessage && nowMs - lastAtMs < DEDUPE_MS) {
        return false;
    }

    return true;
}

function buildSyncErrorContext(status: SyncStatus): Record<string, unknown> {
    const db = powerSyncDbRef.value;

    return {
        connected: status.connected,
        connecting: status.connecting,
        hasSynced: status.hasSynced,
        lastSyncedAt: status.lastSyncedAt?.toISOString(),
        uploading: status.dataFlowStatus?.uploading === true,
        downloading: status.dataFlowStatus?.downloading === true,
        sdkVersion:
            db && "sdkVersion" in db
                ? (db as { sdkVersion?: string }).sdkVersion ?? "unknown"
                : "unknown",
    };
}

/**
 * @param status
 * @param nowMs
 */
export function logSyncStatusErrors(
    status: SyncStatus,
    nowMs: number = Date.now(),
): void {
    const downloadError = formatSyncErrorMessage(
        status.dataFlowStatus?.downloadError,
    );
    const uploadError = formatSyncErrorMessage(
        status.dataFlowStatus?.uploadError,
    );

    const snapshot = syncHealthSnapshot.value;

    if (
        shouldLogError(
            downloadError,
            lastLoggedDownloadError,
            lastLoggedDownloadAtMs,
            nowMs,
        ) &&
        shouldReportDownloadSyncErrorToSentry(downloadError, snapshot, nowMs)
    ) {
        lastLoggedDownloadError = downloadError;
        lastLoggedDownloadAtMs = nowMs;

        Sentry.captureMessage("PowerSync sync download failed", {
            level: "error",
            extra: {
                ...buildSyncErrorContext(status),
                downloadError,
            },
        });
    }

    if (
        shouldLogError(
            uploadError,
            lastLoggedUploadError,
            lastLoggedUploadAtMs,
            nowMs,
        ) &&
        shouldReportUploadSyncErrorToSentry(uploadError, snapshot, nowMs)
    ) {
        lastLoggedUploadError = uploadError;
        lastLoggedUploadAtMs = nowMs;

        Sentry.captureMessage("PowerSync sync upload failed", {
            level: "error",
            extra: {
                ...buildSyncErrorContext(status),
                uploadError,
            },
        });
    }
}
