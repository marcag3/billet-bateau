import {
    queryParams,
    type RouteQueryOptions,
    type RouteDefinition,
} from "./../../../../../wayfinder";

function parseToken(
    args: { token: string } | [token: string] | string,
): string {
    if (typeof args === "string") {
        return args;
    }

    if (Array.isArray(args)) {
        return String(args[0] ?? "");
    }

    return String(args.token);
}

/**
 * @see \App\Http\Controllers\Auth\ProgramInvitationAcceptController::show
 * @see app/Http/Controllers/Auth/ProgramInvitationAcceptController.php
 * @route '/invite/{token}'
 */
export const show = (
    args: { token: string } | [token: string] | string,
    options?: RouteQueryOptions,
): RouteDefinition<"get"> => ({
    url: show.url(args, options),
    method: "get",
});

show.definition = {
    methods: ["get", "head"],
    url: "/invite/{token}",
} satisfies RouteDefinition<["get", "head"]>;

show.url = (
    args: { token: string } | [token: string] | string,
    options?: RouteQueryOptions,
) => {
    const token = parseToken(args);

    return show.definition.url.replace("{token}", token) + queryParams(options);
};

show.get = (
    args: { token: string } | [token: string] | string,
    options?: RouteQueryOptions,
): RouteDefinition<"get"> => ({
    url: show.url(args, options),
    method: "get",
});

show.head = (
    args: { token: string } | [token: string] | string,
    options?: RouteQueryOptions,
): RouteDefinition<"head"> => ({
    url: show.url(args, options),
    method: "head",
});

/**
 * @see \App\Http\Controllers\Auth\ProgramInvitationAcceptController::accept
 * @see app/Http/Controllers/Auth/ProgramInvitationAcceptController.php
 * @route '/invite/{token}/accept'
 */
export const accept = (
    args: { token: string } | [token: string] | string,
    options?: RouteQueryOptions,
): RouteDefinition<"post"> => ({
    url: accept.url(args, options),
    method: "post",
});

accept.definition = {
    methods: ["post"],
    url: "/invite/{token}/accept",
} satisfies RouteDefinition<["post"]>;

accept.url = (
    args: { token: string } | [token: string] | string,
    options?: RouteQueryOptions,
) => {
    const token = parseToken(args);

    return accept.definition.url.replace("{token}", token) + queryParams(options);
};

accept.post = (
    args: { token: string } | [token: string] | string,
    options?: RouteQueryOptions,
): RouteDefinition<"post"> => ({
    url: accept.url(args, options),
    method: "post",
});

const ProgramInvitationAcceptController = { show, accept };

export default ProgramInvitationAcceptController;
