import { defineStore } from 'pinia';

export type AppPageLayoutRuntimeOverrides = {
    /** Optional future: sync document title from i18n key */
    documentTitleKey?: string;
};

export const useAppLayoutStore = defineStore('appLayout', {
    state: () => ({
        /**
         * Set by program context layout wrappers while mounted (e.g. whether the header
         * program switcher may change `programId` in place). Null when not under a context layout.
         */
        layoutAllowsInPlaceProgramIdSwitch: null as boolean | null,
        pageLayoutOverrides: null as AppPageLayoutRuntimeOverrides | null,
    }),
    getters: {
        allowsInPlaceProgramIdSwitch: (state): boolean => state.layoutAllowsInPlaceProgramIdSwitch === true,
    },
    actions: {
        setLayoutAllowsInPlaceProgramIdSwitch(value: boolean) {
            this.layoutAllowsInPlaceProgramIdSwitch = value;
        },
        clearLayoutAllowsInPlaceProgramIdSwitch() {
            this.layoutAllowsInPlaceProgramIdSwitch = null;
        },
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
