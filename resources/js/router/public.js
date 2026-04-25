import { createRouter, createWebHistory } from 'vue-router';
import PublicLayout from '../layouts/PublicLayout.vue';

const routes = [
    {
        path: '/',
        component: PublicLayout,
        children: [
            {
                path: '',
                name: 'public.home',
                component: () => import('../pages/PublicHomePage.vue'),
            },
            {
                path: 'programs/:identifier',
                name: 'public.program',
                component: () => import('../pages/PublicProgramDetailPage.vue'),
                props: true,
            },
        ],
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior() {
        return { top: 0 };
    },
});

export default router;
