import type { SyncStatus } from "@powersync/common";

/** Matches `user_scope.priority` in `docker/powersync/sync-config.yaml`. */
const USER_SCOPE_SYNC_PRIORITY = 1;

/**
 * True when PowerSync reports that buckets for `user_scope` (priority 1) have completed an initial sync.
 */
export function isUserScopePrioritySynced(status: SyncStatus): boolean {
    return (
        status.statusForPriority(USER_SCOPE_SYNC_PRIORITY).hasSynced === true
    );
}
