import config from "src/config.json";
const routes = [
    //guest client
    {
        component: () => import("layouts/WelcomeLayout.vue"),
        path: "/client/bienvenue",
        children: [
            {
                path: "",
                component: () => import("pages/client/Welcome"),
                name: "client.welcome",
                meta: { auth: "guest client" },
            },
            {
                path: "/client/connection",
                component: () => import("pages/client/Login"),
                name: "client.login",
                meta: { auth: "guest client" },
            },
        ],
    },
    //connected client
    {
        component: () => import("layouts/MainLayout.vue"),
        meta: { auth: "client" },
        path: "/client/",
        children: [
            {
                path: "",
                component: () => import("pages/client/Home.vue"),
                name: "client.home",
                meta: { auth: "client", icon: "fas fa-home" },
            },
            {
                path: "profil",
                component: () => import("pages/client/Profile"),
                name: "client.profile",
                meta: { auth: "client", icon: "fas fa-address-card" },
            },
            // {
            //     path: "reservation",
            //     component: () => import("pages/client/Booking"),
            //     name: "client.booking",
            //     meta: { auth: "client", icon: config.icons["booking"] },
            // },
            {
                path: "felicitation",
                component: () => import("pages/client/Congratulations"),
                meta: { auth: "client" },
            },
            {
                path: "magasin",
                component: () => import("pages/client/Store"),
                name: "client.store",
                meta: { auth: "client", icon: "fas fa-store" },
            },
            // {
            //     path: "factures",
            //     component: () => import("pages/client/Invoices"),
            //     name: "client.invoices",
            //     meta: { auth: "client", icon: config.icons["invoice"] },
            // },
            {
                path: "caisse",
                component: () => import("pages/client/Checkout"),
                meta: { auth: "client" },
            },
        ],
    },
    //guest user
    {
        component: () => import("layouts/WelcomeLayout.vue"),
        path: "/jedi/login",
        children: [
            {
                path: "",
                component: () => import("pages/user/Login"),
                name: "user.login",
                meta: { auth: "guest user" },
            },
            {
                path: "/jedi/register",
                component: () => import("pages/user/Register"),
                name: "user.register",
                meta: { auth: "guest user" },
            },
        ],
    },
    //connected user
    {
        component: () => import("layouts/MainLayout.vue"),
        meta: { auth: "user" },
        path: "/jedi/",
        children: [
            {
                path: "",
                component: () => import("pages/user/Dashboard.vue"),
                name: "user.dashboard",
                meta: { auth: "user", icon: "fas fa-chart-line", category: "operations" },
            },
            {
                path: "store",
                component: () => import("src/pages/user/Store.vue"),
                name: "user.store",
                meta: { auth: "user", icon: "fas fa-store", category: "operations" },
            },
            {
                path: "clients",
                component: () => import("src/pages/user/Clients.vue"),
                name: "user.clients",
                meta: { auth: "user", icon: config.icons["client"], category: "operations" },
            },
            {
                path: "calendar",
                component: () => import("pages/user/Calendar.vue"),
                name: "user.calendar",
                meta: { auth: "user", icon: config.icons["calendar"], category: "operations" },
            },
            {
                path: "bookings",
                component: () => import("src/pages/user/Bookings.vue"),
                name: "user.bookings",
                meta: { auth: "user", icon: config.icons["booking"], category: "operations" },
            },
            {
                path: "schedule",
                component: () => import("pages/user/Schedule.vue"),
                name: "user.schedule",
                meta: { auth: "user", icon: config.icons["schedule"], category: "configs" },
            },
            {
                path: "routes",
                component: () => import("pages/user/Routes.vue"),
                name: "user.routes",
                meta: { auth: "user", icon: config.icons["route"], category: "configs" },
            },

            {
                path: "boatCategories",
                component: () => import("pages/user/BoatCategories.vue"),
                name: "user.boatCategories",
                meta: { auth: "user", icon: config.icons["boatCategory"], category: "configs" },
            },
            {
                path: "products",
                component: () => import("pages/user/Products.vue"),
                name: "user.products",
                meta: { auth: "user", icon: config.icons["product"], category: "configs" },
            },
            {
                path: "subscriptions",
                component: () => import("pages/user/Subscriptions.vue"),
                name: "user.subscriptions",
                meta: { auth: "user", icon: config.icons["subscription"], category: "configs" },
            },
            {
                path: "promotions",
                component: () => import("pages/user/Promotions.vue"),
                name: "user.promotions",
                meta: { auth: "user", icon: config.icons["promotion"], category: "configs" },
            },
            {
                path: "activities",
                component: () => import("pages/user/Activities.vue"),
                name: "user.activities",
                meta: { auth: "user", icon: config.icons["activity"], category: "configs" },
            },
            {
                path: "boatInventories",
                component: () => import("pages/user/BoatInventories.vue"),
                name: "user.boatInventories",
                meta: { auth: "user", icon: config.icons["boatInventory"], category: "configs" },
            },
            {
                path: "sailingPlans",
                component: () => import("pages/user/SailingPlans.vue"),
                name: "user.sailingPlans",
                meta: { auth: "user", icon: config.icons["sailingPlan"], category: "operations" },
            },
            {
                path: "stops",
                component: () => import("pages/user/Stops.vue"),
                name: "user.stops",
                meta: { auth: "user", icon: config.icons["stop"], category: "configs" },
            },
            {
                path: "invoices",
                component: () => import("pages/user/Invoices.vue"),
                name: "user.invoices",
                meta: { auth: "user", icon: config.icons["invoice"], category: "operations" },
            },
            {
                path: "pointsOfSale",
                component: () => import("pages/user/PointsOfSale.vue"),
                name: "user.pointsOfSale",
                meta: { auth: "user", icon: config.icons["pointOfSale"], category: "configs" },
            },
            {
                path: "areas",
                component: () => import("pages/user/Areas.vue"),
                name: "user.areas",
                meta: { auth: "user", icon: config.icons["area"], category: "configs" },
            },

            {
                path: "configs",
                component: () => import("src/pages/user/Configs.vue"),
                name: "user.configs",
                meta: { auth: "user", icon: "fas fa-cogs", category: "configs" },
            },

            {
                path: "payments",
                component: () => import("src/pages/user/Payments.vue"),
                name: "user.payments",
                meta: { auth: "user", icon: config.icons["payment"], category: "operations" },
            },
            {
                path: "/square-callback",
                component: () => import("src/pages/user/Store.vue"),
                meta: { auth: "user" },
            },
        ],
    },

    // Always leave this as last one,
    // but you can also remove it
    {
        path: "/:catchAll(.*)*",
        component: () => import("pages/Error404.vue"),
    },
];

export default routes;
