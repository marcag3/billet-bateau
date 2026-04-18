import { defineStore } from "pinia";
import { api } from "boot/axios";
import { useAppState } from "./appState";

// useStore could be anything like useUser, useCart
export const useUser = defineStore({
    // unique id of the store across your application
    id: "user",
    state() {
        return {
            id: "",
            email: "",
            name: "",
        };
    },
    actions: {
        login(password, name) {
            return new Promise((resolve, reject) => {
                const appState = useAppState();

                appState.setLoadingStatus();
                api.post(appState.routePrefix + "login", {
                    email: this.email ?? "",
                    password: password ?? "",
                    name: name ?? "",
                })
                    .then((response) => {
                        this.$state = response.data;
                        appState.setSuccesStatus("user");
                        resolve(response);
                    })
                    .catch((error) => {
                        appState.setErrorStatus();
                        reject(error);
                    });
            });
        },

        register(password, password_confirmation, theName) {
            return new Promise((resolve, reject) => {
                const appState = useAppState();

                appState.setLoadingStatus();
                api.post(appState.routePrefix + "register", {
                    email: this.email ?? "",
                    name: this.name ?? "",
                    password: password ?? "",
                    password_confirmation: password_confirmation ?? "",
                    theName: theName ?? "",
                })
                    .then((response) => {
                        this.$state = response.data;
                        appState.setSuccesStatus("user");
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
                        this.$state = response.data;
                        appState.setSuccesStatus("user");
                        resolve(response);
                    })
                    .catch((error) => {
                        appState.setErrorStatus();
                        reject(error);
                    });
            });
        },
    },
});
