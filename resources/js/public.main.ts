import { createApp } from 'vue';
import { Quasar } from 'quasar';
import { applyAppQuasarTheme } from './utilities/app-quasar-theme';
import '@quasar/extras/material-icons/material-icons.css';
import 'quasar/src/css/index.sass';
import '../css/public.css';
import publicRouter from './router/public';
import PublicEntry from './PublicEntry.vue';
import { i18n } from './utilities/i18n';

const app = createApp(PublicEntry);
app.use(Quasar).use(i18n).use(publicRouter);

applyAppQuasarTheme();

app.mount('#public-root');
