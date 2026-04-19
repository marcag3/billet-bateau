import { createApp } from 'vue';
import { Quasar } from 'quasar';
import '@quasar/extras/material-icons/material-icons.css';
import 'quasar/src/css/index.sass';
import PublicApp from './PublicApp.vue';
import './public.css';
import { i18n } from '../i18n';

createApp(PublicApp).use(Quasar).use(i18n).mount('#public-root');
