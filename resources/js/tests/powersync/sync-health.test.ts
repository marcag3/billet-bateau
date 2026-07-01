import { describe, expect, test } from "vitest";
import {
    deriveSyncHealth,
    isBenignUploadFailureForSyncHealth,
    isInsideConnectingGrace,
    shouldSuppressPowerSyncErrorForSentry,
    SYNC_CONNECTING_GRACE_MS,
    type SyncHealthSnapshot,
} from "../../powersync/sync-health";

const nowMs = 1_700_000_000_000;

function snapshot(
    overrides: Partial<SyncHealthSnapshot> = {},
): SyncHealthSnapshot {
    return {
        hasBootstrapped: true,
        persistenceUnavailable: false,
        bootstrapError: "",
        browserOnline: true,
        connected: false,
        connecting: false,
        uploading: false,
        downloading: false,
        hasSynced: true,
        lastSyncedAt: new Date("2024-06-01T12:00:00Z"),
        downloadError: "",
        uploadError: "",
        userScopeHasSynced: false,
        programScopeHasSynced: false,
        connectingSinceMs: null,
        ...overrides,
    };
}

describe("deriveSyncHealth", () => {
    test("reports live sync when connected without download errors", () => {
        const result = deriveSyncHealth(
            snapshot({ connected: true, hasSynced: true }),
            nowMs,
        );

        expect(result.phase).toBe("live");
        expect(result.showBanner).toBe(false);
        expect(result.toolbarIcon).toBe("cloud_done");
    });

    test("reports uploading when connected and upload is in progress", () => {
        const result = deriveSyncHealth(
            snapshot({ connected: true, hasSynced: true, uploading: true }),
            nowMs,
        );

        expect(result.phase).toBe("live");
        expect(result.toolbarIcon).toBe("cloud_sync");
        expect(result.toolbarStatusKey).toBe("sync.toolbarStatusUploading");
    });

    test("reports downloading when connected and download is in progress", () => {
        const result = deriveSyncHealth(
            snapshot({ connected: true, hasSynced: true, downloading: true }),
            nowMs,
        );

        expect(result.phase).toBe("live");
        expect(result.toolbarIcon).toBe("cloud_sync");
        expect(result.toolbarStatusKey).toBe("sync.toolbarStatusDownloading");
    });

    test("prefers uploading over downloading when both are active", () => {
        const result = deriveSyncHealth(
            snapshot({
                connected: true,
                hasSynced: true,
                uploading: true,
                downloading: true,
            }),
            nowMs,
        );

        expect(result.toolbarStatusKey).toBe("sync.toolbarStatusUploading");
    });

    test("reports stale local data after connecting grace expires", () => {
        const result = deriveSyncHealth(
            snapshot({
                connected: false,
                hasSynced: true,
                connectingSinceMs: nowMs - SYNC_CONNECTING_GRACE_MS - 1,
            }),
            nowMs,
        );

        expect(result.phase).toBe("stale_local");
        expect(result.showBanner).toBe(true);
        expect(result.bannerVariant).toBe("warning");
        expect(result.toolbarSeverity).toBe("warning");
    });

    test("shows stale local immediately when download error is present", () => {
        const result = deriveSyncHealth(
            snapshot({
                connected: false,
                hasSynced: true,
                downloadError: "WebSocket connection failed",
                connectingSinceMs: nowMs - 1_000,
            }),
            nowMs,
        );

        expect(result.phase).toBe("stale_local");
        expect(result.showBanner).toBe(true);
    });

    test("stays in connecting phase inside grace window", () => {
        const result = deriveSyncHealth(
            snapshot({
                connected: false,
                connecting: true,
                hasSynced: true,
                connectingSinceMs: nowMs - 2_000,
            }),
            nowMs,
        );

        expect(result.phase).toBe("connecting");
        expect(result.showBanner).toBe(false);
        expect(result.toolbarIcon).toBe("cloud_sync");
    });

    test("reports offline when browser is offline", () => {
        const result = deriveSyncHealth(
            snapshot({
                browserOnline: false,
                connected: false,
                hasSynced: true,
            }),
            nowMs,
        );

        expect(result.phase).toBe("offline");
        expect(result.showBanner).toBe(true);
        expect(result.bannerVariant).toBe("info");
    });

    test("reports idle when PowerSync has not bootstrapped yet", () => {
        const result = deriveSyncHealth(
            snapshot({
                hasBootstrapped: false,
                connected: false,
                hasSynced: false,
            }),
            nowMs,
        );

        expect(result.phase).toBe("idle");
        expect(result.showBanner).toBe(false);
    });

    test("reports sync blocked when online without prior sync", () => {
        const result = deriveSyncHealth(
            snapshot({
                connected: false,
                hasSynced: false,
                downloadError: "Failed to fetch",
            }),
            nowMs,
        );

        expect(result.phase).toBe("sync_blocked");
        expect(result.showBanner).toBe(true);
        expect(result.bannerVariant).toBe("error");
    });

    test("reports stale local when connecting flag persists after grace expires", () => {
        const result = deriveSyncHealth(
            snapshot({
                connected: false,
                connecting: true,
                hasSynced: true,
                connectingSinceMs: nowMs - SYNC_CONNECTING_GRACE_MS - 1,
            }),
            nowMs,
        );

        expect(result.phase).toBe("stale_local");
        expect(result.toolbarStatusKey).toBe("sync.toolbarStatusStale");
    });

    test("reports unavailable when persistence is unavailable", () => {
        const result = deriveSyncHealth(
            snapshot({
                persistenceUnavailable: true,
                hasBootstrapped: false,
            }),
            nowMs,
        );

        expect(result.phase).toBe("unavailable");
        expect(result.showBanner).toBe(true);
        expect(result.bannerVariant).toBe("error");
    });
});

