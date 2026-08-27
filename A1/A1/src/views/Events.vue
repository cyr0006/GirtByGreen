<script setup>
import { ref } from 'vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Tag from 'primevue/tag'

const events = ref([
  {
    id: 1,
    title: 'Community Tree Planting',
    date: '2026-09-15',
    location: 'Melbourne Botanic Gardens',
    description:
      'Join us for a day of planting native trees across the botanic gardens. All tools and saplings provided.',
    spots: 30,
    category: 'Outdoors',
  },
  {
    id: 2,
    title: 'Sustainability Workshop',
    date: '2026-09-22',
    location: 'Monash University, Clayton',
    description:
      'Learn practical strategies for reducing your carbon footprint at home and in the workplace.',
    spots: 50,
    category: 'Workshop',
  },
  {
    id: 3,
    title: 'Beach Cleanup Drive',
    date: '2026-10-05',
    location: 'St Kilda Beach',
    description:
      'Help us clean up litter along the coastline. Gloves and bags will be provided on the day.',
    spots: 40,
    category: 'Outdoors',
  },
  {
    id: 4,
    title: 'Green Tech Talk',
    date: '2026-10-12',
    location: 'Online via Zoom',
    description:
      'A panel discussion on emerging green technologies and their role in fighting climate change.',
    spots: 100,
    category: 'Online',
  },
  {
    id: 5,
    title: 'Farmers MarketVolunteer Day',
    date: '2026-10-20',
    location: 'Queen Victoria Market',
    description:
      'Volunteer at our local farmers market stall promoting sustainable produce and zero-waste packaging.',
    spots: 15,
    category: 'Community',
  },
  {
    id: 6,
    title: 'Seed Swap & Social',
    date: '2026-11-01',
    location: 'Fitzroy Community Garden',
    description:
      'Bring your leftover seeds and swap with fellow gardeners. Light refreshments provided.',
    spots: 25,
    category: 'Community',
  },
])

const categorySeverity = {
  Outdoors: 'success',
  Workshop: 'info',
  Online: 'warn',
  Community: 'primary',
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
</script>

<template>
  <div class="py-20 px-8 max-w-6xl mx-auto">
    <h1 class="text-4xl font-bold text-center mb-4">Upcoming Events</h1>
    <p class="text-surface-500 text-center mb-12">
      Browse our upcoming community events. Sign up to get involved and make a difference.
    </p>

    <div
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center justify-center"
    >
      <Card v-for="event in events" :key="event.id" class="shadow-sm">
        <template #title>
          <div class="flex items-start justify-between gap-2">
            <span>{{ event.title }}</span>
            <Tag :value="event.category" :severity="categorySeverity[event.category]" />
          </div>
        </template>
        <template #subtitle>
          <div class="flex flex-col gap-1 text-sm text-surface-500">
            <span>{{ formatDate(event.date) }}</span>
            <span>{{ event.location }}</span>
          </div>
        </template>
        <template #content>
          <p class="text-surface-600 text-sm leading-relaxed">{{ event.description }}</p>
        </template>
        <template #footer>
          <div class="flex items-center justify-between">
            <span class="text-sm text-surface-400">{{ event.spots }} spots left</span>
            <Button label="Register" size="small" />
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>
