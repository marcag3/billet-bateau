import { defineStore } from "pinia";

export const useServerValidations = defineStore({
    id: "serverValidations",

    state() {
        return {
            errors: {},
        };
    },
});
