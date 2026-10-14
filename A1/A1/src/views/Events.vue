<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import Card from 'primevue/card'
import Button from 'primevue/button'
import BlurText from '../components/BlurText.vue'
import TypeText from '../components/TypeText.vue'
import Tag from 'primevue/tag'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import SelectButton from 'primevue/selectbutton'
import Message from 'primevue/message'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import SearchIcon from '@primeicons/vue/search'
import ExclamationTriangle from '@primeicons/vue/exclamation-triangle'
import { useConfirm } from 'primevue/useconfirm'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { useAuth } from '../composables/useAuth'
import { trimmed, containsHtml } from '../utils/validation'
import { EventService } from '../service/EventService'

const router = useRouter()
const confirm = useConfirm()
const { user, isOrg, isAdmin } = useAuth()

const events = ref([])
const myBookingIds = ref(new Set())
let unsubEvents = null
let unsubBookings = null

onMounted(() => {
  unsubEvents = EventService.listenToEvents((rows) => {
    events.value = rows
  })
})

watch(
  user,
  (current) => {
    unsubBookings?.()
    unsubBookings = null
    myBookingIds.value = new Set()
    if (current) {
      unsubBookings = EventService.listenToMyBookings(current.uid, (ids) => {
        myBookingIds.value = ids
      })
    }
  },
  { immediate: true },
)

onUnmounted(() => {
  unsubEvents?.()
  unsubBookings?.()
})

const categorySeverity = {
  Outdoors: 'success',
  Workshop: 'info',
  Online: 'warn',
  Community: 'primary',
}
// Fixed per-category colour for the calendar view — same assignment every
// time, never a cycled/generated hue.
const categoryColor = {
  Outdoors: '#16a34a',
  Workshop: '#2563eb',
  Online: '#d97706',
  Community: '#7c3aed',
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

function remaining(event) {
  return Math.max(0, (event.capacity || 0) - (event.bookedCount || 0))
}
function isFull(event) {
  return remaining(event) <= 0
}
function isBooked(event) {
  return myBookingIds.value.has(event.id)
}

const viewOptions = [
  { label: 'List', value: 'list' },
  { label: 'Calendar', value: 'calendar' },
]
const activeView = ref('list')

const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  height: 'auto',
  events: filteredEvents.value.map((event) => ({
    id: event.id,
    title: event.title,
    start: event.date,
    backgroundColor: categoryColor[event.category] || '#6b7280',
    borderColor: categoryColor[event.category] || '#6b7280',
  })),
  eventClick: (info) => {
    const match = events.value.find((e) => e.id === info.event.id)
    if (match) openDetails(match)
  },
}))

const detailsEvent = ref(null)
const showDetails = ref(false)
function openDetails(event) {
  detailsEvent.value = event
  showDetails.value = true
}

const actionError = ref('')
const bookingBusyId = ref('')

async function register(event) {
  if (!user.value) {
    router.push('/SignIn')
    return
  }
  actionError.value = ''
  bookingBusyId.value = event.id
  try {
    await EventService.bookEvent(event.id)
  } catch (err) {
    actionError.value = err?.message || 'Could not register for this event. Please try again.'
  } finally {
    bookingBusyId.value = ''
  }
}

async function cancel(event) {
  actionError.value = ''
  bookingBusyId.value = event.id
  try {
    await EventService.cancelBooking(event.id)
  } catch (err) {
    actionError.value = err?.message || 'Could not cancel this booking. Please try again.'
  } finally {
    bookingBusyId.value = ''
  }
}

async function deleteEventNow(event) {
  actionError.value = ''
  bookingBusyId.value = event.id
  try {
    await EventService.deleteEvent(event.id)
    if (showDetails.value && detailsEvent.value?.id === event.id) {
      showDetails.value = false
    }
  } catch (err) {
    actionError.value = err?.message || 'Could not delete this event. Please try again.'
  } finally {
    bookingBusyId.value = ''
  }
}

function confirmDeleteEvent(event) {
  confirm.require({
    header: 'Delete event',
    message: `Delete "${event.title}"? This cannot be undone.`,
    icon: ExclamationTriangle,
    acceptProps: { label: 'Delete', severity: 'danger' },
    rejectProps: { label: 'Cancel', severity: 'secondary' },
    accept: () => deleteEventNow(event),
  })
}

const showDialog = ref(false)
const errors = ref({})
const newEvent = ref({
  title: '',
  date: '',
  location: '',
  description: '',
  capacity: 0,
  category: '',
})
const creating = ref(false)

function openDialog() {
  if (!isOrg.value) return
  newEvent.value = { title: '', date: '', location: '', description: '', capacity: 0, category: '' }
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

  if (!newEvent.value.capacity || newEvent.value.capacity <= 0) {
    errors.value.capacity = 'Spots must be a positive number.'
  } else if (!Number.isInteger(newEvent.value.capacity)) {
    errors.value.capacity = 'Spots must be a whole number.'
  } else if (newEvent.value.capacity > 100000) {
    errors.value.capacity = 'Spots must be 100,000 or fewer.'
  }

  if (!newEvent.value.category) {
    errors.value.category = 'Category is required.'
  }

  return Object.keys(errors.value).length === 0
}

