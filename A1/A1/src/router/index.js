import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import LogIn from '../views/Log In.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/login',
    name: 'Login',
    component: LogIn,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router