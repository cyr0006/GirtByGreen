import { createApp } from 'vue';
import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura';
import './style.css';
import App from './App.vue'
import router from './router';

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAgDk1nBaQifhusiJy6reMY8Ko3LEc4aEM",
  authDomain: "fit5032-a1-59a62.firebaseapp.com",
  projectId: "fit5032-a1-59a62",
  storageBucket: "fit5032-a1-59a62.firebasestorage.app",
  messagingSenderId: "982114544701",
  appId: "1:982114544701:web:c6aee8bd45f3a6f74f4e54"
};

// Initialize Firebase
initializeApp(firebaseConfig);

const app = createApp(App);
app.use(PrimeVue, {
    theme: {
        preset: Aura
        
    },
});

app.use(router).mount('#app')
