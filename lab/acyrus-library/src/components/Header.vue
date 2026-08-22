<script setup>
import { ref } from 'vue'
import Menubar from 'primevue/menubar'

const items = ref([
  {
    label: 'Home',
    icon: 'pi pi-home',
    route: '/',
  },
  {
    label: 'about',
    icon: 'pi pi-star',
    route: '/about',
  },
])
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
  </Menubar>
</template>

<style scoped>
a.p-menubar-item-link.active-route {
  background: rgba(59, 130, 246, 0.15);
  color: var(--p-primary-color);
}
</style>
