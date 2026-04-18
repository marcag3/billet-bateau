import { defineStore } from "pinia";
import { useClients } from "./clients";
import { LocalStorage } from "quasar";
import { api } from "boot/axios";
import { useUser } from "./user";
import { alertError } from "../utilities/helpers";
import _ from "lodash";
import { Cookies } from "quasar";
import { usePointsOfSale } from "./pointsOfSale";

export const useAppState = defineStore({
    id: "appState",

    state() {
        const clients = useClients();

        return {
            paths: {
                reservation: () => (clients.current.has_unconfirmed_booking ? "magasin" : ""),
                magasin: () => (clients.current.is_profile_complete ? "caisse" : "profil"),
                profil: () => (clients.current.active_invoice_id ? "caisse" : "felicitation"),
                caisse: () => "felicitation",
                felicitation: () => (clients.current.has_product_without_reservation ? "reservation" : ""),
            },
            lastBookingId: JSON.parse(localStorage.getItem("lastBookingId")),
            filledForm: JSON.parse(localStorage.getItem("filledForm")),
            paymentCreated: JSON.parse(localStorage.getItem("paymentCreated")),
            rightDrawerOpen: false,
            guard: LocalStorage.getItem("guard") || "",
            expires: LocalStorage.getItem("expires") || "",
            status: "",
            hasCSRF: false,
            requestedRoute: null,
            isDev: process.env.DEV ? true : env === "local",
            thisPointOfSaleId: Cookies.get("point_of_sale_id"),
            noPagePadding: false,
        };
    },
    getters: {
        authGuard() {
            return this.expires > _.now() ? this.guard : "";
        },
        authName() {
            if (this.guard === "client") {
                const clients = useClients();
                return clients.current.fullName;
            } else if (this.guard === "user") {
                const user = useUser();
                return user.name;
            }
        },
        routePrefix() {
            return this.guard === "client" ? "api/" : "user-api/";
        },
        thisPointOfSale() {
            return usePointsOfSale().find(this.thisPointOfSaleId);
        },
    },

    actions: {
        nextStep(currentRoute) {
            if (this.paths[currentRoute]) return this.paths[currentRoute]();
        },
        resetState() {
            this.lastBookingId = null;
            this.filledForm = null;
            this.paymentCreated = null;
            this.noPagePadding = false;
        },
        async initialyze(route) {
            if (!route.meta.auth) return;
            if (!this.hasCSRF) {
                if (!route.meta.auth.includes("guest")) {
                    this.requestedRoute = route.fullPath;
                }
                await this.getCSRF();
                //validate that we are really authenticated on the server
                if (route.meta.auth.includes("client")) {
                    this.guard = "client";
                    await useClients()
                        .checkLogin()
                        .catch((e) => e);
                } else {
                    this.guard = "user";
                    await useUser()
                        .checkLogin()
                        .catch((e) => e);
                }
            }
        },
        getCSRF() {
            return new Promise((resolve, reject) => {
                api.get("/sanctum/csrf-cookie")
                    .then(() => {
                        this.hasCSRF = true;
                        resolve();
                    })
                    .catch((error) => {
                        alertError(error);
                    });
            });
        },

        setLoadingStatus() {
            this.status = "succes";
        },

        setSuccesStatus(guard) {
            this.status = "succes";
            this.guard = guard;
            // LocalStorage.set("guard", guard);
            const expires = new Date().getTime() + 200 * 60 * 1000;
            this.expires = expires;
            // LocalStorage.set("expires", expires);
        },

        setErrorStatus() {
            this.status = "error";
            this.guard = "";
            // LocalStorage.remove("guard");
            this.expires = null;
            // LocalStorage.remove("expires");
        },

        logout() {
            return new Promise((resolve) => {
                this.status = "loading";
                LocalStorage.clear();
                api.post(this.routePrefix + "logout")
                    .then(() => {
                        resolve();
                    })
                    .catch((error) => {})
                    .finally(() => {
                        window.location.reload();
                    });
            });
        },
    },
});
