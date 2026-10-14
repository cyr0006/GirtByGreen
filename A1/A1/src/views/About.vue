<script setup>
import Card from 'primevue/card'
import Button from 'primevue/button'
import BlurText from '@/components/BlurText.vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const values = [
  {
    title: 'Grounded in real data',
    description:
      "We pull suburb vegetation, tree cover and heat vulnerability figures straight from Victoria's Vicmap and CoolingGreening datasets, not guesswork.",
  },
  {
    title: 'Native-first',
    description:
      'Every plant in our catalog is chosen for Victorian conditions, so what you plant actually belongs here.',
  },
  {
    title: 'Community powered',
    description:
      'Planting days, workshops and clean-up drives run on volunteers - the people who show up are the ones making the difference.',
  },
]
</script>

<template>
  <div class="px-8 pt-10 pb-4 max-w-3xl mx-auto text-center">
    <BlurText tag="h1" text="About GirtByGreen" class="text-4xl font-bold mb-3 justify-center" />
    <p class="text-gray-500 leading-relaxed">
      GirtByGreen helps Melbourne communities green their own patch of the city - one street, one
      garden, one tree at a time.
    </p>
  </div>

  <section class="px-8 pb-10 max-w-3xl mx-auto text-left">
    <p class="text-gray-600 leading-relaxed mb-4">
      We started GirtByGreen because it's hard to know where to begin with greening your local
      area - which suburbs need it most, which plants actually survive here, and how one more
      garden adds up to something bigger. So we built a single place for all of it: suburb-level
      vegetation and heat data, a native plant catalog with real grower reviews, an AI advisor
      for your own garden, and the local events where you can get your hands dirty alongside
      other people doing the same thing.
    </p>
    <p class="text-gray-600 leading-relaxed">
      Everything on this site is free to use. If you're after tailored planting advice, start a
      project with the AI Garden Advisor; if you just want to see what's happening nearby, check
      the Events page.
    </p>
  </section>

  <section class="px-8 pb-16 max-w-6xl mx-auto">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card v-for="item in values" :key="item.title" class="shadow-sm">
        <template #content>
          <div class="text-center p-2">
            <h3 class="text-xl font-semibold mb-3">{{ item.title }}</h3>
            <p class="text-gray-500 text-sm leading-relaxed">{{ item.description }}</p>
          </div>
        </template>
      </Card>
    </div>
  </section>

  <section class="px-8 pb-20 text-center">
    <Button label="Explore the garden advisor" size="large" @click="router.push('/my-garden-projects')" />
  </section>
</template>
