import type { RouteLocationNormalizedLoaded } from 'vue-router';

export function controlContextNamedRoute(
    route: RouteLocationNormalizedLoaded,
    name: string,
    params: Record<string, string> = {},
) {
    return {
        name,
        params: {
            programId: String(route.params.programId ?? '').trim(),
            ...params,
        },
    };
}
