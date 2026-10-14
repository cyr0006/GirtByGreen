<script setup>
import Navbar from './components/navbar.vue'
import ConfirmDialog from 'primevue/confirmdialog'
</script>

<template>
  <a href="#main-content" class="skip-link">Skip to main content</a>
  <Navbar />
  <ConfirmDialog />
  <main id="main-content" class="w-full block" tabindex="-1">
    <router-view></router-view>
  </main>
</template>

<style scoped>
.skip-link {
  position: absolute;
  left: -9999px;
  top: 0;
  z-index: 100;
  padding: 0.5rem 1rem;
  background-color: var(--p-primary-color);
  color: #ffffff;
  border-radius: 0 0 6px 0;
}

.skip-link:focus {
  left: 0;
}
</style>
