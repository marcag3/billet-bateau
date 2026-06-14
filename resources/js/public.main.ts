import { createApp } from 'vue';
import { initSentry } from './sentry';
import { Quasar } from 'quasar';
import '@quasar/extras/material-icons/material-icons.css';
import 'leaflet/dist/leaflet.css';
import 'quasar/src/css/index.sass';
import '../css/app.css';
import publicRouter from './router/public';
import PublicEntry from './PublicEntry.vue';
import { i18n, syncQuasarLanguageWithI18n } from './utilities/i18n';

const app = createApp(PublicEntry);

initSentry(app);

app.use(Quasar).use(i18n).use(publicRouter);

await syncQuasarLanguageWithI18n();

app.mount('#public-root');
