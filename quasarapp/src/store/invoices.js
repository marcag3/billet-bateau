import { defineStore } from "pinia";
import { useClients } from "./clients";
import { Model } from "./Model";
import { useUsers } from "./users";
import { i18n } from "boot/i18n";
import { usePayments } from "./payments";
import { useProducts } from "./products";
import { useSubscriptions } from "./subscriptions";
import { usePromotions } from "./promotions";
import { usePointsOfSale } from "./pointsOfSale";
import config from "src/config.json";
import { api } from "src/boot/axios";
import { dateToDateTimeString } from "src/utilities/helpers";
import { useAppState } from "./appState";

const { t } = i18n.global;

export class Invoice extends Model {
    constructor({
        id,
        client_id,
        clientName,
        user_id,
        invoice_date,
        taxable_subtotal,
        non_taxable_subtotal,
        tps,
        tvq,
        total,
        status,
        due_amount,
        invoice_items,
        invoice_payments,
        point_of_sale_id,
        sent_at,
    } = {}) {
        super();
        this.id = id;
        this.client_id = client_id;
        this.clientName = clientName;
        this.user_id = user_id;
        this.invoice_date = invoice_date ?? dateToDateTimeString(new Date());
        this.taxable_subtotal = taxable_subtotal;
        this.non_taxable_subtotal = non_taxable_subtotal;
        this.tps = tps;
        this.tvq = tvq;
        this.total = total;
        this.status = status ?? Invoice.DRAFT;
        this.due_amount = due_amount;
        this.sent_at = sent_at;
        this.point_of_sale_id = point_of_sale_id ?? useAppState().thisPointOfSaleId;
        this.invoice_items = invoice_items ? invoice_items.map((item) => new InvoiceItem(item)) : [];
        this.invoice_payments = invoice_payments
            ? invoice_payments.map((invoicePayment) => new InvoicePayment(invoicePayment))
            : [];
    }

    get displayName() {
        return (
            this.id +
            " " +
            this.client.fullName +
            " " +
            this.formatDate("invoice_date") +
            " " +
            t("due_amount") +
            ": " +
            this.formatMoney("due_amount")
        );
    }

    get isDraft() {
        return this.status === Invoice.DRAFT;
    }

    get client() {
        return useClients().find(this.client_id);
    }

    get user() {
        return useUsers().find(this.user_id);
    }

    static DRAFT = 1;
    static CONFIRMED = 2;

    static statusOptions = [
        { label: t("draft"), value: Invoice.DRAFT },
        { label: t("confirmed"), value: Invoice.CONFIRMED },
    ];

    get totalNumberOfItems() {
        return this.invoice_items.reduce((count, invoiceItem) => count + invoiceItem.number_of_items, 0);
    }
    get pointOfSale() {
        return usePointsOfSale().find(this.point_of_sale_id);
    }

    get subscriptionsIds() {
        return this.invoice_items
            .filter((item) => item.itemable_type === "App\\Subscription")
            .map((item) => item.itemable_id);
    }

    get addedPromotionsIds() {
        return this.invoice_items
            .filter((item) => item.itemable_type === "App\\Subscription")
            .map((item) => item.itemable.add_promotion_id);
    }

    get promotionsIds() {
        return this.invoice_items
            .filter((item) => item.itemable_type === "App\\Promotion")
            .map((item) => item.itemable_id);
    }

    get calculatedTotal() {
        return this.invoice_items.reduce(
            (total, invoice_item) => total + invoice_item.number_of_items * Number(invoice_item.price),
            0
        );
    }

    addInvoiceItem(itemable_id, itemable_type) {
        const item = this.invoice_items.find(
            (invoiceItem) => invoiceItem.itemable_type === itemable_type && invoiceItem.itemable_id === itemable_id
        );

        if (item === undefined)
            this.invoice_items.push(new InvoiceItem({ itemable_type, itemable_id, number_of_items: 1 }));
        else item.number_of_items++;
    }

    removeInvoiceItem(itemable_id, itemable_type) {
        const itemIndex = this.invoice_items.findIndex(
            (invoiceItem) => invoiceItem.itemable_type === itemable_type && invoiceItem.itemable_id === itemable_id
        );
        if (itemIndex === -1) return;

        const item = this.invoice_items[itemIndex];
        if (item.number_of_items > 1) item.number_of_items--;
        else if (item.number_of_items === 1) this.invoice_items.splice(itemIndex, 1);
    }
}

export class InvoiceItem extends Model {
    constructor({ id, itemable_id, itemable_type, price, is_taxable, number_of_items } = {}) {
        super();
        this.id = id;
        this.itemable_id = itemable_id;
        this.itemable_type = itemable_type;
        this.price = price;
        this.is_taxable = is_taxable;
        this.number_of_items = number_of_items;
    }

    get multiplePrice() {
        return this.price * this.number_of_items;
    }

    get invoice() {
        return useInvoices().find(this.invoice_id);
    }

    get itemable() {
        if (this.itemable_type === "App\\Product") {
            return useProducts().find(this.itemable_id);
        } else if (this.itemable_type === "App\\Subscription") {
            return useSubscriptions().find(this.itemable_id);
        } else if (this.itemable_type === "App\\Promotion") {
            return usePromotions().find(this.itemable_id);
        }
    }
    set itemable(itemable) {
        if (itemable === null) {
            this.itemable_id = null;
            this.itemable_type = null;
        } else {
            this.itemable_id = itemable.id;
            this.itemable_type = itemable.type;
        }
    }
}

export class InvoicePayment extends Model {
    constructor({ id, invoice_id, payment_id, amount } = {}) {
        super();
        this.id = id;
        this.invoice_id = invoice_id;
        this.payment_id = payment_id;
        this.amount = amount;
    }

    get invoice() {
        return useInvoices().find(this.invoice_id);
    }

    get payment() {
        return usePayments().find(this.payment_id);
    }
}

export const useInvoices = defineStore({
    id: "invoices",

    state() {
        return {
            url: "invoices",
            clientUrl: "clients/" + useClients().current.id + "/invoices",
            className: "Invoice",
            class: Invoice,
        };
    },

    actions: {
        printInvoice(invoice) {
            window.open(useAppState().baseURL + "/invoices/" + invoice.id);
        },
        sendInvoice(invoice) {
            this.isLoading = true;
            return new Promise((resolve, reject) => {
                api.post("user-api/invoices/" + invoice.id + "/send")
                    .then((response) => {
                        const modelIndex = this.list.findIndex((item) => item.primaryKey === invoice.primaryKey);
                        let data = response.data.data;

                        this.list[modelIndex] = new Invoice(data);
                        this.updateLists();
                        this.isLoading = false;
                        resolve(this.list[modelIndex]);
                    })
                    .catch((error) => {
                        this.isLoading = false;
                        // alertError(error);
                        reject(error);
                    });
            });
        },
        async updateRelated(invoice) {
            return useClients().show(invoice.client);
        },
    },
});
