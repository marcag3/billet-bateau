import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { Quasar, Notify, Dialog } from 'quasar';
import { setCssVar } from 'quasar';
import '@quasar/extras/material-icons/material-icons.css';
import 'quasar/src/css/index.sass';
import '../css/app.scss';
import AppLayout from './layouts/AppLayout.vue';
import router from './router';
import { useAuthStore } from './store/auth.store';
import { bootstrapDomainModels } from './models/model.registry';
import { i18n } from './utilities/i18n';
import { APP_AUTH_EXPIRED_EVENT } from './utilities/events';

const APP_SW_URL = '/app-sw.js';
const APP_SW_SCOPE = '/app/';

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
app.use(i18n);

setCssVar('primary', '#ea1d2c');
setCssVar('secondary', '#00164d');
setCssVar('accent', '#9ca3af');
setCssVar('positive', '#0f766e');
setCssVar('warning', '#b45309');

const authStore = useAuthStore(pinia);

window.addEventListener(APP_AUTH_EXPIRED_EVENT, () => {
    authStore.markAuthExpired();
});

window.addEventListener('online', () => {
    void authStore.revalidateAfterReconnect();
});

await authStore.initialize();

app.mount('#app-root');

if (authStore.canAccessProtectedRoute()) {
    void bootstrapDomainModels();
}

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register(APP_SW_URL, { scope: APP_SW_SCOPE }).catch((error) => {
            console.error('App service worker registration failed:', error);
        });
    });
}
