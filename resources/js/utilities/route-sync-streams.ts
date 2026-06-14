import type { RouteLocationMatched } from "vue-router";
import type { PowerSyncStream } from "./sync-readiness";

const DEFAULT_PROGRAM_SCOPED_STREAMS: PowerSyncStream[] = [
    "user_scope",
    "program_scope",
];

/**
 * Resolve required PowerSync streams from the deepest matched route record.
 */
export function resolveRouteSyncStreams(
    matched: readonly RouteLocationMatched[],
): PowerSyncStream[] {
    for (let i = matched.length - 1; i >= 0; i--) {
        const streams = matched[i].meta.syncStreams;
        if (streams != null && streams.length > 0) {
            return [...streams];
        }
    }

    if (matched.some((record) => record.meta.requiresSelectedProgram === true)) {
        return [...DEFAULT_PROGRAM_SCOPED_STREAMS];
    }

    return [];
}
