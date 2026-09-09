import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import SignIn from '../views/SignIn.vue'
import FirebaseRegister from '../views/FirebaseRegister.vue'
import Events from '../views/Events.vue'
import ClickReadPlant from '../views/ClickReadPlant.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/events',
    name: 'Events',
    component: Events,
  },
  {path: "/SignIn",
    name : "SignIn",
    component: SignIn
  },
  {
    path: "/FireRegister",
    name : "FireRegister",
    component: FirebaseRegister
  },
  {
    path: '/ClickReadPlant',
    name: 'ClickReadPlant',
    component: ClickReadPlant,
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router