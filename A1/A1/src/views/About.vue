<script setup>
import Button from 'primevue/button'
import BlurText from '@/components/BlurText.vue'
import TypeText from '@/components/TypeText.vue'
import FlipCard from '@/components/FlipCard.vue'
import BorderGlow from '@/components/BorderGlow.vue'
import Sparkles from '@primeicons/vue/sparkles'
import Pencil from '@primeicons/vue/pencil'
import Server from '@primeicons/vue/server'
import Bolt from '@primeicons/vue/bolt'
import Calendar from '@primeicons/vue/calendar'
import ChartBar from '@primeicons/vue/chart-bar'
import { useRouter } from 'vue-router'

const router = useRouter()

const features = [
  {
    title: 'AI Garden Advisor',
    description: 'Chat with an AI advisor for tailored planting advice for your own garden.',
    to: '/my-garden-projects',
    icon: Sparkles,
    color: '#3a5f8f',
  },
  {
    title: 'Vegetation Map',
    description: 'Explore tree cover, heat vulnerability and biodiversity across Melbourne.',
    to: '/vegetation-map',
    icon: Pencil,
    color: '#4c7a3a',
  },
  {
    title: 'Suburb Canopy Data',
    description: "Compare vegetation cover and heat vulnerability across Melbourne's suburbs.",
    to: '/suburb-canopy-data',
    icon: Server,
    color: '#d9a441',
  },
  {
    title: 'Click, Read, Plant',
    description: 'Browse our native plant catalog, filter by needs, and read grower reviews.',
    to: '/ClickReadPlant',
    icon: Bolt,
    color: '#b3402c',
  },
  {
    title: 'Events',
    description: 'Find upcoming community planting days, workshops and clean-up drives.',
    to: '/events',
    icon: Calendar,
    color: '#8f5a9e',
  },
  {
    title: 'Community Impact',
    description: 'See how many garden projects our community has reached so far.',
    to: '/community-impact',
    icon: ChartBar,
    color: '#2c7a7b',
  },
]

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
    <TypeText
      tag="p"
      class="text-muted-color leading-relaxed"
      text="GirtByGreen helps Melbourne communities green their own patch of the city - one street, one garden, one tree at a time."
      :loop="false"
      :typing-speed="20"
    />
  </div>

  <section class="px-8 pb-10 max-w-3xl mx-auto">
    <BorderGlow
      background-color="#132019"
      :colors="['#4ade80', '#22c55e', '#86efac']"
      glow-color="142 70 50"
      :border-radius="20"
      :animated="true"
    >
      <div class="p-8 md:p-10 text-left">
        <p class="text-[#e5e7eb] leading-relaxed mb-4">
          Canopy cover is unevenly distributed across Melbourne, and low-canopy areas tend to be
          lower-income. For example Melbourne’s west has the lowest level of canopy cover at just
          5.5% while the east is far greener at 25.9%. Lower canopy areas are known to be far hotter
          in summer due to the heat island effect. The lack of shade and cooling alone impact the
          physical and mental health of residents in Melbourne's least well off areas. Other
          negative ramifications include poorer air quality, higher flooding risk, and lower
          biodiversity
        </p>

        <p class="text-[#e5e7eb] leading-relaxed mb-4">
          We started GirtByGreen because it's hard to know where to begin with greening your local
          area; which suburbs need it most, which plants actually survive here, and how one more
          garden adds up to something bigger. So we built a single place for all of it: suburb-level
          vegetation and heat data, a native plant catalog with real grower reviews, an AI advisor
          for your own garden, and the local events where you can get your hands dirty alongside
          other people doing the same thing.
        </p>
        <p class="text-[#e5e7eb] leading-relaxed">
          Everything on this site is free to use. If you're after tailored planting advice, start a
          project with the AI Garden Advisor; if you just want to see what's happening nearby, check
          the Events page.
        </p>
      </div>
    </BorderGlow>
  </section>

  <section class="px-8 pb-16 max-w-6xl mx-auto">
    <h2 class="text-xl font-bold text-center mb-6">What GirtByGreen Offers</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      <BorderGlow
        v-for="item in features"
        :key="item.title"
        background-color="#132019"
        :colors="['#4ade80', '#22c55e', '#86efac']"
        glow-color="142 70 50"
        :border-radius="16"
        class="cursor-pointer"
        @click="router.push(item.to)"
      >
        <div class="p-5 flex flex-col items-center text-center gap-2">
          <div
            class="rounded-full p-2.5 flex items-center justify-center"
            :style="{ backgroundColor: item.color }"
          >
            <component :is="item.icon" class="w-5 h-5" style="color: #ffffff" />
          </div>
          <h3 class="text-[#f3f4f6] font-semibold text-sm">{{ item.title }}</h3>
          <p class="text-[#cbd5cf] text-xs leading-relaxed">{{ item.description }}</p>
        </div>
      </BorderGlow>
    </div>
  </section>

  <section class="px-8 pb-16 max-w-6xl mx-auto">
    <h2 class="text-xl font-bold text-center mb-6">Why GirtByGreen?</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div v-for="item in values" :key="item.title" class="flex justify-center">
        <FlipCard
          :width="300"
          :height="200"
          :radius="16"
          background="#0a6335"
          color="#f3f4f6"
          :shadow-opacity="0.3"
          :tilt-max="8"
          :hover-scale="1.02"
          :draggable="false"
          :aria-label="`${item.title} - flip for details`"
        >
          <template #front>
            <div class="flex h-full flex-col items-center justify-center text-center gap-2 px-6">
              <h3 class="text-lg font-semibold">{{ item.title }}</h3>
              <p class="text-xs text-[#cbd5cf]">Click to flip the card and read more</p>
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
  </section>

  <section class="px-8 pb-20 text-center">
    <Button
      label="Explore the garden advisor"
      size="large"
      @click="router.push('/my-garden-projects')"
    />
  </section>
</template>
