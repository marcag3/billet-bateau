import {
    createRouter,
    createWebHistory,
    type RouteRecordRaw,
} from "vue-router";
import { bootstrapDomainModels } from "../models/model.registry";
import { setActiveProgramId } from "../powersync/app-powersync.runtime";
import { useAuthStore } from "../store/auth.store";

const scopedProgramMeta = {
    requiresAuth: true,
    requiresSelectedProgram: true,
} as const;

const programScopeChildren: RouteRecordRaw[] = [
    {
        path: "",
        meta: {
            ...scopedProgramMeta,
        },
        redirect: (to) => ({
            name: "boats.list",
            params: { programId: String(to.params.programId ?? "") },
        }),
    },
    {
        path: "edit-context",
        component: () => import("../layouts/AppProgramEditContextLayout.vue"),
        meta: {
            ...scopedProgramMeta,
            programContext: "edit",
        },
        children: [
            {
                path: "",
                meta: scopedProgramMeta,
                redirect: (to) => ({
                    name: "boats.list",
                    params: { programId: String(to.params.programId ?? "") },
                }),
            },
            {
                path: "boats/create",
                name: "boats.create",
                component: () => import("../pages/AppBoatCreatePage.vue"),
                meta: scopedProgramMeta,
            },
            {
                path: "boats/:boatId/edit",
                name: "boats.edit",
                component: () => import("../pages/AppBoatEditPage.vue"),
                meta: scopedProgramMeta,
            },
            {
                path: "boats",
                name: "boats.list",
                component: () => import("../pages/AppBoatsPage.vue"),
                meta: scopedProgramMeta,
            },
            {
                path: "water-routes/create",
                name: "water-routes.create",
                component: () =>
                    import("../pages/AppWaterRouteCreatePage.vue"),
                meta: scopedProgramMeta,
            },
            {
                path: "water-routes/:waterRouteId/edit",
                name: "water-routes.edit",
                component: () => import("../pages/AppWaterRouteEditPage.vue"),
                meta: scopedProgramMeta,
            },
            {
                path: "water-routes",
                name: "water-routes.list",
                component: () => import("../pages/AppWaterRoutesPage.vue"),
                meta: scopedProgramMeta,
            },
            {
                path: "trips/create",
                name: "trips.create",
                component: () => import("../pages/AppTripCreatePage.vue"),
                meta: scopedProgramMeta,
            },
            {
                path: "trips/calendar",
                name: "trips.calendar",
                component: () => import("../pages/AppTripsCalendarPage.vue"),
                meta: scopedProgramMeta,
            },
            {
                path: "trips/:tripId/edit",
                name: "trips.edit",
                component: () => import("../pages/AppTripEditPage.vue"),
                meta: scopedProgramMeta,
            },
            {
                path: "trips",
                name: "trips.list",
                component: () => import("../pages/AppTripsPage.vue"),
                meta: scopedProgramMeta,
            },
            {
                path: "template-days/create",
                name: "template-days.create",
                component: () =>
                    import("../pages/AppTemplateDayCreatePage.vue"),
                meta: scopedProgramMeta,
            },
            {
                path: "template-days/:templateDayId/edit",
                name: "template-days.edit",
                component: () => import("../pages/AppTemplateDayEditPage.vue"),
                meta: scopedProgramMeta,
            },
            {
                path: "template-days",
                name: "template-days.list",
                component: () => import("../pages/AppTemplateDaysPage.vue"),
                meta: scopedProgramMeta,
            },
            {
                path: "ticket-types",
                name: "ticket-types.list",
                component: () => import("../pages/AppTicketTypesPage.vue"),
                meta: scopedProgramMeta,
            },

            {
                path: "edit",
                name: "programs.edit",
                component: () => import("../pages/AppProgramEditPage.vue"),
                meta: scopedProgramMeta,
            },
        ],
    },
    {
        path: "control-context",
        component: () =>
            import("../layouts/AppProgramControlContextLayout.vue"),
        meta: {
            ...scopedProgramMeta,
            programContext: "control",
        },
        children: [
            {
                path: "",
                meta: scopedProgramMeta,
                redirect: (to) => ({
                    name: "programs.control",
                    params: { programId: String(to.params.programId ?? "") },
                }),
            },
            {
                path: "control",
                name: "programs.control",
                component: () =>
                    import("../pages/AppProgramControlPanelPage.vue"),
                meta: scopedProgramMeta,
            },
        ],
    },
    {
        path: "checkin-context",
        component: () =>
            import("../layouts/AppProgramCheckinContextLayout.vue"),
        meta: {
            ...scopedProgramMeta,
            programContext: "checkin",
        },
        children: [
            {
                path: "",
                meta: scopedProgramMeta,
                redirect: (to) => ({
                    name: "programs.checkin",
                    params: { programId: String(to.params.programId ?? "") },
                }),
            },
            {
                path: "checkin",
                name: "programs.checkin",
                component: () =>
                    import("../pages/AppProgramCheckinManagerPage.vue"),
                meta: scopedProgramMeta,
            },
        ],
    },
];

const routes: RouteRecordRaw[] = [
    {
        path: "/setup",
        name: "setup",
        component: () => import("../pages/AppSetupPage.vue"),
        meta: {
            guestOnly: true,
        },
    },
    {
        path: "/login",
        name: "login",
        component: () => import("../pages/AppLoginPage.vue"),
        meta: {
            guestOnly: true,
        },
    },
    {
        path: "/",
        redirect: "/programs",
    },
    {
        path: "/programs/new",
        name: "programs.create",
        component: () => import("../pages/AppProgramCreatePage.vue"),
        meta: {
            requiresAuth: true,
        },
    },
    {
        path: "/programs/:programId",
        component: () => import("../layouts/AppProgramScopeLayout.vue"),
        meta: {
            requiresAuth: true,
        },
        children: programScopeChildren,
    },
    {
        path: "/programs",
        name: "programs.list",
        component: () => import("../pages/AppProgramsPage.vue"),
        meta: {
            requiresAuth: true,
        },
    },
    {
        path: "/:pathMatch(.*)*",
        name: "not-found",
        component: () => import("../pages/AppNotFoundPage.vue"),
    },
];

const router = createRouter({
    history: createWebHistory("/app"),
    routes,
});

router.beforeEach(async (to) => {
    const authStore = useAuthStore();

    await authStore.initialize();
    await authStore.fetchSetupStatus();

    if (authStore.installRequired === true && to.name !== "setup") {
        return { name: "setup" };
    }

    if (authStore.installRequired === false && to.name === "setup") {
        if (authStore.canAccessProtectedRoute()) {
            return { name: "programs.list" };
        }

        return { name: "login" };
    }

    const requiresAuth = to.meta.requiresAuth === true;
    const guestOnly = to.meta.guestOnly === true;

    if (guestOnly && authStore.canAccessProtectedRoute()) {
        return { name: "programs.list" };
    }

    if (!requiresAuth) {
        return true;
    }

    if (authStore.canAccessProtectedRoute()) {
        const needsProgram = to.matched.some(
            (r) => r.meta.requiresSelectedProgram === true,
        );
        if (needsProgram) {
            const programId = String(to.params.programId ?? "").trim();
            if (programId.length === 0) {
                return { name: "programs.list" };
            }
            setActiveProgramId(programId);
        } else {
            setActiveProgramId("");
        }

        void bootstrapDomainModels();

        return true;
    }

    return {
        name: "login",
        query: {
            redirect: to.fullPath,
        },
    };
});

export default router;
