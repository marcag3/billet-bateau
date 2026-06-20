import { describe, expect, test } from "vitest";
import type { RouteLocationMatched } from "vue-router";
import { resolveRouteSyncStreams } from "../../utilities/route-sync-streams";

function matched(
    meta: RouteLocationMatched["meta"],
): RouteLocationMatched[] {
    return [
        { meta, path: "", redirect: undefined, name: undefined, components: {} },
    ] as RouteLocationMatched[];
}

describe("route-sync-streams", () => {
    test("uses deepest explicit syncStreams meta", () => {
        expect(
            resolveRouteSyncStreams([
                ...matched({ requiresSelectedProgram: true }),
                ...matched({ syncStreams: ["user_scope"] }),
            ]),
        ).toEqual(["user_scope"]);
    });

    test("defaults to user_scope and program_scope for program-scoped routes", () => {
        expect(
            resolveRouteSyncStreams(
                matched({ requiresSelectedProgram: true }),
            ),
        ).toEqual(["user_scope", "program_scope"]);
    });

    test("returns empty array when route has no sync requirements", () => {
        expect(resolveRouteSyncStreams(matched({ requiresAuth: true }))).toEqual(
            [],
        );
    });
});
