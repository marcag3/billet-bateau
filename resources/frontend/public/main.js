import { createApp } from 'vue';
import { Quasar } from 'quasar';
import '@quasar/extras/material-icons/material-icons.css';
import 'quasar/src/css/index.sass';
import PublicApp from './PublicApp.vue';
import './public.css';

createApp(PublicApp).use(Quasar).mount('#public-root');
