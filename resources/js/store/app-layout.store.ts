import { defineStore } from "pinia";

export type AppPageLayoutRuntimeOverrides = {
    /** Optional future: sync document title from i18n key */
    documentTitleKey?: string;
};

export const useAppLayoutStore = defineStore("appLayout", {
    state: () => ({
        pageLayoutOverrides: null as AppPageLayoutRuntimeOverrides | null,
    }),
    actions: {
        setPageLayoutOverrides(overrides: AppPageLayoutRuntimeOverrides) {
            this.pageLayoutOverrides = {
                ...(this.pageLayoutOverrides ?? {}),
                ...overrides,
            };
        },
        clearPageLayoutOverrides() {
            this.pageLayoutOverrides = null;
        },
    },
});