describe("isInsideConnectingGrace", () => {
    test("returns false when connecting has not started", () => {
        expect(isInsideConnectingGrace(null, nowMs)).toBe(false);
    });

    test("returns true inside grace period", () => {
        expect(isInsideConnectingGrace(nowMs - 1_000, nowMs)).toBe(true);
    });

    test("returns false after grace period", () => {
        expect(
            isInsideConnectingGrace(
                nowMs - SYNC_CONNECTING_GRACE_MS,
                nowMs,
            ),
        ).toBe(false);
    });
});

describe("isBenignUploadFailureForSyncHealth", () => {
    test("treats network failures as benign when browser is offline", () => {
        expect(
            isBenignUploadFailureForSyncHealth("Failed to fetch", {
                browserOnline: false,
                connected: false,
                connectingSinceMs: null,
                nowMs,
            }),
        ).toBe(true);
    });

    test("treats network failures as benign inside connecting grace", () => {
        expect(
            isBenignUploadFailureForSyncHealth("Failed to fetch", {
                browserOnline: true,
                connected: false,
                connectingSinceMs: nowMs - 1_000,
                nowMs,
            }),
        ).toBe(true);
    });

    test("does not hide network failures when online and disconnected past grace", () => {
        expect(
            isBenignUploadFailureForSyncHealth("Failed to fetch", {
                browserOnline: true,
                connected: false,
                connectingSinceMs: nowMs - SYNC_CONNECTING_GRACE_MS - 1,
                nowMs,
            }),
        ).toBe(false);
    });
});

describe("shouldSuppressPowerSyncErrorForSentry", () => {
    const onlinePastGrace = {
        browserOnline: true,
        connectingSinceMs: nowMs - SYNC_CONNECTING_GRACE_MS - 1,
        nowMs,
    };

    test("suppresses empty messages", () => {
        expect(shouldSuppressPowerSyncErrorForSentry("", onlinePastGrace)).toBe(
            true,
        );
    });

    test("suppresses Firefox network errors", () => {
        expect(
            shouldSuppressPowerSyncErrorForSentry(
                "TypeError: NetworkError when attempting to fetch resource.",
                onlinePastGrace,
            ),
        ).toBe(true);
    });

    test("suppresses failed to fetch while online", () => {
        expect(
            shouldSuppressPowerSyncErrorForSentry(
                "Failed to fetch",
                onlinePastGrace,
            ),
        ).toBe(true);
    });

    test("suppresses websocket connection failures while online", () => {
        expect(
            shouldSuppressPowerSyncErrorForSentry(
                "Error: Failed to create websocket connection to wss://sync.example.com/sync/stream",
                onlinePastGrace,
            ),
        ).toBe(true);
    });

    test("suppresses failed to connect websocket while online", () => {
        expect(
            shouldSuppressPowerSyncErrorForSentry(
                "Failed to connect WebSocket",
                onlinePastGrace,
            ),
        ).toBe(true);
    });

    test("suppresses any message while browser is offline", () => {
        expect(
            shouldSuppressPowerSyncErrorForSentry("Invalid token", {
                browserOnline: false,
                connectingSinceMs: null,
                nowMs,
            }),
        ).toBe(true);
    });

    test("suppresses any message inside connecting grace", () => {
        expect(
            shouldSuppressPowerSyncErrorForSentry("Invalid token", {
                browserOnline: true,
                connectingSinceMs: nowMs - 1_000,
                nowMs,
            }),
        ).toBe(true);
    });

    test("does not suppress non-network errors while online past grace", () => {
        expect(
            shouldSuppressPowerSyncErrorForSentry(
                "Invalid token",
                onlinePastGrace,
            ),
        ).toBe(false);
    });
});
