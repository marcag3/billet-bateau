import {
    queryParams,
    type RouteQueryOptions,
    type RouteDefinition,
} from "./../../../../../wayfinder";

function parseProgramId(
    args: { programId: string | number } | [programId: string | number] | string | number,
): string {
    if (typeof args === "string" || typeof args === "number") {
        return String(args);
    }

    if (Array.isArray(args)) {
        return String(args[0] ?? "");
    }

    return String(args.programId);
}

/**
 * @see \App\Http\Controllers\Api\ProgramInvitationController::eligibility
 * @see app/Http/Controllers/Api/ProgramInvitationController.php
 * @route '/api/programs/{programId}/invitation-eligibility'
 */
export const eligibility = (
    args: { programId: string | number } | [programId: string | number] | string | number,
    options?: RouteQueryOptions,
): RouteDefinition<"get"> => ({
    url: eligibility.url(args, options),
    method: "get",
});

eligibility.definition = {
    methods: ["get", "head"],
    url: "/api/programs/{programId}/invitation-eligibility",
} satisfies RouteDefinition<["get", "head"]>;

eligibility.url = (
    args: { programId: string | number } | [programId: string | number] | string | number,
    options?: RouteQueryOptions,
) => {
    const programId = parseProgramId(args);

    return (
        eligibility.definition.url.replace("{programId}", programId) +
        queryParams(options)
    );
};

eligibility.get = (
    args: { programId: string | number } | [programId: string | number] | string | number,
    options?: RouteQueryOptions,
): RouteDefinition<"get"> => ({
    url: eligibility.url(args, options),
    method: "get",
});

eligibility.head = (
    args: { programId: string | number } | [programId: string | number] | string | number,
    options?: RouteQueryOptions,
): RouteDefinition<"head"> => ({
    url: eligibility.url(args, options),
    method: "head",
});

/**
 * @see \App\Http\Controllers\Api\ProgramInvitationController::store
 * @see app/Http/Controllers/Api/ProgramInvitationController.php
 * @route '/api/programs/{programId}/invitations'
 */
export const store = (
    args: { programId: string | number } | [programId: string | number] | string | number,
    options?: RouteQueryOptions,
): RouteDefinition<"post"> => ({
    url: store.url(args, options),
    method: "post",
});

store.definition = {
    methods: ["post"],
    url: "/api/programs/{programId}/invitations",
} satisfies RouteDefinition<["post"]>;

store.url = (
    args: { programId: string | number } | [programId: string | number] | string | number,
    options?: RouteQueryOptions,
) => {
    const programId = parseProgramId(args);

    return (
        store.definition.url.replace("{programId}", programId) + queryParams(options)
    );
};

store.post = (
    args: { programId: string | number } | [programId: string | number] | string | number,
    options?: RouteQueryOptions,
): RouteDefinition<"post"> => ({
    url: store.url(args, options),
    method: "post",
});

const ProgramInvitationController = { eligibility, store };

export default ProgramInvitationController;
