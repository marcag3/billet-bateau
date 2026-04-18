import { defineStore } from "pinia";
import { i18n } from "src/boot/i18n";
import { dateToDateString } from "src/utilities/helpers";
import { useClients } from "./clients";
import { Model } from "./Model";
import { useSubscriptions } from "./subscriptions";

const { t } = i18n.global;
export class Pass extends Model {
    constructor({ id, subscription_id, client_id, expiry_date, invoice_item_id } = {}) {
        super();
        this.id = id;
        this.subscription_id = subscription_id;
        this.client_id = client_id;
        this.expiry_date = expiry_date;
        this.invoice_item_id = invoice_item_id;
    }

    get client() {
        return useClients().find(this.client_id);
    }
    get subscription() {
        return useSubscriptions().find(this.subscription_id);
    }
    get displayExpiryDate() {
        return t("expiry_date") + ": " + this.formatExpiryDate;
    }
    get formatExpiryDate() {
        return dateToDateString(this.expiry_date);
    }
    get displayName() {
        return this.subscription.displayName + " " + t("of") + " " + this.client.fullName;
    }
    get type() {
        return "Pass";
    }
}

export const usePasses = defineStore({
    id: "passes",

    state() {
        return {
            url: "passes",
            clientUrl: "clients/" + useClients().current.id + "/passes",
            className: "Pass",
            class: Pass,
        };
    },
    actions: {
        async updateRelated(pass) {
            return useClients().show(pass.client);
        },
    },
});
