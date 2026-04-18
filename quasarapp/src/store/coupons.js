import { defineStore } from "pinia";
import { useClients } from "./clients";
import { Model } from "./Model";
import { usePromotions } from "./promotions";

export class Coupon extends Model {
    constructor({ id, client_id, promotion_id, pass_id, invoice_item_id } = {}) {
        super();
        this.id = id;
        this.client_id = client_id;
        this.promotion_id = promotion_id;
        this.pass_id = pass_id;
        this.invoice_item_id = invoice_item_id;
    }
    get promotion() {
        return usePromotions().find(this.promotion_id);
    }
}

export const useCoupons = defineStore({
    id: "coupons",

    state() {
        return {
            url: "coupons",
            clientUrl: "clients/" + useClients().current.id + "/coupons",
            className: "Coupon",
            class: Coupon,
        };
    },
    actions: {
        async updateRelated(coupon) {
            return useClients().show(coupon.client);
        },
    },
});
