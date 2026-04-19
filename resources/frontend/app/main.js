import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { Quasar } from 'quasar';
import '@quasar/extras/material-icons/material-icons.css';
import 'quasar/src/css/index.sass';
import './styles/app.scss';
import AppRoot from './AppRoot.vue';
import router from './router';
import { bootstrapTodosSync } from './sync/useTodosSync';

const app = createApp(AppRoot);

//TODO: this won't scale with multiple models
void bootstrapTodosSync();

app.use(createPinia());
app.use(router);
app.use(Quasar);
app.mount('#app-root');

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/app-sw.js', { scope: '/app/' }).catch((error) => {
            console.error('App service worker registration failed:', error);
        });
    });
}
