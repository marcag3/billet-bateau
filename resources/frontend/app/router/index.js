import { createRouter, createWebHistory } from 'vue-router';

const routes = [
    {
        path: '/',
        name: 'dashboard',
        component: () => import('../pages/AppDashboardPage.vue'),
    },
    {
        path: '/reports',
        name: 'reports',
        component: () => import('../pages/AppReportsPage.vue'),
    },
    {
        path: '/settings',
        name: 'settings',
        component: () => import('../pages/AppSettingsPage.vue'),
    },
];

const router = createRouter({
    history: createWebHistory('/app'),
    routes,
});

export default router;
