/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/vanillajs" />

import "vue-router";

declare module "vue-router" {
    interface RouteMeta {
        /** Guest-only or auth-only flags use consistent naming. */
        requiresAuth?: boolean;
        guestOnly?: boolean;
        /** Program-scoped sync + workspace shell. */
        requiresSelectedProgram?: boolean;
        /** Edit / Control / Check-in shell under a program. */
        programContext?: "edit" | "control" | "checkin";
    }
}

declare module "*.vue" {
    import type { DefineComponent } from "vue";
    const component: DefineComponent<
        Record<string, unknown>,
        Record<string, unknown>,
        unknown
    >;
    export default component;
}
