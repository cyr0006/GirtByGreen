<script setup>
import Button from 'primevue/button'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import BlurText from './BlurText.vue'
import DotGrid from './DotGrid.vue'

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
    class="relative flex items-center justify-center min-h-[calc(100vh-80px)] overflow-hidden"
    style="background-color: #0b1f14"
  >
    <DotGrid
      class="absolute inset-0"
      base-color="#1f3d2a"
      active-color="#86efac"
      :dot-size="4"
      :gap="22"
      :proximity="130"
      :shock-strength="4"
    />
    <div
      class="relative z-10 text-center text-white px-8 py-10 max-w-2xl rounded-2xl border border-white/10 shadow-xl"
      style="background-color: rgba(0, 0, 0, 0.35); backdrop-filter: blur(6px)"
    >
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
