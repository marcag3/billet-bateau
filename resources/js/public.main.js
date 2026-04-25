import { createApp } from 'vue';
import { Quasar } from 'quasar';
import '@quasar/extras/material-icons/material-icons.css';
import 'quasar/src/css/index.sass';
import '../css/public.css';
import publicRouter from './router/public.js';
import PublicEntry from './PublicEntry.vue';
import { i18n } from './utilities/i18n';

const app = createApp(PublicEntry);
app.use(Quasar).use(i18n).use(publicRouter);
app.mount('#public-root');
