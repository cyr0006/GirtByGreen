import { createRouter, createWebHistory } from 'vue-router'
import { watch } from 'vue'
import Home from '../views/Home.vue'
import SignIn from '../views/SignIn.vue'
import FirebaseRegister from '../views/FirebaseRegister.vue'
import Events from '../views/Events.vue'
import ClickReadPlant from '../views/ClickReadPlant.vue'
import Profile from '../views/Profile.vue'
import VegetationMap from '../views/VegetationMap.vue'
import SuburbCanopyData from '../views/SuburbCanopyData.vue'
import GardenProjects from '../views/GardenProjects.vue'
import GardenProjectChat from '../views/GardenProjectChat.vue'
import CommunityImpact from '../views/CommunityImpact.vue'
import AdminDashboard from '../views/AdminDashboard.vue'
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
  {
    path: '/vegetation-map',
    name: 'VegetationMap',
    component: VegetationMap,
  },
  {
    path: '/suburb-canopy-data',
    name: 'SuburbCanopyData',
    component: SuburbCanopyData,
  },
  {
    path: '/my-garden-projects',
    name: 'GardenProjects',
    component: GardenProjects,
  },
  {
    path: '/my-garden-projects/:id',
    name: 'GardenProjectChat',
    component: GardenProjectChat,
  },
  {
    path: '/community-impact',
    name: 'CommunityImpact',
    component: CommunityImpact,
  },
  {
    path: '/admin-dashboard',
    name: 'AdminDashboard',
    component: AdminDashboard,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

const guestOnlyRoutes = ['SignIn', 'FireRegister']
const authOnlyRoutes = ['Profile', 'GardenProjects', 'GardenProjectChat', 'CommunityImpact']
const adminOnlyRoutes = ['AdminDashboard']

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
  if (
    !guestOnlyRoutes.includes(to.name) &&
    !authOnlyRoutes.includes(to.name) &&
    !adminOnlyRoutes.includes(to.name)
  )
    return true

  await waitForAuthReady()
  const { user, isAdmin } = useAuth()

  if (guestOnlyRoutes.includes(to.name) && user.value) return '/'
  if (authOnlyRoutes.includes(to.name) && !user.value) return '/SignIn'
  if (adminOnlyRoutes.includes(to.name)) {
    if (!user.value) return '/SignIn'
    if (!isAdmin.value) return '/'
  }
  return true
})

export default router