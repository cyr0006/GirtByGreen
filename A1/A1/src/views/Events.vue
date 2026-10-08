<script setup>
import { ref, computed } from 'vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import SearchIcon from '@primeicons/vue/search'
import { useAuth } from '../composables/useAuth'
import { trimmed, containsHtml } from '../utils/validation'

const { isOrg } = useAuth()

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
    title: 'Farmers Market Volunteer Day',
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

const categories = ['Outdoors', 'Workshop', 'Online', 'Community']

const categoryFilter = ref(null)
const searchQuery = ref('')

const filteredEvents = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  return events.value.filter((event) => {
    if (categoryFilter.value && event.category !== categoryFilter.value) return false
    if (!query) return true
    return (
      event.title.toLowerCase().includes(query) ||
      event.location.toLowerCase().includes(query) ||
      event.description.toLowerCase().includes(query)
    )
  })
})

const showDialog = ref(false)
const errors = ref({})
const newEvent = ref({
  title: '',
  date: '',
  location: '',
  description: '',
  spots: 0,
  category: '',
})

function openDialog() {
  if (!isOrg.value) return
  newEvent.value = { title: '', date: '', location: '', description: '', spots: 0, category: '' }
  errors.value = {}
  showDialog.value = true
}

function validate() {
  errors.value = {}

  if (!newEvent.value.title.trim()) {
    errors.value.title = 'Title is required.'
  } else if (newEvent.value.title.length > 100) {
    errors.value.title = 'Title must be 100 characters or fewer.'
  } else if (containsHtml(newEvent.value.title)) {
    errors.value.title = 'Title cannot contain < or > characters.'
  }

  if (!newEvent.value.date) {
    errors.value.date = 'Date is required.'
  } else if (isNaN(Date.parse(newEvent.value.date))) {
    errors.value.date = 'Please enter a valid date.'
  }

  if (!newEvent.value.location.trim()) {
    errors.value.location = 'Location is required.'
  } else if (newEvent.value.location.length > 150) {
    errors.value.location = 'Location must be 150 characters or fewer.'
  } else if (containsHtml(newEvent.value.location)) {
    errors.value.location = 'Location cannot contain < or > characters.'
  }

  if (!newEvent.value.description.trim()) {
    errors.value.description = 'Description is required.'
  } else if (newEvent.value.description.length > 1000) {
    errors.value.description = 'Description must be 1000 characters or fewer.'
  } else if (containsHtml(newEvent.value.description)) {
    errors.value.description = 'Description cannot contain < or > characters.'
  }

  if (!newEvent.value.spots || newEvent.value.spots <= 0) {
    errors.value.spots = 'Spots must be a positive number.'
  } else if (!Number.isInteger(newEvent.value.spots)) {
    errors.value.spots = 'Spots must be a whole number.'
  } else if (newEvent.value.spots > 100000) {
    errors.value.spots = 'Spots must be 100,000 or fewer.'
  }

  if (!newEvent.value.category) {
    errors.value.category = 'Category is required.'
  }

  return Object.keys(errors.value).length === 0
}

function addEvent() {
  if (!isOrg.value) return
  if (!validate()) return
  events.value.push({
    id: events.value.length + 1,
    ...newEvent.value,
    title: trimmed(newEvent.value.title),
    location: trimmed(newEvent.value.location),
    description: trimmed(newEvent.value.description),
  })
  showDialog.value = false
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
    <div class="mb-12 text-left">
      <h1 class="text-4xl font-bold mb-2">Upcoming Events</h1>
      <p class="text-gray-500 mb-4">
        Browse our upcoming community events. Sign up to get involved and make a difference.
      </p>
      <Button v-if="isOrg" icon="pi pi-plus" label="Add Event" @click="openDialog" />
    </div>

    <div class="flex flex-col sm:flex-row gap-4 mb-8 sm:items-center sm:justify-between">
      <Select
        v-model="categoryFilter"
        :options="categories"
        showClear
        placeholder="All formats"
        class="w-full sm:w-56"
      />
      <IconField class="w-full sm:w-72">
        <InputIcon>
          <SearchIcon />
        </InputIcon>
        <InputText v-model="searchQuery" placeholder="Search events..." class="w-full" />
      </IconField>
    </div>

    <p v-if="!filteredEvents.length" class="text-center text-gray-500">
      No events match your filters.
    </p>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card v-for="event in filteredEvents" :key="event.id" class="shadow-sm h-full flex flex-col">
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
          <p class="text-surface-600 text-sm leading-relaxed flex-1">{{ event.description }}</p>
        </template>
        <template #footer>
          <div class="flex items-center justify-between mt-auto">
            <span class="text-sm text-surface-400">{{ event.spots }} spots left</span>
            <Button label="Register" size="small" />
          </div>
        </template>
      </Card>
    </div>

    <Dialog v-model:visible="showDialog" header="Add New Event" modal :style="{ width: '28rem' }">
      <div class="flex flex-col gap-4 mt-4">
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Title</label>
          <InputText v-model="newEvent.title" placeholder="Event title" maxlength="100" />
          <small v-if="errors.title" class="text-red-500">{{ errors.title }}</small>
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Date</label>
          <InputText v-model="newEvent.date" type="date" />
          <small v-if="errors.date" class="text-red-500">{{ errors.date }}</small>
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Location</label>
          <InputText v-model="newEvent.location" placeholder="Event location" maxlength="150" />
          <small v-if="errors.location" class="text-red-500">{{ errors.location }}</small>
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Description</label>
          <Textarea
            v-model="newEvent.description"
            rows="3"
            placeholder="Event description"
            maxlength="1000"
          />
          <small v-if="errors.description" class="text-red-500">{{ errors.description }}</small>
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Available Spots</label>
          <InputText v-model.number="newEvent.spots" type="number" min="1" max="100000" />
          <small v-if="errors.spots" class="text-red-500">{{ errors.spots }}</small>
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Category</label>
          <Select
            v-model="newEvent.category"
            :options="categories"
            placeholder="Select a category"
          />
          <small v-if="errors.category" class="text-red-500">{{ errors.category }}</small>
        </div>
      </div>
      <template #footer>
        <Button label="Cancel" severity="secondary" text @click="showDialog = false" />
        <Button label="Add Event" @click="addEvent" />
      </template>
    </Dialog>
  </div>
</template>
