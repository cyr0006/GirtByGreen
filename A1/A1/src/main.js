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
app.use(PrimeVue, {
    license: 'eyJpZCI6ImMyMDc5ZjIxLTNiMDMtNDk2Ny1iYmU5LTk4MWJjMTdhYzU2OCIsInByb2R1Y3QiOiJwcmltZXVpIiwidGllciI6ImNvbW11bml0eSIsInR5cGUiOiJkZXYiLCJpYXQiOjE3OTE5NTM3ODksImV4cCI6MTgyMzQ4OTc4OX0.pN1aMQcN61OcjHx6sl9EEo8ngPtOzc3huV35A1yJ37R4KsIEciOQGJmboBAFdp6Tf5TIAQoZTLkjCgBy5yAqDg'
});