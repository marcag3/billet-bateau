import { defineStore } from "pinia";
import { i18n } from "src/boot/i18n";
import { useClients } from "./clients";
import { Model } from "./Model";
import { useProducts } from "./products";

const { t } = i18n.global;

export class Ticket extends Model {
    constructor({ id, client_id, product_id, invoice_item_id, remaining_uses, booking_id } = {}) {
        super();
        this.id = id;
        this.client_id = client_id;
        this.product_id = product_id;
        this.invoice_item_id = invoice_item_id;
        this.remaining_uses = remaining_uses;
        this.booking_id = booking_id;
    }

    get client() {
        return useClients().find(this.client_id);
    }

    get product() {
        return useProducts().find(this.product_id);
    }

    get displayRemainingUses() {
        return t("display_remaining_uses", this.remaining_uses);
    }

    get displayName() {
        return this.product.displayName + " " + t("of") + " " + this.client.fullName;
    }
    get type() {
        return "Ticket";
    }
}

export const useTickets = defineStore("tickets", {
    state() {
        return {
            url: "tickets",
            clientUrl: "clients/" + useClients().current.id + "/tickets",
            client_id: useClients().current.id,
            className: "Ticket",
            class: Ticket,
        };
    },
    actions: {
        async updateRelated(ticket) {
            return useClients().show(ticket.client);
        },
    },
});
