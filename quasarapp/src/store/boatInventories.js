import { defineStore } from "pinia";
import { useBoatCategories } from "./boatCategories";
import { Model } from "./Model";

export class BoatInventory extends Model {
    constructor({ id, name, boat_category_id, quantity } = {}) {
        super();
        this.id = id;
        this.name = name;
        this.boat_category_id = boat_category_id;
        this.quantity = quantity;
    }

    get boatCategory() {
        return useBoatCategories().find(this.boat_category_id);
    }

    get displayName() {
        return this.name ? this.name + " (" + this.quantity + " " + this.boatCategory.name + ")" : "";
    }
}

export const useBoatInventories = defineStore({
    id: "boatInventories",

    state() {
        return {
            url: "boat-inventories",
            className: "BoatInventory",
            class: BoatInventory,
        };
    },

    actions: {},
});
