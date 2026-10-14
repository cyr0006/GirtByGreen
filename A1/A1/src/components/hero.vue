<script setup>
import Button from 'primevue/button'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import heroforest from '../assets/heroforest.jpg'
import BlurText from './BlurText.vue'

const router = useRouter()
const { user } = useAuth()

function getStarted() {
  router.push(user.value ? '/my-garden-projects' : '/FireRegister')
}

function learnMore() {
  document.getElementById('explore')?.scrollIntoView({ behavior: 'smooth' })
}
</script>

<template>
  <div
    class="relative flex items-center justify-center min-h-[calc(100vh-80px)] bg-cover bg-center"
    :style="{ backgroundImage: `url(${heroforest})` }"
  >
    <div class="absolute inset-0 bg-black/50"></div>
    <div class="relative text-center text-white px-4 max-w-2xl">
      <BlurText
        tag="h1"
        text="Welcome to GirtByGreen"
        :delay="120"
        class="text-5xl font-bold justify-center mb-32"
        style="color: var(--p-primary-color); margin-bottom: 15px"
      />
      <p class="text-xl mb-8 text-surface-200" style="margin-bottom: 50px">
        Empowering communities, 1 tree at a time!
      </p>
      <div class="flex gap-4 justify-center">
        <Button label="Get Started" size="large" @click="getStarted" />
        <Button label="Learn More" severity="info" raised size="large" @click="learnMore" />
      </div>
    </div>
  </div>
</template>
