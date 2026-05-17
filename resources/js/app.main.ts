import { createApp } from "vue";
import { createPinia } from "pinia";
import { configure } from "vee-validate";
import { Quasar, Notify, Dialog } from "quasar";
import "@quasar/extras/material-icons/material-icons.css";
import "@quasar/quasar-ui-qcalendar/index.min.css";
import { QCalendarDay, QCalendarMonth } from "@quasar/quasar-ui-qcalendar";
import "leaflet/dist/leaflet.css";
import "quasar/src/css/index.sass";
import "../css/tokens.css";
import "../css/app.css";
import AppLayout from "./layouts/AppLayout.vue";
import router from "./router";
import { useAuthStore } from "./store/auth.store";
import { bootstrapDomainModels } from "./models/model.registry";
import { i18n, syncQuasarLanguageWithI18n } from "./utilities/i18n";
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
    plugins: {
        Notify,
        Dialog,
    },
});
app.component("QCalendarDay", QCalendarDay);
app.component("QCalendarMonth", QCalendarMonth);
app.use(i18n);

await syncQuasarLanguageWithI18n();

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
