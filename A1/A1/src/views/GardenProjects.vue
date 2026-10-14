<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import AutoComplete from 'primevue/autocomplete'
import Textarea from 'primevue/textarea'
import Message from 'primevue/message'
import { useAuth } from '@/composables/useAuth'
import { useAddressSearch } from '@/composables/useAddressSearch'
import { ProjectService } from '@/service/ProjectService'
import { trimmed, containsHtml } from '@/utils/validation'
import BlurText from '@/components/BlurText.vue'
import TypeText from '@/components/TypeText.vue'

const router = useRouter()
const { user } = useAuth()
const { addressSuggestions, addressError, searchAddress } = useAddressSearch()

const projects = ref([])
const loading = ref(true)
const loadError = ref('')

async function loadProjects() {
  if (!user.value) return
  loading.value = true
  loadError.value = ''
  try {
    projects.value = await ProjectService.listMyProjects(user.value.uid)
  } catch (err) {
    console.error('Failed to load projects:', err)
    loadError.value = 'Could not load your projects right now.'
  } finally {
    loading.value = false
  }
}

onMounted(loadProjects)

const showDialog = ref(false)
const selectedAddress = ref(null)
const errors = ref({})
const newProject = ref({ goal: '', conditions: '' })
const submitting = ref(false)
const submitError = ref('')

function openDialog() {
  selectedAddress.value = null
  newProject.value = { goal: '', conditions: '' }
  errors.value = {}
  submitError.value = ''
  showDialog.value = true
}

function validate() {
  errors.value = {}

  if (!selectedAddress.value?.lat) {
    errors.value.address = 'Please select an address from the suggestions.'
  }

  if (!newProject.value.goal.trim()) {
    errors.value.goal = 'Goal is required.'
  } else if (newProject.value.goal.length > 300) {
    errors.value.goal = 'Goal must be 300 characters or fewer.'
  } else if (containsHtml(newProject.value.goal)) {
    errors.value.goal = 'Goal cannot contain < or > characters.'
  }

  if (!newProject.value.conditions.trim()) {
    errors.value.conditions = 'Space/conditions is required.'
  } else if (newProject.value.conditions.length > 500) {
    errors.value.conditions = 'Space/conditions must be 500 characters or fewer.'
  } else if (containsHtml(newProject.value.conditions)) {
    errors.value.conditions = 'Space/conditions cannot contain < or > characters.'
  }

  return Object.keys(errors.value).length === 0
}

async function createProject() {
  if (!validate()) return
  submitting.value = true
  submitError.value = ''
  try {
    const id = await ProjectService.createProject({
      address: selectedAddress.value.label,
      lat: selectedAddress.value.lat,
      lng: selectedAddress.value.lng,
      locality: selectedAddress.value.locality,
      goal: trimmed(newProject.value.goal),
      conditions: trimmed(newProject.value.conditions),
    })
    showDialog.value = false
    router.push(`/my-garden-projects/${id}`)
  } catch (err) {
    console.error('Failed to create project:', err)
    submitError.value = 'Could not create this project right now. Please try again.'
  } finally {
    submitting.value = false
  }
}

function formatDate(timestamp) {
  const date = timestamp?.toDate?.()
  if (!date) return ''
  return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>

<template>
  <div class="py-20 px-8 max-w-6xl mx-auto">
    <div class="mb-12 text-left">
      <BlurText tag="h1" text="AI Garden Advisor" class="text-4xl font-bold mb-2" />
      <TypeText
        tag="p"
        class="text-muted-color mb-4"
        text="Create a project for your garden and chat with an AI advisor for tailored planting advice."
        :loop="false"
        :typing-speed="20"
      />
      <br />
      <Button icon="pi pi-plus" label="New Project" @click="openDialog" />
    </div>

    <p v-if="loading" class="text-center text-surface-500">Loading your projects...</p>
    <Message v-else-if="loadError" severity="error" :closable="false">{{ loadError }}</Message>
    <p v-else-if="!projects.length" class="text-center text-surface-500">
      You don't have any garden projects yet. Create one to get started.
    </p>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card
        v-for="project in projects"
        :key="project.id"
        class="shadow-sm h-full flex flex-col cursor-pointer"
        @click="router.push(`/my-garden-projects/${project.id}`)"
      >
        <template #title>{{ project.address }}</template>
        <template #subtitle
          >{{ project.locality }} &middot; {{ formatDate(project.createdAt) }}</template
        >
        <template #content>
          <p class="text-surface-600 text-sm leading-relaxed">
            <strong>Goal:</strong> {{ project.goal }}
          </p>
        </template>
        <template #footer>
          <Button label="Open chat" size="small" />
        </template>
      </Card>
    </div>

    <Dialog
      v-model:visible="showDialog"
      header="New Garden Project"
      modal
      :style="{ width: '30rem' }"
    >
      <div class="flex flex-col gap-4 mt-4">
        <div class="flex flex-col gap-1">
          <label for="project-address" class="text-sm font-medium">Address</label>
          <AutoComplete
            id="project-address"
            v-model="selectedAddress"
            :suggestions="addressSuggestions"
            optionLabel="label"
            placeholder="Search a Victorian address..."
            class="w-full"
            :inputStyle="{ width: '100%' }"
            :invalid="!!errors.address || !!addressError"
            :aria-describedby="errors.address || addressError ? 'address-error' : undefined"
            @complete="searchAddress"
          />
          <small v-if="errors.address" id="address-error" class="text-red-500">{{ errors.address }}</small>
          <small v-else-if="addressError" id="address-error" class="text-red-500">{{ addressError }}</small>
        </div>
        <div class="flex flex-col gap-1">
          <label for="project-goal" class="text-sm font-medium">Goal</label>
          <Textarea
            id="project-goal"
            v-model="newProject.goal"
            rows="2"
            placeholder="e.g. Attract native birds, grow a low-maintenance screen..."
            maxlength="300"
            :invalid="!!errors.goal"
            :aria-describedby="errors.goal ? 'goal-error' : undefined"
          />
          <small v-if="errors.goal" id="goal-error" class="text-red-500">{{ errors.goal }}</small>
        </div>
        <div class="flex flex-col gap-1">
          <label for="project-conditions" class="text-sm font-medium">Space / conditions</label>
          <Textarea
            id="project-conditions"
            v-model="newProject.conditions"
            rows="3"
            placeholder="e.g. 3x4m sunny courtyard, clay soil, exposed to wind..."
            maxlength="500"
            :invalid="!!errors.conditions"
            :aria-describedby="errors.conditions ? 'conditions-error' : undefined"
          />
          <small v-if="errors.conditions" id="conditions-error" class="text-red-500">{{ errors.conditions }}</small>
        </div>
        <Message v-if="submitError" severity="error" :closable="false">{{ submitError }}</Message>
      </div>
      <template #footer>
        <Button label="Cancel" severity="secondary" text @click="showDialog = false" />
        <Button label="Create Project" :loading="submitting" @click="createProject" />
      </template>
    </Dialog>
  </div>
</template>
