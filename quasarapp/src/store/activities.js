import { defineStore } from "pinia";
import { i18n } from "boot/i18n";
import { Model } from "./Model";

const { locale } = i18n.global;

export class Activity extends Model {
    constructor({ id, name, description_fr, description_en, rules_fr, rules_en } = {}) {
        super();
        this.id = id;
        this.name = name;
        this.description_fr = description_fr;
        this.description_en = description_en;
        this.rules_fr = rules_fr;
        this.rules_en = rules_en;
    }

    get description() {
        return locale === "en-US" ? this.description_en : this.description_fr;
    }

    get rules() {
        return locale === "en-US" ? this.rules_en : this.rules_fr;
    }
}

export const useActivities = defineStore({
    id: "activities",

    state() {
        return {
            url: "activities",
            className: "Activity",
            class: Activity,
        };
    },

    actions: {},
});
