import { defineStore } from "pinia";
import { i18n } from "src/boot/i18n";
import { useClients } from "./clients";
import { Model } from "./Model";
import { useProducts } from "./products";
const { t } = i18n.global;
export class Promotion extends Model {
    constructor({
        id,
        name,
        value,
        is_percentage,
        products_id,
        is_on_client,
        code,
        start_date,
        end_date,
        is_on_invoice_total,
        available_points_of_sale_ids,
    } = {}) {
        super();
        this.id = id;
        this.name = name;
        this.value = value;
        this.is_percentage = is_percentage;
        this.products_id = products_id ?? [];
        this.is_on_client = is_on_client;
        this.code = code;
        this.start_date = start_date;
        this.end_date = end_date;
        this.is_on_invoice_total = is_on_invoice_total;
        this.available_points_of_sale_ids = available_points_of_sale_ids ?? [];
    }

    get products() {
        if (this.products_id.length == 0) return [];
        return useProducts().list.filter((product) => this.products_id.includes(product.id));
    }

    get displayProducts() {
        return this.products.map((product) => product.name).join(", ");
    }

    get pointsOfSale() {
        if (this.available_points_of_sale_ids.length == 0) return [];
        return usePointsOfSale().list.filter((pos) => this.available_points_of_sale_ids.includes(pos.id));
    }

    get displayAvailable() {
        return this.pointsOfSale.map((pos) => pos.name).join(", ");
    }

    get displayValue() {
        return this.is_percentage ? this.value + " %" : this.value + " $";
    }
    //for store
    get type() {
        return "App\\Promotion";
    }
}

export const usePromotions = defineStore({
    id: "promotions",

    state() {
        return {
            url: "promotions",
            className: "Promotion",
            class: Promotion,
        };
    },
});
