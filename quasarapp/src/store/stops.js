import { defineStore } from "pinia";
import { Model } from "./Model";

export class Stop extends Model {
    constructor({ id, name, lat, long } = {}) {
        super();
        this.id = id;
        this.name = name;
        this.lat = lat;
        this.long = long;
    }
}

export const useStops = defineStore({
    id: "stops",

    state() {
        return {
            url: "stops",
            className: "Stop",
            class: Stop,
        };
    },

    actions: {},
});
