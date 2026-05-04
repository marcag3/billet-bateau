import { describe, test, expect, vi, beforeEach } from 'vitest';
import { reactive, ref, nextTick } from 'vue';

// Fresh routerReplace for each test - created inside the mock factory
let currentRouterReplace = vi.fn();

const mockRoute = reactive({
    params: { programId: 'test-program-123' },
    matched: [{ meta: { requiresSelectedProgram: true } }],
    fullPath: '/programs/test-program-123/edit-context/boats',
    name: 'boats.list' as string | null,
    query: {} as Record<string, any>,
});

vi.mock('vue-router', () => ({
    useRouter: () => ({
        get replace() { return currentRouterReplace; },
        push: vi.fn(),
    }),
    useRoute: () => mockRoute,
    createRouter: vi.fn(),
    createWebHistory: vi.fn(),
}));

const mockProgramsData = ref<any[]>([]);
const mockProgramsStatus = ref<string>('disabled');

vi.mock('@tanstack/vue-db', () => ({
    useLiveQuery: () => ({
        data: mockProgramsData,
        isLoading: ref(false),
        status: mockProgramsStatus,
    }),
}));

vi.mock('quasar', () => ({
    useQuasar: () => ({ screen: { lt: { md: false } } }),
}));

vi.mock('../../store/auth.store', () => ({
    useAuthStore: () => ({
        canAccessProtectedRoute: () => true,
        user: { id: 'user-1', name: 'Test User' },
    }),
}));

const mockLayoutStore = {
    allowsInPlaceProgramIdSwitch: true,
    setLayoutAllowsInPlaceProgramIdSwitch: vi.fn(),
    clearLayoutAllowsInPlaceProgramIdSwitch: vi.fn(),
    pageLayoutOverrides: null,
};

vi.mock('../../store/app-layout.store', () => ({
    useAppLayoutStore: () => mockLayoutStore,
}));

vi.mock('../../powersync/app-powersync.runtime', () => ({
    getProgramsCollection: () => ref(null),
    getActiveProgramIdRef: () => ref(''),
    setActiveProgramId: vi.fn(),
}));

import { useProgramWorkspaceLayout } from '../../composables/useProgramWorkspaceLayout';

describe('useProgramWorkspaceLayout redirect guard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Fresh fn for isolation
        currentRouterReplace = vi.fn();
        mockRoute.params = { programId: 'test-program-123' };
        mockRoute.matched = [{ meta: { requiresSelectedProgram: true } }];
        mockProgramsData.value = [];
        mockProgramsStatus.value = 'disabled';
    });

    function callComposable() {
        return useProgramWorkspaceLayout({
            t: (key: string) => key,
            layoutStore: mockLayoutStore as any,
            leftDrawerOpen: ref(false),
        });
    }

    function getRouterReplace() {
        return currentRouterReplace;
    }

    test('does NOT redirect when status is disabled (before PowerSync bootstrap)', async () => {
        mockProgramsStatus.value = 'disabled';
        mockProgramsData.value = [];

        callComposable();
        await nextTick();
        await nextTick();

        expect(getRouterReplace()).not.toHaveBeenCalled();
    });

    test('does NOT redirect when status is loading (PowerSync syncing)', async () => {
        mockProgramsStatus.value = 'loading';
        mockProgramsData.value = [];

        callComposable();
        await nextTick();
        await nextTick();

        expect(getRouterReplace()).not.toHaveBeenCalled();
    });

    test('does NOT redirect when status is ready and program IS in the list', async () => {
        mockProgramsStatus.value = 'ready';
        mockProgramsData.value = [
            { id: 'test-program-123', name: 'My Program', is_archived: false },
        ];

        callComposable();
        await nextTick();
        await nextTick();

        expect(getRouterReplace()).not.toHaveBeenCalled();
    });

    test('REDIRECTS when status is ready and program is NOT in the list', async () => {
        mockProgramsStatus.value = 'ready';
        mockProgramsData.value = [
            { id: 'other-program-456', name: 'Other Program', is_archived: false },
        ];

        callComposable();
        await nextTick();
        await nextTick();

        expect(getRouterReplace()).toHaveBeenCalledWith({ name: 'programs.list' });
    });

    test('does NOT redirect when status is ready but programs list is empty (initial hydration)', async () => {
        mockProgramsStatus.value = 'ready';
        mockProgramsData.value = [];

        callComposable();
        await nextTick();
        await nextTick();

        expect(getRouterReplace()).not.toHaveBeenCalled();
    });
});
