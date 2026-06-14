import { describe, expect, test } from "vitest";
import {
    firstPendingSyncPhase,
    isBootstrapPending,
    isSyncContentPending,
    shouldShowSyncedEmptyState,
} from "../../utilities/sync-readiness";

const bootstrapped: {
    hasBootstrapped: boolean;
    initialUserScopeSyncComplete: boolean;
    initialProgramScopeSyncComplete: boolean;
} = {
    hasBootstrapped: true,
    initialUserScopeSyncComplete: true,
    initialProgramScopeSyncComplete: true,
};

describe("sync-readiness", () => {
    test("isBootstrapPending is true only before bootstrap", () => {
        expect(isBootstrapPending(false)).toBe(true);
        expect(isBootstrapPending(true)).toBe(false);
    });

    test("firstPendingSyncPhase is null before bootstrap", () => {
        expect(
            firstPendingSyncPhase(
                ["user_scope"],
                {
                    hasBootstrapped: false,
                    initialUserScopeSyncComplete: false,
                    initialProgramScopeSyncComplete: false,
                },
                false,
            ),
        ).toBeNull();
    });

    test("firstPendingSyncPhase returns user_scope when incomplete", () => {
        expect(
            firstPendingSyncPhase(
                ["user_scope"],
                {
                    hasBootstrapped: true,
                    initialUserScopeSyncComplete: false,
                    initialProgramScopeSyncComplete: false,
                },
                false,
            ),
        ).toBe("user_scope");
    });

    test("firstPendingSyncPhase returns program_scope after user_scope completes", () => {
        expect(
            firstPendingSyncPhase(
                ["user_scope", "program_scope"],
                {
                    hasBootstrapped: true,
                    initialUserScopeSyncComplete: true,
                    initialProgramScopeSyncComplete: false,
                },
                false,
            ),
        ).toBe("program_scope");
    });

    test("firstPendingSyncPhase returns live_query after streams complete", () => {
        expect(
            firstPendingSyncPhase(["user_scope"], bootstrapped, true),
        ).toBe("live_query");
    });

    test("isSyncContentPending is false when all streams and query are ready", () => {
        expect(
            isSyncContentPending(["user_scope", "program_scope"], bootstrapped, false),
        ).toBe(false);
    });

    test("shouldShowSyncedEmptyState is false while content is pending", () => {
        expect(
            shouldShowSyncedEmptyState(
                {
                    hasBootstrapped: true,
                    initialUserScopeSyncComplete: false,
                    initialProgramScopeSyncComplete: false,
                },
                ["user_scope"],
                false,
                true,
            ),
        ).toBe(false);
    });

    test("shouldShowSyncedEmptyState is true when sync is ready and list is empty", () => {
        expect(
            shouldShowSyncedEmptyState(bootstrapped, ["user_scope"], false, true),
        ).toBe(true);
    });
});
