import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { Quasar } from 'quasar';
import '@quasar/extras/material-icons/material-icons.css';
import 'quasar/src/css/index.sass';
import '../assets/app.scss';
import AppShell from '../AppShell.vue';
import router from '../router';
import { useAuthStore } from '../store/auth.store';
import { bootstrapTodos } from '../store/todos.store';
import { i18n } from '../utilities/i18n';
import { APP_AUTH_EXPIRED_EVENT } from '../utilities/events';

const APP_SW_URL = '/app-sw.js';
const APP_SW_SCOPE = '/app/';

const app = createApp(AppShell);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(Quasar);
app.use(i18n);

const authStore = useAuthStore(pinia);

window.addEventListener(APP_AUTH_EXPIRED_EVENT, () => {
    authStore.markAuthExpired();
});

window.addEventListener('online', () => {
    void authStore.revalidateAfterReconnect();
});

await authStore.initialize();

if (authStore.canAccessProtectedRoute()) {
    void bootstrapTodos();
}

app.mount('#app-root');

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register(APP_SW_URL, { scope: APP_SW_SCOPE }).catch((error) => {
            console.error('App service worker registration failed:', error);
        });
    });
}
