import { computed, watch, type Ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { useLiveQuery } from "@tanstack/vue-db";
import { getAppPowerSyncContext } from "../powersync/app-powersync.runtime";
import type { ProgramOutput } from "../powersync/programs.collection";
import { liveQueryRows } from "../powersync/live-query-casts";
import { programBannerUrlFromObjectKey } from "../utilities/program-banner-url";
import {
    isProgramWorkspaceContext,
    PROGRAM_CONTEXT_HOME_ROUTE_NAMES,
    PROGRAM_WORKSPACE_CONTEXT_ICONS,
    PROGRAM_WORKSPACE_CONTEXTS,
    resolveProgramWorkspaceContextFromMatched,
    type ProgramWorkspaceContext,
} from "../utilities/program-workspace-context";

const WORKSPACE_CONTEXT_LABEL_KEYS: Record<ProgramWorkspaceContext, string> = {
    edit: "common.workspaceContext.edit",
    control: "common.workspaceContext.control",
    checkin: "common.workspaceContext.checkin",
};

type UseProgramWorkspaceLayoutOptions = {
    t: (key: string) => string;
    leftDrawerOpen: Ref<boolean>;
};

/**
 * Program-scoped layout: invalid program redirect, context switcher targets.
 * Context layouts teleport main nav items into the app drawer.
 */
export function useProgramWorkspaceLayout({
    t,
    leftDrawerOpen,
}: UseProgramWorkspaceLayoutOptions) {
    const router = useRouter();
    const route = useRoute();
    const $q = useQuasar();
    const programsCollection = getAppPowerSyncContext().collections.programs;

    const { data: programs, isLoading: programsQueryLoading } = useLiveQuery(
        (queryBuilder) => {
            const col = programsCollection.value;
            if (!col) {
                return undefined;
            }
            return queryBuilder.from({ p: col });
        },
        [programsCollection],
    );

    const programsList = computed((): ProgramOutput[] =>
        liveQueryRows<ProgramOutput>(programs.value),
    );

    const isProgramWorkspace = computed(() =>
        route.matched.some((r) => r.meta.requiresSelectedProgram === true),
    );

    const workspaceProgramId = computed(() =>
        isProgramWorkspace.value
            ? String(route.params.programId ?? "").trim()
            : "",
    );

    /** Normalized ids (including archived) for route access checks. */
    const accessibleProgramIdsUpperSet = computed(() => {
        const set = new Set<string>();
        for (const p of programsList.value) {
            set.add(String(p.id).trim().toUpperCase());
        }
        return set;
    });

    const programLabelById = computed(() => {
        const map = new Map<string, string>();
        for (const p of programsList.value) {
            if (p.id != null && String(p.id).length > 0) {
                map.set(String(p.id), String(p.name ?? p.id));
            }
        }
        return map;
    });

    const currentContext = computed(() =>
        resolveProgramWorkspaceContextFromMatched(route.matched),
    );

    const contextSwitcherOptions = computed(() =>
        PROGRAM_WORKSPACE_CONTEXTS.map((value) => ({
            value,
            label: t(WORKSPACE_CONTEXT_LABEL_KEYS[value]),
            icon: PROGRAM_WORKSPACE_CONTEXT_ICONS[value],
        })),
    );

    const currentContextLabel = computed(() => {
        const ctx = currentContext.value;
        if (ctx != null) {
            return t(WORKSPACE_CONTEXT_LABEL_KEYS[ctx]);
        }
        const id = workspaceProgramId.value;
        if (id.length === 0) {
            return t("common.programs");
        }
        return programLabelById.value.get(id) ?? id;
    });

    const workspaceProgram = computed((): ProgramOutput | null => {
        const id = workspaceProgramId.value;
        if (id.length === 0) {
            return null;
        }
        const idUpper = id.toUpperCase();
        return (
            programsList.value.find(
                (p) => String(p.id).trim().toUpperCase() === idUpper,
            ) ?? null
        );
    });

    const workspaceProgramName = computed(() => {
        const program = workspaceProgram.value;
        if (program?.name != null && String(program.name).trim().length > 0) {
            return String(program.name);
        }
        const id = workspaceProgramId.value;
        if (id.length === 0) {
            return "";
        }
        return programLabelById.value.get(id) ?? id;
    });

    const workspaceProgramBannerUrl = computed(() =>
        programBannerUrlFromObjectKey(workspaceProgram.value?.banner_object_key),
    );

    watch(
        [
            accessibleProgramIdsUpperSet,
            () => route.params.programId,
            isProgramWorkspace,
            programsQueryLoading,
        ],
        () => {
            if (!isProgramWorkspace.value) {
                return;
            }
            const pidRaw = String(route.params.programId ?? "").trim();
            if (pidRaw.length === 0) {
                return;
            }
            // While the programs live query is still syncing, row data can be incomplete;
            // never treat that as "user has no access to this program".
            if (programsQueryLoading.value) {
                return;
            }
            // Important: on a hard refresh, the query can be "ready" before the
            // user_scope stream has delivered any program rows. Treat an empty
            // program list as "not enough evidence yet" rather than "user has no programs".
            if (accessibleProgramIdsUpperSet.value.size === 0) {
                return;
            }
            const pid = pidRaw.toUpperCase();
            if (!accessibleProgramIdsUpperSet.value.has(pid)) {
                void router.replace({ name: "programs.list" });
            }
        },
        { immediate: true },
    );

    watch(
        () => route.fullPath,
        () => {
            if ($q.screen.lt.md) {
                leftDrawerOpen.value = false;
            }
        },
    );

    /**
     * Navigate to the selected context’s home route for the current program.
     *
     * @param context
     */
    function onSwitchContext(context: string) {
        if (!isProgramWorkspaceContext(context)) {
            return;
        }
        const programId = workspaceProgramId.value;
        if (programId.length === 0) {
            return;
        }
        if (context === currentContext.value) {
            return;
        }
        const name = PROGRAM_CONTEXT_HOME_ROUTE_NAMES[context];
        void router.push({
            name,
            params: { programId },
        });
    }

    return {
        isProgramWorkspace,
        workspaceProgramId,
        workspaceProgramName,
        workspaceProgramBannerUrl,
        contextSwitcherOptions,
        currentContext,
        currentContextLabel,
        onSwitchContext,
    };
}
