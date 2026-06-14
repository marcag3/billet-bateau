export type PowerSyncStream = "user_scope" | "program_scope";

export const SYNC_STREAM_PRIORITY: readonly PowerSyncStream[] = [
    "user_scope",
    "program_scope",
];

export type SyncReadinessState = {
    hasBootstrapped: boolean;
    initialUserScopeSyncComplete: boolean;
    initialProgramScopeSyncComplete: boolean;
};

export function isStreamSyncComplete(
    stream: PowerSyncStream,
    state: SyncReadinessState,
): boolean {
    if (stream === "user_scope") {
        return state.initialUserScopeSyncComplete;
    }

    return state.initialProgramScopeSyncComplete;
}

export function isBootstrapPending(hasBootstrapped: boolean): boolean {
    return !hasBootstrapped;
}

export type PendingSyncPhase = PowerSyncStream | "live_query";

/**
 * First incomplete sync phase after bootstrap, in stream priority order.
 */
export function firstPendingSyncPhase(
    requiredStreams: readonly PowerSyncStream[],
    state: SyncReadinessState,
    liveQueryLoading = false,
): PendingSyncPhase | null {
    if (!state.hasBootstrapped) {
        return null;
    }

    for (const stream of SYNC_STREAM_PRIORITY) {
        if (!requiredStreams.includes(stream)) {
            continue;
        }
        if (!isStreamSyncComplete(stream, state)) {
            return stream;
        }
    }

    if (liveQueryLoading) {
        return "live_query";
    }

    return null;
}

export function isSyncContentPending(
    requiredStreams: readonly PowerSyncStream[],
    state: SyncReadinessState,
    liveQueryLoading = false,
): boolean {
    return firstPendingSyncPhase(requiredStreams, state, liveQueryLoading) != null;
}

/**
 * Whether to show an empty list (suppress while streams or live query are still loading).
 */
export function shouldShowSyncedEmptyState(
    state: SyncReadinessState,
    requiredStreams: readonly PowerSyncStream[],
    liveQueryLoading: boolean,
    isEmpty: boolean,
): boolean {
    if (!state.hasBootstrapped) {
        return false;
    }

    if (isSyncContentPending(requiredStreams, state, liveQueryLoading)) {
        return false;
    }

    return isEmpty;
}

export const SYNC_STREAM_LOADING_I18N: Record<
    PowerSyncStream,
    { titleKey: string; hintKey: string }
> = {
    user_scope: {
        titleKey: "sync.syncingUserScope",
        hintKey: "sync.syncingUserScopeHint",
    },
    program_scope: {
        titleKey: "sync.syncingProgramScope",
        hintKey: "sync.syncingProgramScopeHint",
    },
};

export function contentLoadingI18nKeys(
    pendingPhase: PendingSyncPhase | null,
): { titleKey: string; hintKey: string } {
    if (pendingPhase === "program_scope") {
        return SYNC_STREAM_LOADING_I18N.program_scope;
    }

    return SYNC_STREAM_LOADING_I18N.user_scope;
}
