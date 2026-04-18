import { defineStore } from "pinia";
import { Model } from "./Model";
import { useUsers } from "./users";
import { i18n } from "boot/i18n";
import { Client, useClients } from "./clients";
import { InvoicePayment, useInvoices } from "./invoices";

const { t } = i18n.global;

export class Payment extends Model {
    constructor({ id, method, payment_date, note, user_id, invoice_payments } = {}) {
        super();
        this.id = id;
        this.method = method;
        this.payment_date = payment_date;
        this.note = note;
        this.user_id = user_id;
        this.invoice_payments = invoice_payments
            ? invoice_payments.map((invoicePayment) => new InvoicePayment(invoicePayment))
            : [];
    }

    get user() {
        return useUsers().find(this.user_id);
    }

    get totalAmount() {
        return this.invoice_payments.reduce((sum, InvoicePayment) => (sum += Number(InvoicePayment.amount)), 0);
    }

    get client() {
        if (this.invoice_payments.length !== 1) return new Client();
        return this.invoice_payments[0].invoice.client;
    }
    get invoices() {
        return this.invoice_payments.map(({ invoice }) => invoice);
    }

    get displayName() {
        return (
            this.id +
            " " +
            this.formatOption("method") +
            " " +
            this.formatMoney("totalAmount") +
            " " +
            this.formatDate("payment_date") +
            " " +
            this.client.fullName
        );
    }

    static CASH = 1;
    static CARD = 2;
    static INTERNET = 3;
    static SQUARE = 4;

    static methodOptions = [
        { label: t("cash"), value: this.CASH },
        { label: t("card"), value: this.CARD },
        { label: t("internet"), value: this.INTERNET },
    ];
    static methodOptionsUser = [
        { label: t("cash"), value: this.CASH },
        { label: t("card"), value: this.CARD },
        { label: t("square"), value: this.SQUARE },
    ];
}

export const usePayments = defineStore({
    id: "payments",

    state() {
        const clients = useClients();
        const invoices = useInvoices();
        return {
            url: "payments",
            clientUrl: "clients/" + clients.current.id + "/invoices/" + invoices.current.id + "/payments",
            className: "Payment",
            class: Payment,
        };
    },

    actions: {
        async updateRelated(payment) {
            payment.invoices.forEach((invoice) => useInvoices().show(invoice));
        },
    },
});
