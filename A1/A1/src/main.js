import PrimeVue from 'primevue/config';
import Nora from '@primeuix/themes/nora';
import { createApp } from 'vue';

import App from './App.vue'


const app = createApp(App);
app.use(PrimeVue, {
    theme: {
        preset: Nora
    },

});

app.mount('#app')
