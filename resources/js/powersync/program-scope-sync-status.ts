import type { SyncStatus } from "@powersync/common";

/** Matches `program_scope.priority` in `deploy/config/powersync/sync-config.yaml`. */
const PROGRAM_SCOPE_SYNC_PRIORITY = 2;

/**
 * True when PowerSync reports that buckets for `program_scope` (priority 2) have completed an initial sync.
 */
export function isProgramScopePrioritySynced(status: SyncStatus): boolean {
    return (
        status.statusForPriority(PROGRAM_SCOPE_SYNC_PRIORITY).hasSynced === true
    );
}
