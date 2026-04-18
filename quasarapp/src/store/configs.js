import { defineStore } from "pinia";
import { Model } from "./Model";

export class Config extends Model {
    constructor({ key, value } = {}) {
        super();
        this.key = key;
        this.value = value;
    }

    static PRIMARY_KEY_NAME = "key";
}

export const useConfigs = defineStore({
    id: "configs",

    state() {
        return {
            url: "configs",
            className: "Config",
            class: Config,
        };
    },
});
