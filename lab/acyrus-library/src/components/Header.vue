<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import Menubar from 'primevue/menubar'
import Button from 'primevue/button'
import User from '@primeicons/vue/user'
import { useAuth } from '../stores/auth'

const router = useRouter()
const { isLoggedIn, logout } = useAuth()

const items = computed(() => {
  const base = [
    {
      label: 'Home',
      icon: 'pi pi-home',
      route: '/',
    },
  ]
  if (isLoggedIn.value) {
    base.push({
      label: 'about',
      icon: 'pi pi-star',
      route: '/about',
    })
  }
  return base
})

const handleLogout = () => {
  logout()
  router.push('/login')
}
</script>
<template>
  <Menubar :model="items">
    <template #item="{ item, props, hasSubmenu }">
      <router-link
        v-if="item.route"
        :to="item.route"
        v-slot="{ href, navigate, isExactActive }"
        custom
      >
        <a
          v-ripple
          :href="href"
          v-bind="props.action"
          @click="navigate"
          :class="{ 'active-route': isExactActive }"
        >
          <span :class="item.icon" />
          <span class="ml-2">{{ item.label }}</span>
        </a>
      </router-link>
      <a v-else v-ripple :href="item.url" :target="item.target" v-bind="props.action">
        <span :class="item.icon" />
        <span class="ml-2">{{ item.label }}</span>
      </a>
    </template>
    <template #end>
      <Button
        v-if="isLoggedIn"
        label="Log out"
        icon="pi pi-sign-out"
        @click="handleLogout"
      />
      <Button v-else label="Log In" icon="pi pi-user" @click="$router.push('/login')" />
    </template>
  </Menubar>
</template>

<style scoped>
a.p-menubar-item-link.active-route {
  background: rgba(59, 130, 246, 0.15);
  color: var(--p-primary-color);
}
</style>
