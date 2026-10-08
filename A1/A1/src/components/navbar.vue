<template>
  <div class="w-full">
    <Menubar :model="items">
      <template #start>
        <img src="@/assets/GBG_Logo.png" style="border-radius: 40%" alt="Logo" class="h-8" />
      </template>
      <template #item="{ item, props, hasSubmenu, root }">
        <a v-ripple class="flex items-center px-3 py-2 cursor-pointer gap-2" v-bind="props.action">
          <span class="text-sm">{{ item.label }}</span>
          <Badge v-if="item.badge" :class="root ? '' : 'ms-auto'" :value="item.badge" />
          <!--ADD SOME ITEM.ICON HERE TODO-->
          <span
            v-if="item.shortcut"
            class="ms-auto border border-surface rounded-sm bg-emphasis text-muted-color text-xs p-1"
            >{{ item.shortcut }}</span
          >
          <component :is="root ? 'AngleDown' : 'AngleRight'" v-if="hasSubmenu" class="ms-auto" />
        </a>
      </template>
      <template #end>
        <div class="flex items-center gap-2">
          <InputText placeholder="Search" type="text" class="w-36" />
          <Avatar
            v-if="user"
            :label="avatarInitial(user.displayName, user.email)"
            shape="circle"
            class="cursor-pointer"
            :style="{ backgroundColor: avatarColorFor(user.uid), color: '#ffffff' }"
            @click="toggleProfileMenu"
          />
          <Avatar
            v-else
            :icon="User"
            shape="circle"
            class="cursor-pointer"
            @click="router.push('/SignIn')"
          />
          <Menu ref="profileMenu" :model="profileMenuItems" :popup="true" />
        </div>
      </template>
    </Menubar>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import { getAuth, signOut } from 'firebase/auth'
import { useAuth } from '../composables/useAuth'
import { avatarColorFor, avatarInitial } from '../utils/avatarColor'

//images and icons
import logo from '../assets/GBG_Logo.png'
import Menubar from 'primevue/menubar'
import Menu from 'primevue/menu'
import Badge from 'primevue/badge'
import InputText from 'primevue/inputtext'
import Avatar from 'primevue/avatar'
import Ripple from 'primevue/ripple'
import User from '@primeicons/vue/user'
import Bolt from '@primeicons/vue/bolt'
import HomeIcon from '@primeicons/vue/home'
import Pencil from '@primeicons/vue/pencil'
import Search from '@primeicons/vue/search'
import Server from '@primeicons/vue/server'
import Calendar from '@primeicons/vue/calendar'
import SignInIcon from '@primeicons/vue/sign-in'
import SignOutIcon from '@primeicons/vue/sign-out'
import Sparkles from '@primeicons/vue/sparkles'
import ExclamationTriangle from '@primeicons/vue/exclamation-triangle'

const router = useRouter()
const confirm = useConfirm()
const auth = getAuth()
const { user } = useAuth()

const profileMenu = ref(null)

function toggleProfileMenu(event) {
  profileMenu.value?.toggle(event)
}

function confirmSignOut() {
  confirm.require({
    header: 'Sign Out',
    message: 'Are you sure you want to sign out?',
    icon: ExclamationTriangle,
    acceptLabel: 'Sign Out',
    rejectProps: {
      label: 'Cancel',
      severity: 'secondary',
    },
    accept: () => {
      signOut(auth).then(() => router.push('/'))
    },
  })
}

const profileMenuItems = [
  {
    label: 'Profile',
    icon: User,
    command: () => router.push('/Profile'),
  },
  {
    separator: true,
  },
  {
    label: 'Sign Out',
    icon: SignOutIcon,
    command: confirmSignOut,
  },
]

const items = computed(() => [
  {
    label: 'Home',
    icon: HomeIcon,
    command: () => router.push('/'),
  },
  !user.value
    ? {
        label: 'Sign In',
        icon: SignInIcon,
        command: () => router.push('/SignIn'),
      }
    : null,
  {
    label: 'Events',
    icon: Calendar,
    command: () => router.push('/events'),
  },
  {
    label: 'Community & Events',
    icon: Search,
    badge: 5,
    items: [
      {
        label: 'News',
        icon: Server,
        command: () => router.push('/projects/blocks'),
      },
      {
        separator: true,
      },
      {
        label: 'Vegetation Map',
        icon: Pencil,
        command: () => router.push('/vegetation-map'),
      },
      {
        label: 'Suburb Canopy Data',
        icon: Server,
        command: () => router.push('/suburb-canopy-data'),
      },
      {
        label: 'Click, Read, Plant',
        icon: Bolt,
        command: () => router.push('/ClickReadPlant'),
      },
      {
        label: 'AI Garden Advisor',
        icon: Sparkles,
        command: () => router.push('/my-garden-projects'),
      },
    ],
  },
].filter(Boolean))
</script>
