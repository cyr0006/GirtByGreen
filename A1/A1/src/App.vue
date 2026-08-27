<script setup>
import Navbar from './components/navbar.vue'
</script>

<template>
  <Navbar />
  <main class="w-full block">
    <router-view></router-view>
  </main>
</template>