async function addEvent() {
  if (!isOrg.value) return
  if (!validate()) return
  creating.value = true
  try {
    await EventService.createEvent({
      title: trimmed(newEvent.value.title),
      date: newEvent.value.date,
      location: trimmed(newEvent.value.location),
      description: trimmed(newEvent.value.description),
      capacity: newEvent.value.capacity,
      category: newEvent.value.category,
    })
    showDialog.value = false
  } catch (err) {
    errors.value.submit = err?.message || 'Could not create this event. Please try again.'
  } finally {
    creating.value = false
  }
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
      <BlurText tag="h1" text="Upcoming Events" class="text-4xl font-bold mb-2" />
      <TypeText
        tag="p"
        class="text-gray-500 mb-4"
        text="Browse our upcoming community events. Sign up to get involved and make a difference."
        :loop="false"
        :typing-speed="20"
      />
      <Button v-if="isOrg" icon="pi pi-plus" label="Add Event" @click="openDialog" />
    </div>

    <Message v-if="actionError" severity="error" closable @close="actionError = ''" class="mb-6">
      {{ actionError }}
    </Message>

    <div class="flex flex-col sm:flex-row gap-4 mb-8 sm:items-center sm:justify-between flex-wrap">
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
      <SelectButton
        v-model="activeView"
        :options="viewOptions"
        optionLabel="label"
        optionValue="value"
        :allowEmpty="false"
      />
    </div>

    <p v-if="!filteredEvents.length" class="text-center text-gray-500">
      No events match your filters.
    </p>

    <div v-else-if="activeView === 'calendar'" class="card">
      <FullCalendar :options="calendarOptions" />
    </div>

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
          <div class="flex items-center justify-between mt-auto gap-2">
            <span class="text-sm text-surface-400">
              {{ isFull(event) ? 'Fully booked' : `${remaining(event)} spots left` }}
            </span>
            <div class="flex items-center gap-2">
              <Button
                v-if="isAdmin"
                label="Delete"
                size="small"
                severity="danger"
                outlined
                :loading="bookingBusyId === event.id"
                @click="confirmDeleteEvent(event)"
              />
              <Button
                v-if="isBooked(event)"
                label="Cancel booking"
                size="small"
                severity="secondary"
                outlined
                :loading="bookingBusyId === event.id"
                @click="cancel(event)"
              />
              <Button
                v-else
                label="Register"
                size="small"
                :disabled="isFull(event)"
                :loading="bookingBusyId === event.id"
                @click="register(event)"
              />
            </div>
          </div>
        </template>
      </Card>
    </div>

    <Dialog
      v-model:visible="showDetails"
      :header="detailsEvent?.title"
      modal
      :style="{ width: '28rem' }"
    >
      <template v-if="detailsEvent">
        <div class="flex flex-col gap-2 mb-4">
          <Tag
            :value="detailsEvent.category"
            :severity="categorySeverity[detailsEvent.category]"
            class="w-fit"
          />
          <span class="text-sm text-surface-500">{{ formatDate(detailsEvent.date) }}</span>
          <span class="text-sm text-surface-500">{{ detailsEvent.location }}</span>
          <p class="text-sm text-surface-600 leading-relaxed mt-2">
            {{ detailsEvent.description }}
          </p>
          <span class="text-sm text-surface-400 mt-2">
            {{ isFull(detailsEvent) ? 'Fully booked' : `${remaining(detailsEvent)} spots left` }}
          </span>
        </div>
      </template>
      <template #footer>
        <Button label="Close" severity="secondary" text @click="showDetails = false" />
        <Button
          v-if="detailsEvent && isAdmin"
          label="Delete"
          severity="danger"
          outlined
          :loading="bookingBusyId === detailsEvent.id"
          @click="confirmDeleteEvent(detailsEvent)"
        />
        <Button
          v-if="detailsEvent && isBooked(detailsEvent)"
          label="Cancel booking"
          severity="secondary"
          :loading="bookingBusyId === detailsEvent.id"
          @click="cancel(detailsEvent)"
        />
        <Button
          v-else-if="detailsEvent"
          label="Register"
          :disabled="isFull(detailsEvent)"
          :loading="bookingBusyId === detailsEvent.id"
          @click="register(detailsEvent)"
        />
      </template>
    </Dialog>

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
          <InputText v-model.number="newEvent.capacity" type="number" min="1" max="100000" />
          <small v-if="errors.capacity" class="text-red-500">{{ errors.capacity }}</small>
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
        <Message v-if="errors.submit" severity="error" :closable="false">{{
          errors.submit
        }}</Message>
      </div>
      <template #footer>
        <Button label="Cancel" severity="secondary" text @click="showDialog = false" />
        <Button label="Add Event" :loading="creating" @click="addEvent" />
      </template>
    </Dialog>
  </div>
</template>
