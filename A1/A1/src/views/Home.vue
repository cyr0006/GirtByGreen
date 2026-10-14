<script setup>
import { useRouter } from 'vue-router'
import Card from 'primevue/card'
import Sparkles from '@primeicons/vue/sparkles'
import Pencil from '@primeicons/vue/pencil'
import Server from '@primeicons/vue/server'
import Bolt from '@primeicons/vue/bolt'
import Calendar from '@primeicons/vue/calendar'
import ChartBar from '@primeicons/vue/chart-bar'
import hero from '@/components/hero.vue'
import TextLoop from '@/components/TextLoop.vue'
import FlipCard from '@/components/FlipCard.vue'

const router = useRouter()

const quickLinks = [
  {
    label: 'AI Garden Advisor',
    description:
      'Create a project for your own garden and chat with an AI advisor for tailored planting advice.',
    to: '/my-garden-projects',
    icon: Sparkles,
    color: '#3a5f8f',
  },
  {
    label: 'Vegetation Map',
    description:
      'Explore tree cover, heat vulnerability and biodiversity layers across Melbourne and Victoria.',
    to: '/vegetation-map',
    icon: Pencil,
    color: '#4c7a3a',
  },
  {
    label: 'Suburb Canopy Data',
    description:
      "Compare vegetation cover, change and heat vulnerability across Melbourne's suburbs.",
    to: '/suburb-canopy-data',
    icon: Server,
    color: '#d9a441',
  },
  {
    label: 'Click, Read, Plant',
    description:
      'Browse our native plant catalog, filter by sun and water needs, and read grower reviews.',
    to: '/ClickReadPlant',
    icon: Bolt,
    color: '#b3402c',
  },
  {
    label: 'Events',
    description: 'Find upcoming community planting days, workshops and clean-up drives near you.',
    to: '/events',
    icon: Calendar,
    color: '#8f5a9e',
  },
  {
    label: 'Community Impact',
    description:
      'See how many garden projects, suburbs and goals our community has reached so far.',
    to: '/community-impact',
    icon: ChartBar,
    color: '#2c7a7b',
  },
]

const highlights = [
  {
    title: 'Grounded in real data',
    description:
      "Suburb vegetation, tree cover and heat vulnerability figures come straight from Victoria's Vicmap and CoolingGreening datasets, not guesswork.",
  },
  {
    title: 'Native-first plant catalog',
    description:
      'Every plant in our catalog is chosen for Victorian conditions, with sun, water and size details plus real grower reviews.',
  },
  {
    title: 'Personalised AI advice',
    description:
      'Tell the advisor your address and goals and it factors in your local vegetation, heat and biodiversity context automatically.',
  },
]
</script>

<template>
  <hero />

  <div class="home-divider" aria-hidden="true"></div>

  <section class="py-8 px-8 max-w-5xl mx-auto">
    <TextLoop
      text="Empowering Communities, One Tree at a Time"
      shape="wave"
      :ribbon="false"
      color="#15803d"
      :font-size="28"
    />
  </section>

  <div class="home-divider" aria-hidden="true"></div>

  <section id="explore" class="py-20 px-8 max-w-6xl mx-auto">
    <div class="text-center mb-12">
      <h2 class="text-3xl font-bold mb-4">Explore GirtByGreen</h2>
      <p class="text-muted-color leading-relaxed max-w-2xl mx-auto">
        Everything you need to green your patch of Melbourne - from suburb-level vegetation data to
        an AI advisor for your own garden.
      </p>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card
        v-for="item in quickLinks"
        :key="item.label"
        class="shadow-sm cursor-pointer home-quick-link"
        @click="router.push(item.to)"
      >
        <template #content>
          <div class="flex flex-col items-center text-center gap-3 py-4">
            <div
              class="rounded-full p-3 flex items-center justify-center"
              :style="{ backgroundColor: item.color }"
            >
              <component :is="item.icon" class="w-6 h-6" style="color: #ffffff" />
            </div>
            <h3 class="font-semibold">{{ item.label }}</h3>
            <p class="text-sm text-muted-color leading-relaxed">{{ item.description }}</p>
          </div>
        </template>
      </Card>
    </div>
  </section>

  <div class="home-divider" aria-hidden="true"></div>

  <section class="py-16 px-8" style="background-color: var(--p-surface-900)">
    <div class="max-w-6xl mx-auto">
      <h2 class="text-2xl font-bold mb-2 text-center">Why GirtByGreen</h2>
      <p class="text-surface-300 text-sm text-center mb-10">Click a card to flip it over.</p>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div v-for="item in highlights" :key="item.title" class="flex justify-center">
          <FlipCard
            :width="300"
            :height="200"
            :radius="16"
            background="#0a6335"
            color="#f3f4f6"
            :shadow-opacity="0.35"
            :tilt-max="8"
            :hover-scale="1.02"
            :draggable="false"
            :aria-label="`${item.title} - flip for details`"
          >
            <template #front>
              <div class="flex h-full flex-col items-center justify-center text-center gap-2 px-6">
                <h3 class="text-lg font-semibold">{{ item.title }}</h3>
                <p class="text-xs text-[#cbd5cf]">Click to read more</p>
              </div>
            </template>
            <template #back>
              <div class="flex h-full flex-col items-center justify-center text-center gap-2 px-6">
                <p class="text-sm text-[#cbd5cf] leading-relaxed">{{ item.description }}</p>
              </div>
            </template>
          </FlipCard>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.home-divider {
  height: 4px;
  width: 120px;
  margin: 0 auto;
  border-radius: 999px;
  background-color: var(--p-primary-color);
}

.home-quick-link {
  transition:
    box-shadow 0.15s ease,
    transform 0.15s ease;
}
.home-quick-link:hover {
  box-shadow: 0 8px 20px color-mix(in srgb, var(--p-primary-color) 35%, transparent);
  transform: translateY(-2px);
}
</style>
