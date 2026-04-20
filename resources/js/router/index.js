import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../store/auth.store';

const routes = [
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
        name: 'dashboard',
        component: () => import('../pages/AppDashboardPage.vue'),
        meta: {
            requiresAuth: true,
        },
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
            return { name: 'dashboard' };
        }

        return { name: 'login' };
    }

    const requiresAuth = to.meta.requiresAuth === true;
    const guestOnly = to.meta.guestOnly === true;

    if (guestOnly && authStore.canAccessProtectedRoute()) {
        return { name: 'dashboard' };
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
