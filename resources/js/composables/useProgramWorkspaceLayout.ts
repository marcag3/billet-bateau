import { computed, onMounted, watch, type ComputedRef, type Ref } from "vue";
import { useRoute, useRouter, type LocationQueryRaw } from "vue-router";
import { useQuasar } from "quasar";
import { useLiveQuery } from "@tanstack/vue-db";
import { useAuthStore } from "../store/auth.store";
import {
    getProgramsCollection,
    getAppPowerSyncBootstrappedRef,
} from "../powersync/app-powersync.runtime";
import { useAppLayoutStore } from "../store/app-layout.store";

type UseProgramWorkspaceLayoutOptions = {
    t: (key: string) => string;
    layoutStore: ReturnType<typeof useAppLayoutStore>;
    leftDrawerOpen: Ref<boolean>;
};

/**
 * Program-scoped layout: visible programs, program switch, invalid program redirect.
 * Context layouts teleport main nav items into the app drawer.
 */
export function useProgramWorkspaceLayout({
    t,
    layoutStore,
    leftDrawerOpen,
}: UseProgramWorkspaceLayoutOptions) {
    const router = useRouter();
    const route = useRoute();
    const $q = useQuasar();
    const authStore = useAuthStore();
    const programsCollection = getProgramsCollection();

    const { data: programs } = useLiveQuery(
        (queryBuilder) => {
            const col = programsCollection.value;
            if (!col) return undefined;
            return queryBuilder.from({ p: col });
        },
        [programsCollection],
    );

    const isProgramWorkspace = computed(() =>
        route.matched.some((r) => r.meta.requiresSelectedProgram === true),
    );

    const workspaceProgramId = computed(() =>
        isProgramWorkspace.value
            ? String(route.params.programId ?? "").trim()
            : "",
    );

    const visibleProgramIds = computed(() =>
        (programs.value ?? [])
            .filter((p) => p != null && !p.is_archived)
            .map((p) => String(p.id)),
    );

    const programSwitcherOptions = computed(() =>
        (programs.value ?? [])
            .filter((p) => p != null && !p.is_archived)
            .map((p) => ({
                label: String(p.name ?? ""),
                value: String(p.id),
            })),
    );

    // O(1) program name lookup via Map instead of O(n) .find()
    const programLabelById = computed(() => {
        const map = new Map<string, string>();
        for (const p of programs.value ?? []) {
            if (p != null && p.id) {
                map.set(String(p.id), String(p.name ?? p.id));
            }
        }
        return map;
    });

    const currentProgramLabel = computed(() => {
        const id = workspaceProgramId.value;
        if (id.length === 0) {
            return t("common.programs");
        }
        return programLabelById.value.get(id) ?? id;
    });

    const allowsInPlaceProgramIdSwitch: ComputedRef<boolean> = computed(
        () => layoutStore.allowsInPlaceProgramIdSwitch,
    );

    watch(
        [visibleProgramIds, () => route.params.programId, isProgramWorkspace],
        ([ids]) => {
            if (!isProgramWorkspace.value) {
                return;
            }
            const pid = String(route.params.programId ?? "").trim();
            if (pid.length === 0) {
                return;
            }
            if (ids.length === 0) {
                void router.replace({ name: "programs.list" });
                return;
            }
            if (!ids.includes(pid)) {
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

    onMounted(() => {
        if (authStore.canAccessProtectedRoute()) {
            // programs bootstrap is gated by AppBootstrapGate
        }
    });

    /**
     * @param programId
     */
    function onSwitchProgram(programId: string) {
        const next = String(programId ?? "").trim();
        if (next.length === 0) {
            return;
        }
        if (next === workspaceProgramId.value) {
            return;
        }
        if (!allowsInPlaceProgramIdSwitch.value) {
            return;
        }
        const name = route.name;
        if (name == null || typeof name !== "string") {
            return;
        }
        const query: LocationQueryRaw = { ...route.query };
        void router.push({
            name: name as never,
            params: { ...route.params, programId: next },
            query,
        });
    }

    return {
        isProgramWorkspace,
        workspaceProgramId,
        programSwitcherOptions,
        currentProgramLabel,
        allowsInPlaceProgramIdSwitch,
        onSwitchProgram,
    };
}
