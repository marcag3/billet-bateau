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
                path: "guides",
                name: "guides.list",
                component: () => import("../pages/AppGuidesPage.vue"),
                meta: scopedProgramMeta,
            },
            {
                path: "products",
                name: "products.list",
                component: () => import("../pages/AppProductsPage.vue"),
                meta: scopedProgramMeta,
            },
            {
                path: "trips/calendar",
                redirect: (to) => ({
                    name: "trips",
                    params: { programId: String(to.params.programId ?? "") },
                    query: { ...to.query },
                }),
            },
            {
                path: "trips",
                name: "trips",
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
                meta: {
                    ...scopedProgramMeta,
                    syncStreams: ["user_scope"],
                },
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
                    query: to.query,
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
        path: "/forgot-password",
        name: "forgot-password",
        component: () => import("../pages/AppForgotPasswordPage.vue"),
        meta: {
            guestOnly: true,
        },
    },
    {
        path: "/reset-password",
        name: "reset-password",
        component: () => import("../pages/AppResetPasswordPage.vue"),
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
            syncStreams: ["user_scope"],
        },
    },
    {
        path: "/profile",
        name: "profile",
        component: () => import("../pages/AppProfilePage.vue"),
        meta: {
            requiresAuth: true,
        },
    },
    {
        path: "/invite/:token",
        name: "programs.inviteAccept",
        component: () => import("../pages/AppProgramInviteAcceptPage.vue"),
        meta: {
            requiresAuth: false,
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
