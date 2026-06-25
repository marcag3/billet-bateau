import { Notify } from "quasar";
import { outboxCommitError } from "./powersync-runtime-state";

export type PowerSyncUploadEntryStatus = "applied" | "rejected";

export type PowerSyncUploadEntryResult = {
    id: string;
    type: string | null;
    op: string | null;
    status: PowerSyncUploadEntryStatus;
    errors?: Record<string, string[]> | null;
};

export type PowerSyncUploadBatchResult = {
    ok: boolean;
    results: PowerSyncUploadEntryResult[];
};

/**
 * @param payload
 */
export function parseUploadResults(
    payload: Record<string, unknown>,
): PowerSyncUploadEntryResult[] {
    const results = payload.results;

    if (!Array.isArray(results)) {
        return [];
    }

    return results
        .filter((entry): entry is Record<string, unknown> => {
            return entry != null && typeof entry === "object";
        })
        .map((entry) => ({
            id: typeof entry.id === "string" ? entry.id : "",
            type: typeof entry.type === "string" ? entry.type : null,
            op: typeof entry.op === "string" ? entry.op : null,
            status: entry.status === "rejected" ? "rejected" : "applied",
            errors: normalizeUploadErrors(entry.errors),
        }));
}

/**
 * @param results
 */
export function rejectedUploadResults(
    results: PowerSyncUploadEntryResult[],
): PowerSyncUploadEntryResult[] {
    return results.filter((result) => result.status === "rejected");
}

/**
 * @param results
 */
export function formatUploadRejectionMessage(
    results: PowerSyncUploadEntryResult[],
): string {
    const rejected = rejectedUploadResults(results);

    if (rejected.length === 0) {
        return "";
    }

    const firstError = rejected[0]?.errors;
    if (firstError != null) {
        for (const messages of Object.values(firstError)) {
            const message = messages.find(
                (value) => typeof value === "string" && value.trim().length > 0,
            );
            if (message != null) {
                return message;
            }
        }
    }

    const first = rejected[0];
    const type = first?.type ?? "change";
    const id = first?.id ?? "";

    if (id.length > 0) {
        return `Upload rejected for ${type} ${id}.`;
    }

    return `Upload rejected for ${type}.`;
}

/**
 * @param results
 */
export function publishUploadRejections(
    results: PowerSyncUploadEntryResult[],
): void {
    const message = formatUploadRejectionMessage(results);

    if (message.length === 0) {
        return;
    }

    outboxCommitError.value = message;

    if (typeof window === "undefined") {
        return;
    }

    Notify.create({
        type: "negative",
        message,
    });
}

/**
 * @param value
 */
function normalizeUploadErrors(
    value: unknown,
): Record<string, string[]> | null {
    if (value == null || typeof value !== "object") {
        return null;
    }

    const normalized: Record<string, string[]> = {};

    for (const [key, messages] of Object.entries(
        value as Record<string, unknown>,
    )) {
        if (!Array.isArray(messages)) {
            continue;
        }

        const strings = messages.filter(
            (message): message is string => typeof message === "string",
        );

        if (strings.length > 0) {
            normalized[key] = strings;
        }
    }

    return Object.keys(normalized).length > 0 ? normalized : null;
}
