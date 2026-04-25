import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { setProgramSyncScopeId } from '../powersync/app-powersync.runtime';
import { useAuthStore } from '../store/auth.store';

const scopedProgramMeta = {
    requiresAuth: true,
    requiresSelectedProgram: true,
} as const;

const programScopeChildren: RouteRecordRaw[] = [
    {
        path: '',
        meta: {
            ...scopedProgramMeta,
        },
        redirect: (to) => ({
            name: 'boats.list',
            params: { programId: String(to.params.programId ?? '') },
        }),
    },
    {
        path: 'contexts/edit',
        component: () => import('../layouts/AppProgramEditContextLayout.vue'),
        meta: {
            ...scopedProgramMeta,
        },
        children: [
            {
                path: '',
                meta: scopedProgramMeta,
                redirect: (to) => ({
                    name: 'boats.list',
                    params: { programId: String(to.params.programId ?? '') },
                }),
            },
            {
                path: 'boats',
                name: 'boats.list',
                component: () => import('../pages/AppBoatsPage.vue'),
                meta: scopedProgramMeta,
            },
            {
                path: 'boat-types',
                name: 'boat-types.list',
                component: () => import('../pages/AppBoatTypesPage.vue'),
                meta: scopedProgramMeta,
            },
            {
                path: 'reports',
                name: 'reports',
                component: () => import('../pages/AppReportsPage.vue'),
                meta: scopedProgramMeta,
            },
            {
                path: 'settings',
                name: 'settings',
                component: () => import('../pages/AppSettingsPage.vue'),
                meta: scopedProgramMeta,
            },
            {
                path: 'edit',
                name: 'programs.edit',
                component: () => import('../pages/AppProgramEditPage.vue'),
                meta: scopedProgramMeta,
            },
        ],
    },
    {
        path: 'contexts/control-panel',
        component: () => import('../layouts/AppProgramControlContextLayout.vue'),
        meta: {
            ...scopedProgramMeta,
        },
        children: [
            {
                path: '',
                name: 'programs.control',
                component: () => import('../pages/AppProgramControlPanelPage.vue'),
                meta: scopedProgramMeta,
            },
        ],
    },
    {
        path: 'contexts/checkin',
        component: () => import('../layouts/AppProgramCheckinContextLayout.vue'),
        meta: {
            ...scopedProgramMeta,
        },
        children: [
            {
                path: '',
                name: 'programs.checkin',
                component: () => import('../pages/AppProgramCheckinManagerPage.vue'),
                meta: scopedProgramMeta,
            },
        ],
    },
];

const routes: RouteRecordRaw[] = [
    {
        path: '/setup',
        name: 'setup',
        component: () => import('../pages/AppSetupPage.vue'),
        meta: {
            guestOnly: true,
        },
    },
    {
        path: '/login',
        name: 'login',
        component: () => import('../pages/AppLoginPage.vue'),
        meta: {
            guestOnly: true,
        },
    },
    {
        path: '/',
        redirect: '/programs',
    },
    {
        path: '/programs/new',
        name: 'programs.create',
        component: () => import('../pages/AppProgramCreatePage.vue'),
        meta: {
            requiresAuth: true,
        },
    },
    {
        path: '/programs/:programId',
        component: () => import('../layouts/AppProgramScopeLayout.vue'),
        meta: {
            requiresAuth: true,
        },
        children: programScopeChildren,
    },
    {
        path: '/programs',
        name: 'programs.list',
        component: () => import('../pages/AppProgramsPage.vue'),
        meta: {
            requiresAuth: true,
        },
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'not-found',
        component: () => import('../pages/AppNotFoundPage.vue'),
    },
];

const router = createRouter({
    history: createWebHistory('/app'),
    routes,
});

router.beforeEach(async (to) => {
    const authStore = useAuthStore();

    await authStore.initialize();
    await authStore.fetchSetupStatus();

    if (authStore.installRequired === true && to.name !== 'setup') {
        return { name: 'setup' };
    }

    if (authStore.installRequired === false && to.name === 'setup') {
        if (authStore.canAccessProtectedRoute()) {
            return { name: 'programs.list' };
        }

        return { name: 'login' };
    }

    const requiresAuth = to.meta.requiresAuth === true;
    const guestOnly = to.meta.guestOnly === true;

    if (guestOnly && authStore.canAccessProtectedRoute()) {
        return { name: 'programs.list' };
    }

    if (!requiresAuth) {
        return true;
    }

    if (authStore.canAccessProtectedRoute()) {
        const needsProgram = to.matched.some((r) => r.meta.requiresSelectedProgram === true);
        if (needsProgram) {
            const programId = String(to.params.programId ?? '').trim();
            if (programId.length === 0) {
                return { name: 'programs.list' };
            }
            await setProgramSyncScopeId(programId);
        } else {
            await setProgramSyncScopeId('');
        }

        return true;
    }

    return {
        name: 'login',
        query: {
            redirect: to.fullPath,
        },
    };
});

export default router;
