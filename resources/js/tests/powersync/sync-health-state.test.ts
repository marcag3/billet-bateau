import type { SyncStatus } from "@powersync/common";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { SYNC_CONNECTING_GRACE_MS } from "../../powersync/sync-health";
import {
    applySyncHealthFromStatus,
    resetSyncHealthSnapshot,
    syncHealthSnapshot,
} from "../../powersync/sync-health-state";

function mockStatus(
    overrides: Partial<SyncStatus> = {},
): SyncStatus {
    return {
        connected: false,
        connecting: true,
        hasSynced: true,
        lastSyncedAt: new Date("2024-06-01T12:00:00Z"),
        dataFlowStatus: {},
        statusForPriority: () => ({ hasSynced: false }),
        ...overrides,
    } as SyncStatus;
}

describe("connecting grace expiry timer", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        resetSyncHealthSnapshot();
    });

    afterEach(() => {
        resetSyncHealthSnapshot();
        vi.useRealTimers();
    });

    test("clears connectingSinceMs after grace period without a new status event", () => {
        applySyncHealthFromStatus(mockStatus());

        expect(syncHealthSnapshot.value.connectingSinceMs).not.toBeNull();

        vi.advanceTimersByTime(SYNC_CONNECTING_GRACE_MS);

        expect(syncHealthSnapshot.value.connectingSinceMs).toBeNull();
    });

    test("clears the pending timer when the snapshot is reset", () => {
        applySyncHealthFromStatus(mockStatus());

        resetSyncHealthSnapshot();

        vi.advanceTimersByTime(SYNC_CONNECTING_GRACE_MS);

        expect(syncHealthSnapshot.value.connectingSinceMs).toBeNull();
        expect(syncHealthSnapshot.value.connected).toBe(false);
    });

    test("clears the timer when sync connects before grace expires", () => {
        applySyncHealthFromStatus(mockStatus());

        applySyncHealthFromStatus(
            mockStatus({
                connected: true,
                connecting: false,
            }),
        );

        vi.advanceTimersByTime(SYNC_CONNECTING_GRACE_MS);

        expect(syncHealthSnapshot.value.connectingSinceMs).toBeNull();
        expect(syncHealthSnapshot.value.connected).toBe(true);
    });
});
