import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '../store/auth.store';

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
        path: '/reports',
        name: 'reports',
        component: () => import('../pages/AppReportsPage.vue'),
        meta: {
            requiresAuth: true,
        },
    },
    {
        path: '/settings',
        name: 'settings',
        component: () => import('../pages/AppSettingsPage.vue'),
        meta: {
            requiresAuth: true,
        },
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
        path: '/programs/:id/edit',
        name: 'programs.edit',
        component: () => import('../pages/AppProgramEditPage.vue'),
        meta: {
            requiresAuth: true,
        },
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
        path: '/boats',
        name: 'boats.list',
        component: () => import('../pages/AppBoatsPage.vue'),
        meta: {
            requiresAuth: true,
        },
    },
    {
        path: '/boat-types',
        name: 'boat-types.list',
        component: () => import('../pages/AppBoatTypesPage.vue'),
        meta: {
            requiresAuth: true,
        },
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
