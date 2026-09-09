<script setup>
import Navbar from './components/navbar.vue'
import ConfirmDialog from 'primevue/confirmdialog'
</script>

<template>
  <Navbar />
  <ConfirmDialog />
  <main class="w-full block">
    <router-view></router-view>
  </main>
</template>
