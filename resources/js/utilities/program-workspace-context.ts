/** Program workspace routes under `/programs/:programId/{edit|control|checkin}-context/…`. */
export const PROGRAM_WORKSPACE_CONTEXTS = ["edit", "control", "checkin"] as const;

export type ProgramWorkspaceContext = (typeof PROGRAM_WORKSPACE_CONTEXTS)[number];

/** Named route for each context’s home screen (after redirects). */
export const PROGRAM_CONTEXT_HOME_ROUTE_NAMES = {
    edit: "boats.list",
    control: "programs.control",
    checkin: "programs.checkin",
} as const satisfies Record<ProgramWorkspaceContext, string>;

/** Material icons for each workspace context (matches programs list actions). */
export const PROGRAM_WORKSPACE_CONTEXT_ICONS = {
    edit: "edit",
    control: "dashboard",
    checkin: "confirmation_number",
} as const satisfies Record<ProgramWorkspaceContext, string>;

export function isProgramWorkspaceContext(value: string): value is ProgramWorkspaceContext {
    return (PROGRAM_WORKSPACE_CONTEXTS as readonly string[]).includes(value);
}

/**
 * Resolve the active workspace context from `matched` (deepest record with `meta.programContext` wins).
 */
export function resolveProgramWorkspaceContextFromMatched(
    matched: readonly { meta?: { programContext?: unknown } }[],
): ProgramWorkspaceContext | null {
    for (let i = matched.length - 1; i >= 0; i--) {
        const ctx = matched[i]?.meta?.programContext;
        if (ctx === "edit" || ctx === "control" || ctx === "checkin") {
            return ctx;
        }
    }

    return null;
}
