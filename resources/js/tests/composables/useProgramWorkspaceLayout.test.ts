import { describe, test, expect, vi, beforeEach } from "vitest";
import { reactive, ref, nextTick } from "vue";

// Fresh router fns for each test — created inside mock factories
let currentRouterReplace = vi.fn();
let currentRouterPush = vi.fn();

type MockMatchedRecord = {
    meta: {
        requiresSelectedProgram?: boolean;
        programContext?: "edit" | "control" | "checkin";
    };
};

const mockRoute = reactive({
    params: { programId: "test-program-123" },
    matched: [
        {
            meta: {
                requiresSelectedProgram: true,
                programContext: "edit",
            },
        },
    ] as MockMatchedRecord[],
    fullPath: "/programs/test-program-123/edit-context/boats",
    name: "boats.list" as string | null,
    query: {} as Record<string, unknown>,
});

vi.mock("vue-router", () => ({
    useRouter: () => ({
        get replace() {
            return currentRouterReplace;
        },
        get push() {
            return currentRouterPush;
        },
    }),
    useRoute: () => mockRoute,
    createRouter: vi.fn(),
    createWebHistory: vi.fn(),
}));

const mockProgramsData = ref<unknown[]>([]);
const mockProgramsStatus = ref<string>("disabled");
const mockProgramsLoading = ref(false);

vi.mock("@tanstack/vue-db", () => ({
    useLiveQuery: () => ({
        data: mockProgramsData,
        isLoading: mockProgramsLoading,
        status: mockProgramsStatus,
    }),
}));

vi.mock("quasar", () => ({
    useQuasar: () => ({ screen: { lt: { md: false } } }),
}));

vi.mock("../../powersync/app-powersync.runtime", () => ({
    getAppPowerSyncContext: () => ({
        collections: {
            programs: ref(null),
        },
    }),
}));

import { useProgramWorkspaceLayout } from "../../composables/useProgramWorkspaceLayout";

describe("useProgramWorkspaceLayout redirect guard", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        currentRouterReplace = vi.fn();
        currentRouterPush = vi.fn();
        mockRoute.params = { programId: "test-program-123" };
        mockRoute.matched = [
            {
                meta: {
                    requiresSelectedProgram: true,
                    programContext: "edit",
                },
            },
        ] as MockMatchedRecord[];
        mockProgramsData.value = [];
        mockProgramsStatus.value = "disabled";
        mockProgramsLoading.value = false;
    });

    function callComposable() {
        return useProgramWorkspaceLayout({
            t: (key: string) => key,
            leftDrawerOpen: ref(false),
        });
    }

    function getRouterReplace() {
        return currentRouterReplace;
    }

    test("does NOT redirect when status is disabled (before PowerSync bootstrap)", async () => {
        mockProgramsStatus.value = "disabled";
        mockProgramsData.value = [];

        callComposable();
        await nextTick();
        await nextTick();

        expect(getRouterReplace()).not.toHaveBeenCalled();
    });

    test("does NOT redirect when status is loading (PowerSync syncing)", async () => {
        mockProgramsStatus.value = "loading";
        mockProgramsData.value = [];

        callComposable();
        await nextTick();
        await nextTick();

        expect(getRouterReplace()).not.toHaveBeenCalled();
    });

    test("does NOT redirect while programs query isLoading even if rows look incomplete", async () => {
        mockProgramsLoading.value = true;
        mockProgramsData.value = [
            {
                id: "other-program-456",
                name: "Other Program",
                is_archived: false,
            },
        ];

        callComposable();
        await nextTick();
        await nextTick();

        expect(getRouterReplace()).not.toHaveBeenCalled();
    });

    test("does NOT redirect when status is ready and program IS in the list", async () => {
        mockProgramsStatus.value = "ready";
        mockProgramsLoading.value = false;
        mockProgramsData.value = [
            { id: "test-program-123", name: "My Program", is_archived: false },
        ];

        callComposable();
        await nextTick();
        await nextTick();

        expect(getRouterReplace()).not.toHaveBeenCalled();
    });

    test("does NOT redirect when program is archived (still accessible)", async () => {
        mockProgramsStatus.value = "ready";
        mockProgramsLoading.value = false;
        mockRoute.params = { programId: "test-program-123" };
        mockProgramsData.value = [
            { id: "test-program-123", name: "Archived", is_archived: true },
        ];

        callComposable();
        await nextTick();
        await nextTick();

        expect(getRouterReplace()).not.toHaveBeenCalled();
    });

    test("matches program id case-insensitively", async () => {
        mockProgramsStatus.value = "ready";
        mockProgramsLoading.value = false;
        mockRoute.params = { programId: "test-program-abc" };
        mockProgramsData.value = [
            { id: "TEST-PROGRAM-ABC", name: "My Program", is_archived: false },
        ];

        callComposable();
        await nextTick();
        await nextTick();

        expect(getRouterReplace()).not.toHaveBeenCalled();
    });

    test("REDIRECTS when status is ready and program is NOT in the list", async () => {
        mockProgramsStatus.value = "ready";
        mockProgramsLoading.value = false;
        mockProgramsData.value = [
            {
                id: "other-program-456",
                name: "Other Program",
                is_archived: false,
            },
        ];

        callComposable();
        await nextTick();
        await nextTick();

        expect(getRouterReplace()).toHaveBeenCalledWith({
            name: "programs.list",
        });
    });

    test("does NOT redirect when status is ready but programs list is empty (initial hydration)", async () => {
        mockProgramsStatus.value = "ready";
        mockProgramsLoading.value = false;
        mockProgramsData.value = [];

        callComposable();
        await nextTick();
        await nextTick();

        expect(getRouterReplace()).not.toHaveBeenCalled();
    });
});

describe("useProgramWorkspaceLayout context switcher", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        currentRouterReplace = vi.fn();
        currentRouterPush = vi.fn();
        mockRoute.params = { programId: "test-program-123" };
        mockRoute.matched = [
            {
                meta: {
                    requiresSelectedProgram: true,
                    programContext: "edit",
                },
            },
        ] as MockMatchedRecord[];
        mockProgramsData.value = [];
        mockProgramsLoading.value = false;
    });

    function callComposable() {
        return useProgramWorkspaceLayout({
            t: (key: string) => key,
            leftDrawerOpen: ref(false),
        });
    }

    test("exposes three context options in stable order", () => {
        const { contextSwitcherOptions } = callComposable();
        expect(contextSwitcherOptions.value.map((o) => o.value)).toEqual([
            "edit",
            "control",
            "checkin",
        ]);
    });

    test("onSwitchContext pushes context home route with current programId", async () => {
        const { onSwitchContext } = callComposable();
        onSwitchContext("control");
        await nextTick();

        expect(currentRouterPush).toHaveBeenCalledWith({
            name: "programs.control",
            params: { programId: "test-program-123" },
        });
    });

    test("onSwitchContext does nothing when already on that context", () => {
        const { onSwitchContext } = callComposable();
        onSwitchContext("edit");
        expect(currentRouterPush).not.toHaveBeenCalled();
    });

    test("onSwitchContext ignores unknown context values", () => {
        const { onSwitchContext } = callComposable();
        onSwitchContext("not-a-context");
        expect(currentRouterPush).not.toHaveBeenCalled();
    });

    test("currentContext resolves from matched meta (deepest wins)", () => {
        mockRoute.matched = [
            { meta: { requiresSelectedProgram: true, programContext: "edit" } },
            { meta: { requiresSelectedProgram: true, programContext: "control" } },
        ] as MockMatchedRecord[];
        const { currentContext } = callComposable();
        expect(currentContext.value).toBe("control");
    });
});
