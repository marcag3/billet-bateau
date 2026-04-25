import { createApp } from 'vue';
import { Quasar } from 'quasar';
import { setCssVar } from 'quasar';
import '@quasar/extras/material-icons/material-icons.css';
import 'quasar/src/css/index.sass';
import '../css/public.css';
import publicRouter from './router/public.js';
import PublicEntry from './PublicEntry.vue';
import { i18n } from './utilities/i18n';

const app = createApp(PublicEntry);
app.use(Quasar).use(i18n).use(publicRouter);

setCssVar('primary', '#ea1d2c');
setCssVar('secondary', '#00164d');
setCssVar('accent', '#9ca3af');
setCssVar('positive', '#0f766e');
setCssVar('warning', '#b45309');

app.mount('#public-root');
