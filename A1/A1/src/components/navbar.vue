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
          <Avatar icon="User" shape="circle" />
        </div>
      </template>
    </Menubar>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

//images and icons
import logo from '../assets/GBG_Logo.png'
import Menubar from 'primevue/menubar'
import Badge from 'primevue/badge'
import InputText from 'primevue/inputtext'
import Avatar from 'primevue/avatar'
import Ripple from 'primevue/ripple'
import AngleDown from '@primeicons/vue/angle-down'
import User from '@primeicons/vue/user'
import Bolt from '@primeicons/vue/bolt'
import HomeIcon from '@primeicons/vue/home'
import Pencil from '@primeicons/vue/pencil'
import Search from '@primeicons/vue/search'
import Server from '@primeicons/vue/server'
import Calendar from '@primeicons/vue/calendar'

const router = useRouter()

const items = ref([
  {
    label: 'Home',
    icon: HomeIcon,
    command: () => router.push('/'),
  },
  {
    label: 'Sign In',
    icon: AngleDown,
    command: () => router.push('/SignIn'),
  },
  {
    label: 'Events',
    icon: Calendar,
    command: () => router.push('/events'),
  },
  {
    label: 'Community & Events',
    icon: Search,
    badge: 3,
    items: [
      {
        label: 'Click, Read, Plant',
        icon: Bolt,
        command: () => router.push('/ClickReadPlant'),
      },
      {
        label: 'News',
        icon: Server,
        command: () => router.push('/projects/blocks'),
      },
      {
        separator: true,
      },
      {
        label: 'Canpy Map',
        icon: Pencil,
        command: () => router.push('/projects/ui-kit'),
      },
    ],
  },
])
</script>
