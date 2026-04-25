/// <reference types="vite/client" />

import 'vue-router';

declare module 'vue-router' {
    interface RouteMeta {
        /** Guest-only or auth-only flags use consistent naming. */
        requiresAuth?: boolean;
        guestOnly?: boolean;
        /** Program-scoped sync + workspace shell. */
        requiresSelectedProgram?: boolean;
    }
}

declare module '*.vue' {
    import type { DefineComponent } from 'vue';
    const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>;
    export default component;
}
