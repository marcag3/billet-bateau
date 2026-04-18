import { defineStore } from "pinia";
import { i18n } from "src/boot/i18n";
import { useBoatCategories } from "./boatCategories";
import { Model } from "./Model";
import { usePointsOfSale } from "./pointsOfSale";

const { t } = i18n.global;
export class Product extends Model {
    constructor({
        id,
        name,
        price,
        boat_category_id,
        duration,
        is_rental,
        is_initiation,
        required_subscription_id,
        required_products_id,
        replace_products_id,
        max_passenger,
        is_taxable,
        is_child,
        is_teen,
        is_adult,
        available_points_of_sale_ids,
        is_full_boat,
    } = {}) {
        super();
        this.id = id;
        this.name = name;
        this.price = price;
        this.boat_category_id = boat_category_id;
        this.duration = duration;
        this.is_rental = is_rental;
        this.is_initiation = is_initiation;
        this.required_subscription_id = required_subscription_id;
        this.required_products_id = required_products_id;
        this.replace_products_id = replace_products_id;
        this.max_passenger = max_passenger;
        this.is_taxable = is_taxable;
        this.is_child = is_child;
        this.is_teen = is_teen;
        this.is_adult = is_adult;
        this.available_points_of_sale_ids = available_points_of_sale_ids ?? [];
        this.is_full_boat = is_full_boat;
    }
    get boatCategory() {
        return useBoatCategories().find(this.boat_category_id);
    }

    get displayName() {
        return this.name + (!!this.duration ? " (" + this.formatDuration("duration", "minutes") + ")" : "");
    }

    get pointsOfSale() {
        if (this.available_points_of_sale_ids.length == 0) return [];
        return usePointsOfSale().list.filter((pos) => this.available_points_of_sale_ids.includes(pos.id));
    }

    get displayAvailable() {
        return this.pointsOfSale.map((pos) => pos.name).join(", ");
    }

    get displayMaxPassenger() {
        return t("person", this.max_passenger);
    }

    //for store
    get type() {
        return "App\\Product";
    }
}

export const useProducts = defineStore({
    id: "products",

    state() {
        return {
            url: "products",
            className: "Product",
            class: Product,
        };
    },
});
