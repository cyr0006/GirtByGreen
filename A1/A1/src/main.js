import './firebase';
import { createApp } from 'vue';
import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';
import Aura from '@primeuix/themes/aura';
import './style.css';
import App from './App.vue'
import router from './router';

const app = createApp(App);
app.use(PrimeVue, {
    theme: {
        preset: Aura

    },
});
app.use(ConfirmationService);

app.use(router).mount('#app')
