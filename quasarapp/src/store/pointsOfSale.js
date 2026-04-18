import { defineStore } from "pinia";
import { i18n } from "boot/i18n";
import { Model } from "./Model";
import { useAreas } from "./areas";
import { useAppState } from "./appState";

const { t } = i18n.global;

export class PointOfSale extends Model {
    constructor({ id, name, cookie, area_id, is_for_client, square_location_id } = {}) {
        super();
        this.id = id;
        this.name = name;
        this.cookie = cookie;
        this.area_id = area_id;
        this.is_for_client = is_for_client;
        this.square_location_id = square_location_id;
    }

    get area() {
        return useAreas().find(this.area_id);
    }
    get displayName() {
        return useAppState().guard === "client" ? this.area.name : this.name + " (" + this.area.name + ")";
    }
}

export const usePointsOfSale = defineStore({
    id: "pointsOfSale",

    state() {
        return {
            url: "points-of-sale",
            className: "PointOfSale",
            class: PointOfSale,
        };
    },
});
