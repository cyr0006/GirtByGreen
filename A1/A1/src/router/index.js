import { createRouter, createWebHistory } from 'vue-router'
import { watch } from 'vue'
import Home from '../views/Home.vue'
import SignIn from '../views/SignIn.vue'
import FirebaseRegister from '../views/FirebaseRegister.vue'
import Events from '../views/Events.vue'
import ClickReadPlant from '../views/ClickReadPlant.vue'
import Profile from '../views/Profile.vue'
import { useAuth } from '../composables/useAuth'

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
  },
  {
    path: '/Profile',
    name: 'Profile',
    component: Profile,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

const guestOnlyRoutes = ['SignIn', 'FireRegister']
const authOnlyRoutes = ['Profile']

async function waitForAuthReady() {
  const { ready } = useAuth()
  if (ready.value) return
  await new Promise((resolve) => {
    const stop = watch(ready, (isReady) => {
      if (isReady) {
        stop()
        resolve()
      }
    })
  })
}

// Keep an already-signed-in user off the login/register forms (e.g. after
// using the back button, or opening a bookmarked /SignIn link) by bouncing
// them to the home page instead, and keep signed-out visitors off pages
// that require an account (e.g. Profile).
router.beforeEach(async (to) => {
  if (!guestOnlyRoutes.includes(to.name) && !authOnlyRoutes.includes(to.name)) return true

  await waitForAuthReady()
  const { user } = useAuth()

  if (guestOnlyRoutes.includes(to.name) && user.value) return '/'
  if (authOnlyRoutes.includes(to.name) && !user.value) return '/SignIn'
  return true
})

export default router