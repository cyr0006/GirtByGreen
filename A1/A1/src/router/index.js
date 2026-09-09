import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import SignIn from '../views/SignIn.vue'
import Events from '../views/Events.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/sign-in',
    name: 'SignIn',
    component: SignIn,
  },
  {
    path: '/events',
    name: 'Events',
    component: Events,
  },
  {path: "/FireLogin",
    name : "FireLogin",
    component: SignIn
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router