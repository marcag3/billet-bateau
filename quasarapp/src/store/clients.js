import { defineStore } from "pinia";
import { api } from "boot/axios";
import { useAppState } from "./appState";
import { Notify } from "quasar";
import { i18n } from "boot/i18n";
import { useInvoices } from "./invoices";
import { Model } from "./Model";

const { t } = i18n.global;

export class Client extends Model {
    constructor({
        id,
        email,
        firstName,
        name,
        address,
        apartment,
        city,
        postalCode,
        homephone,
        cellphone,
        birthday,
        emergencyContact,
        emergencyPhone,
        note,
        is_guided,
        products_ids,
        subscriptions_ids,
        promotions_ids,
        active_invoice_id,
        initiation_sailing_plan_id,
        identification_card_number,
        identification_card_type,
        wants_to_rent,
        is_profile_complete,
        has_unconfirmed_booking,
        has_product_without_booking,
        is_member,
    } = {}) {
        super();
        this.id = id;
        this.email = email;
        this.firstName = firstName;
        this.name = name;
        this.address = address;
        this.apartment = apartment;
        this.city = city;
        this.postalCode = postalCode;
        this.homephone = homephone;
        this.cellphone = cellphone;
        this.birthday = birthday;
        this.emergencyContact = emergencyContact;
        this.emergencyPhone = emergencyPhone;
        this.note = note;
        this.is_guided = is_guided;
        this.products_ids = products_ids ?? [];
        this.subscriptions_ids = subscriptions_ids ?? [];
        this.promotions_ids = promotions_ids ?? [];
        this.active_invoice_id = active_invoice_id;
        this.initiation_sailing_plan_id = initiation_sailing_plan_id;
        this.identification_card_number = identification_card_number;
        this.identification_card_type = identification_card_type;
        this.wants_to_rent = wants_to_rent;
        this.is_profile_complete = is_profile_complete;
        this.has_unconfirmed_booking = has_unconfirmed_booking;
        this.has_product_without_booking = has_product_without_booking;
        this.is_member = is_member;
    }

    get fullName() {
        return (this.firstName ?? "") + " " + (this.name ?? "");
    }
    get displayName() {
        return this.id + " " + this.fullName + " " + (this.email ?? "");
    }

    static DRIVER_LICENSE = 1;
    static HEALTH_INSURANCE = 2;

    static identificationCardTypeOptions = [
        { label: t("driver_license"), value: Client.DRIVER_LICENSE },
        { label: t("health_insurance"), value: Client.HEALTH_INSURANCE },
    ];
}

export const useClients = defineStore({
    id: "clients",

    state() {
        return {
            url: "clients",
            className: "Client",
            class: Client,
        };
    },

    actions: {
        requestPassPhrase(name) {
            return api.post("/api/request-pass-phrase", {
                email: this.current.email,
                name: name,
            });
        },

        login(passphrase, name) {
            return new Promise((resolve, reject) => {
                const appState = useAppState();

                appState.setLoadingStatus();

                api.post("/api/login", {
                    email: this.current.email,
                    passphrase: passphrase ?? "",
                    name: name ?? "",
                })
                    .then((response) => {
                        this.current = new Client(response.data.data);
                        this.list.push(this.current);
                        appState.setSuccesStatus("client");
                        resolve(response);
                    })
                    .catch((error) => {
                        appState.setErrorStatus();
                        reject(error);
                    });
            });
        },

        loginLink(query) {
            return new Promise((resolve, reject) => {
                const appState = useAppState();

                appState.setLoadingStatus();

                api.get(query.url)
                    .then((response) => {
                        this.current = new Client(response.data.data);
                        this.list.push(this.current);
                        appState.setSuccesStatus("client");
                        resolve(response);
                    })
                    .catch((error) => {
                        appState.setErrorStatus();
                        reject(error);
                    });
            });
        },

        checkLogin() {
            return new Promise((resolve, reject) => {
                const appState = useAppState();

                appState.setLoadingStatus();

                api.get(appState.routePrefix + "check-login")
                    .then((response) => {
                        this.current = new Client(response.data.data);
                        this.list.push(this.current);
                        appState.setSuccesStatus("client");
                        resolve(response);
                    })
                    .catch((error) => {
                        appState.setErrorStatus();

                        reject(error);
                    });
            });
        },

        updateConnected() {
            return new Promise((resolve, reject) => {
                api.patch(useAppState().routePrefix + this.url + "/" + this.current.id, this.current)
                    .then(({ data }) => {
                        this.current = new Client(data.data);
                        Notify.create({
                            color: "positive",
                            icon: "cloud_done",
                            message: t("submitted"),
                        });
                        return resolve();
                    })
                    .catch((error) => {
                        reject(error);
                    });
            });
        },

        register(name) {
            return api.post("/api/register", {
                email: this.current.email,
                name: name,
            });
        },
    },
});
