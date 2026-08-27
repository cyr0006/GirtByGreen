<script setup>
import Button from 'primevue/button'
import heroforest from '../assets/heroforest.jpg'
</script>

<template>
  <div
    class="relative flex items-center justify-center min-h-[calc(100vh-80px)] bg-cover bg-center"
    :style="{ backgroundImage: `url(${heroforest})` }"
  >
    <div class="absolute inset-0 bg-black/50"></div>
    <div class="relative text-center text-white px-4 max-w-2xl">
      <h1
        class="text-5xl font-bold mb-32"
        style="color: var(--p-primary-color); margin-bottom: 15px"
      >
        Welcome to GirtByGreen
      </h1>
      <p class="text-xl mb-8 text-surface-200" style="margin-bottom: 50px">
        Empowering communities, 1 tree at a time!
      </p>
      <div class="flex gap-4 justify-center">
        <Button label="Get Started" size="large" />
        <Button label="Learn More" severity="secondary" size="large" outlined />
      </div>
    </div>
  </div>
</template>
