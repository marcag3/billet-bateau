import { createApp } from 'vue';
import { Quasar } from 'quasar';
import '@quasar/extras/material-icons/material-icons.css';
import 'quasar/src/css/index.sass';
import '../assets/public.css';
import PublicShell from '../PublicShell.vue';
import { i18n } from '../utilities/i18n';

createApp(PublicShell).use(Quasar).use(i18n).mount('#public-root');
