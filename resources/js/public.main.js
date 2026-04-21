import { createApp } from 'vue';
import { Quasar } from 'quasar';
import '@quasar/extras/material-icons/material-icons.css';
import 'quasar/src/css/index.sass';
import '../css/public.css';
import PublicLayout from './layouts/PublicLayout.vue';
import { i18n } from './utilities/i18n';

createApp(PublicLayout).use(Quasar).use(i18n).mount('#public-root');
