/**
 * Phase 2: local PowerSync is wired but the programs list must not be treated as authoritative yet.
 */
export function isProgramsInitialLoadPending(
    hasBootstrapped: boolean,
    initialUserScopeSyncComplete: boolean,
    programsQueryLoading: boolean,
): boolean {
    if (!hasBootstrapped) {
        return false;
    }

    return !initialUserScopeSyncComplete || programsQueryLoading;
}

/**
 * Whether to show the empty-programs row (suppress during initial user_scope sync / live query load).
 */
export function shouldShowProgramsEmptyState(
    hasBootstrapped: boolean,
    filteredProgramsLength: number,
    initialUserScopeSyncComplete: boolean,
    programsQueryLoading: boolean,
): boolean {
    if (!hasBootstrapped) {
        return false;
    }

    if (!initialUserScopeSyncComplete || programsQueryLoading) {
        return false;
    }

    return filteredProgramsLength === 0;
}
