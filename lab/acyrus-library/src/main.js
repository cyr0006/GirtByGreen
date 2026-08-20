import 'bootstrap/dist/css/bootstrap.min.css'
// import 'primevue/resources/primevue.css'        // core styles
import 'primeicons/primeicons.css'              // icons

import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura';
import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App);
app.use(PrimeVue, {
  theme: {
    preset: Aura
  }
})

app.mount('#app')