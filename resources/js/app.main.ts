import { createApp } from "vue";
import { createPinia } from "pinia";
import { configure } from "vee-validate";
import { Quasar, Notify, Dialog } from "quasar";
import { applyAppQuasarTheme } from "./utilities/app-quasar-theme";
import "@quasar/extras/material-icons/material-icons.css";
import "quasar/src/css/index.sass";
import "../css/tokens.css";
import "../css/app.scss";
import AppLayout from "./layouts/AppLayout.vue";
import router from "./router";
import { useAuthStore } from "./store/auth.store";
import { bootstrapDomainModels } from "./models/model.registry";
import { i18n } from "./utilities/i18n";
import { APP_AUTH_EXPIRED_EVENT } from "./utilities/events";

const APP_SW_URL = "/app-sw.js";
const APP_SW_SCOPE = "/app/";

// Vee-validate: single global policy for all forms (override per `useForm` if needed).
configure({
    validateOnBlur: true,
    validateOnChange: false,
    validateOnInput: false,
    validateOnModelUpdate: true,
});

const app = createApp(AppLayout);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(Quasar, {
    config: {
        brand: {
            primary: "#1976d2",
            secondary: "#26A69A",
            accent: "#9C27B0",

            dark: "#1d1d1d",
            "dark-page": "#121212",

            positive: "#21BA45",
            negative: "#C10015",
            info: "#31CCEC",
            warning: "#F2C037",
        },
    },
    plugins: {
        Notify,
        Dialog,
    },
});
app.use(i18n);

applyAppQuasarTheme();

const authStore = useAuthStore(pinia);

window.addEventListener(APP_AUTH_EXPIRED_EVENT, () => {
    authStore.markAuthExpired();
});

window.addEventListener("online", () => {
    void authStore.revalidateAfterReconnect();
});

await authStore.initialize();

app.mount("#app-root");

if (authStore.canAccessProtectedRoute()) {
    void bootstrapDomainModels();
}

if (import.meta.env.PROD && "serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register(APP_SW_URL, { scope: APP_SW_SCOPE })
            .catch((error) => {
                console.error("App service worker registration failed:", error);
            });
    });
}
