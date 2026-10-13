<template>
  <div class="card">
    <DataTable
      ref="dt"
      v-model:filters="filters"
      :value="plants"
      exportFilename="plants"
      paginator
      showGridlines
      :rows="10"
      dataKey="id"
      filterDisplay="menu"
      :loading="loading"
      :globalFilterFields="['name', 'origin', 'sun', 'water']"
      sortField="name"
      :sortOrder="1"
      @row-click="onRowClick"
      rowHover
      class="cursor-pointer"
    >
      <template #header>
        <div class="flex justify-between items-center gap-4">
          <div class="flex items-center gap-2">
            <Button
              type="button"
              label="Clear"
              severity="secondary"
              outlined
              @click="clearFilter()"
            >
              <template #icon>
                <FilterSlash />
              </template>
            </Button>
            <Button
              type="button"
              label="Export"
              severity="secondary"
              outlined
              @click="openExportDialog()"
            >
              <template #icon>
                <FileExcel />
              </template>
            </Button>
          </div>
          <IconField iconPosition="left">
            <InputIcon>
              <Search />
            </InputIcon>
            <InputText v-model="filters['global'].value" placeholder="Search plants" />
          </IconField>
        </div>
      </template>
      <template #empty> No plants found. </template>
      <template #loading> Loading plants suited to Victoria. Please wait. </template>

      <Column header="Photo" style="min-width: 6rem">
        <template #body="{ data }">
          <img
            :src="data.photo"
            :alt="data.name"
            class="rounded-full"
            style="width: 48px; height: 48px"
          />
        </template>
      </Column>

      <Column field="name" header="Name" sortable style="min-width: 14rem">
        <template #body="{ data }">
          {{ data.name }}
        </template>
        <template #filter="{ filterModel }">
          <InputText
            v-model="filterModel.value"
            type="text"
            class="p-column-filter"
            placeholder="Search by name"
          />
        </template>
      </Column>

      <Column field="origin" header="Origin" sortable style="min-width: 14rem">
        <template #body="{ data }">
          {{ data.origin }}
        </template>
        <template #filter="{ filterModel }">
          <InputText
            v-model="filterModel.value"
            type="text"
            class="p-column-filter"
            placeholder="Search by origin"
          />
        </template>
      </Column>

      <Column field="dimensions" header="Dimensions" style="min-width: 12rem">
        <template #body="{ data }">
          {{ data.dimensions }}
        </template>
      </Column>

      <Column
        field="sun"
        header="Sun Req."
        :filterMenuStyle="{ width: '12rem' }"
        style="min-width: 10rem"
      >
        <template #body="{ data }">
          <Tag :value="data.sun" :severity="getSunSeverity(data.sun)" />
        </template>
        <template #filter="{ filterModel }">
          <Select
            v-model="filterModel.value"
            :options="sunOptions"
            placeholder="Select One"
            class="p-column-filter"
            showClear
          >
            <template #option="slotProps">
              <Tag :value="slotProps.option" :severity="getSunSeverity(slotProps.option)" />
            </template>
          </Select>
        </template>
      </Column>

      <Column
        field="water"
        header="Water Req."
        :filterMenuStyle="{ width: '12rem' }"
        style="min-width: 10rem"
      >
        <template #body="{ data }">
          <Tag :value="data.water" :severity="getWaterSeverity(data.water)" />
        </template>
        <template #filter="{ filterModel }">
          <Select
            v-model="filterModel.value"
            :options="waterOptions"
            placeholder="Select One"
            class="p-column-filter"
            showClear
          >
            <template #option="slotProps">
              <Tag :value="slotProps.option" :severity="getWaterSeverity(slotProps.option)" />
            </template>
          </Select>
        </template>
      </Column>

      <Column field="rating" header="Reviews" sortable style="min-width: 12rem">
        <template #body="{ data }">
          <div class="flex items-center gap-2">
            <Rating :modelValue="data.rating" readonly allowHalf :stars="5" />
            <span class="text-sm text-surface-500">({{ data.reviews.length }})</span>
          </div>
        </template>
      </Column>
    </DataTable>

    <Dialog
      v-model:visible="detailVisible"
      modal
      :header="selectedPlant?.name"
      :style="{ width: '40rem' }"
      class="mx-4"
    >
      <div v-if="selectedPlant" class="flex flex-col gap-4">
        <div class="flex gap-4 items-start">
          <img
            :src="selectedPlant.photo"
            :alt="selectedPlant.name"
            class="rounded-full"
            style="width: 80px; height: 80px"
          />
          <div class="flex flex-col gap-1">
            <div class="flex items-center gap-2">
              <Rating :modelValue="selectedPlant.rating" readonly allowHalf :stars="5" />
              <span class="text-sm text-surface-500"
                >{{ selectedPlant.rating }} ({{ selectedPlant.reviews.length }} reviews)</span
              >
            </div>
            <Tag :value="selectedPlant.origin" severity="secondary" />
          </div>
        </div>

        <p class="text-sm">{{ selectedPlant.description }}</p>

        <div class="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div class="text-surface-500">Dimensions</div>
            <div>{{ selectedPlant.dimensions }}</div>
          </div>
          <div>
            <div class="text-surface-500">Sun</div>
            <Tag :value="selectedPlant.sun" :severity="getSunSeverity(selectedPlant.sun)" />
          </div>
          <div>
            <div class="text-surface-500">Water</div>
            <Tag :value="selectedPlant.water" :severity="getWaterSeverity(selectedPlant.water)" />
          </div>
        </div>

        <Divider />

        <div class="flex flex-col gap-3">
          <h3 class="font-semibold">Reviews</h3>
          <div
            v-for="review in selectedPlant.reviews"
            :key="review.id"
            class="flex flex-col gap-1 border-b border-surface-200 pb-3 last:border-b-0"
          >
            <div class="flex items-center justify-between">
              <span class="font-medium">{{ review.user }}</span>
              <span class="text-xs text-surface-500">{{ review.date }}</span>
            </div>
            <Rating :modelValue="review.rating" readonly :stars="5" />
            <p class="text-sm">{{ review.comment }}</p>
          </div>
          <p v-if="!selectedPlant.reviews.length" class="text-sm text-surface-500">
            No reviews yet. Be the first to share your experience.
          </p>
        </div>

        <Divider />

        <div class="flex flex-col gap-3">
          <h3 class="font-semibold">Write a Review</h3>
          <template v-if="user">
            <div class="flex flex-col gap-1">
              <Rating v-model="reviewForm.rating" :stars="5" />
              <small v-if="reviewErrors.rating" class="text-red-500">{{ reviewErrors.rating }}</small>
            </div>
            <div class="flex flex-col gap-1">
              <Textarea
                v-model="reviewForm.comment"
                rows="3"
                maxlength="500"
                placeholder="Share your experience growing this plant..."
                :invalid="!!reviewErrors.comment"
              />
              <small v-if="reviewErrors.comment" class="text-red-500">{{ reviewErrors.comment }}</small>
            </div>
            <Message v-if="reviewSubmitted" severity="success" class="text-sm">
              Thanks for your review!
            </Message>
            <Button label="Submit Review" class="self-start" @click="submitReview" />
          </template>
          <p v-else class="text-sm text-surface-500">
            <router-link to="/SignIn" class="text-primary underline">Sign in</router-link>
            to write a review.
          </p>
        </div>
      </div>
    </Dialog>

    <Dialog
      v-model:visible="exportDialogVisible"
      modal
      header="Export plant list"
      :style="{ width: exportMode === 'email' ? '36rem' : '28rem' }"
      class="mx-4"
    >
      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-2">
          <div class="flex items-center gap-2">
            <RadioButton v-model="exportMode" inputId="exportDownload" value="download" />
            <label for="exportDownload">Download as CSV</label>
          </div>
          <div class="flex items-center gap-2">
            <RadioButton
              v-model="exportMode"
              inputId="exportEmail"
              value="email"
              :disabled="!user"
            />
            <label for="exportEmail">Email as CSV</label>
          </div>
          <small v-if="!user" class="text-surface-500">
            <router-link to="/SignIn" class="text-primary underline">Sign in</router-link>
            to email the list.
          </small>
        </div>

        <template v-if="exportMode === 'email'">
          <div class="flex flex-col gap-1">
            <label for="exportEmailTo" class="text-sm font-medium">Recipient</label>
            <InputText
              id="exportEmailTo"
              v-model="exportEmail"
              type="email"
              placeholder="recipient@example.com"
              :invalid="!!exportError"
            />
            <small v-if="exportError" class="text-red-500">{{ exportError }}</small>
          </div>

          <div class="flex flex-col gap-1">
            <label for="exportSubject" class="text-sm font-medium">Subject</label>
            <InputText
              id="exportSubject"
              v-model="exportSubject"
              :invalid="!!exportSubjectError"
              maxlength="150"
            />
            <small v-if="exportSubjectError" class="text-red-500">{{ exportSubjectError }}</small>
          </div>

          <div class="flex flex-col gap-1">
            <label for="exportName" class="text-sm font-medium">Your name (sign-off)</label>
            <InputText id="exportName" v-model="exportName" maxlength="100" />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium">Message</label>
            <Editor v-model="exportDescription" editorStyle="height: 180px" />
            <small v-if="exportDescriptionError" class="text-red-500">{{
              exportDescriptionError
            }}</small>
          </div>
        </template>

        <Message v-if="exportSent" severity="success" class="text-sm">
          Email sent to {{ exportEmail }}.
        </Message>
      </div>

      <template #footer>
        <Button
          label="Cancel"
          severity="secondary"
          outlined
          @click="exportDialogVisible = false"
        />
        <Button
          :label="exportMode === 'email' ? 'Send' : 'Download'"
          :loading="exportSending"
          @click="confirmExport()"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { PlantService } from '@/service/PlantService'
import { FilterMatchMode } from '@primevue/core/api'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Message from 'primevue/message'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import Rating from 'primevue/rating'
import Dialog from 'primevue/dialog'
import Divider from 'primevue/divider'
import RadioButton from 'primevue/radiobutton'
import Editor from 'primevue/editor'
import Search from '@primeicons/vue/search'
import FilterSlash from '@primeicons/vue/filter-slash'
import FileExcel from '@primeicons/vue/file-excel'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/firebase'
import { useAuth } from '@/composables/useAuth'
import { trimmed, containsHtml, EMAIL_REGEX } from '@/utils/validation'

const { user } = useAuth()

const dt = ref()
const plants = ref()
const loading = ref(true)
const detailVisible = ref(false)
const selectedPlant = ref(null)

const reviewForm = ref({ rating: 0, comment: '' })
const reviewErrors = ref({})
const reviewSubmitted = ref(false)

const sunOptions = ref(['Full Sun', 'Part Shade', 'Full Shade'])
const waterOptions = ref(['Low', 'Medium', 'High'])

const exportDialogVisible = ref(false)
const exportMode = ref('download')
const exportEmail = ref('')
const exportError = ref('')
const exportSubject = ref('')
const exportSubjectError = ref('')
const exportName = ref('')
const exportDescription = ref('')
const exportDescriptionError = ref('')
const exportSending = ref(false)
const exportSent = ref(false)

const defaultExportDescription = () =>
  '<p>Hi there,</p><p>Attached is the plant list you exported from GirtByGreen.</p>'

const plainText = (html) => String(html || '').replace(/<[^>]*>/g, '').trim()

const averageRating = (reviews) => {
  if (!reviews.length) return 0
  const sum = reviews.reduce((total, review) => total + review.rating, 0)
  return Math.round((sum / reviews.length) * 2) / 2
}

onMounted(() => {
  PlantService.getPlants().then((data) => {
    plants.value = data.map((plant) => ({ ...plant, rating: averageRating(plant.reviews) }))
    loading.value = false
  })
})

const onRowClick = (event) => {
  selectedPlant.value = event.data
  detailVisible.value = true
  reviewForm.value = { rating: 0, comment: '' }
  reviewErrors.value = {}
  reviewSubmitted.value = false
}

function validateReview() {
  reviewErrors.value = {}

  if (!reviewForm.value.rating || reviewForm.value.rating < 1) {
    reviewErrors.value.rating = 'Please select a star rating.'
  }

  const comment = reviewForm.value.comment || ''
  if (!comment.trim()) {
    reviewErrors.value.comment = 'A comment is required.'
  } else if (comment.length > 500) {
    reviewErrors.value.comment = 'Comment must be 500 characters or fewer.'
  } else if (containsHtml(comment)) {
    reviewErrors.value.comment = 'Comment cannot contain < or > characters.'
  }

  return Object.keys(reviewErrors.value).length === 0
}

function submitReview() {
  if (!user.value || !selectedPlant.value) return
  if (!validateReview()) return

  const reviews = selectedPlant.value.reviews
  const nextId = reviews.length ? Math.max(...reviews.map((r) => r.id)) + 1 : 1

  reviews.unshift({
    id: nextId,
    user: user.value.displayName || user.value.email || 'Anonymous',
    rating: reviewForm.value.rating,
    date: new Date().toISOString().slice(0, 10),
    comment: trimmed(reviewForm.value.comment),
  })

  selectedPlant.value.rating = averageRating(reviews)
  reviewForm.value = { rating: 0, comment: '' }
  reviewErrors.value = {}
  reviewSubmitted.value = true
}

const initFilters = () => {
  filters.value = {
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { value: null, matchMode: FilterMatchMode.CONTAINS },
    origin: { value: null, matchMode: FilterMatchMode.CONTAINS },
    sun: { value: null, matchMode: FilterMatchMode.EQUALS },
    water: { value: null, matchMode: FilterMatchMode.EQUALS },
  }
}

const filters = ref()
initFilters()

const clearFilter = () => {
  initFilters()
}

const openExportDialog = () => {
  exportMode.value = 'download'
  exportEmail.value = ''
  exportError.value = ''
  exportSubject.value = 'Your GirtByGreen plant list export'
  exportSubjectError.value = ''
  exportName.value = user.value?.displayName || user.value?.email || ''
  exportDescription.value = defaultExportDescription()
  exportDescriptionError.value = ''
  exportSent.value = false
  exportDialogVisible.value = true
}

const csvCell = (value) => {
  const text = String(value ?? '')
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

const buildPlantsCsv = () => {
  const header = ['Name', 'Origin', 'Dimensions', 'Sun Req.', 'Water Req.', 'Rating']
  const rows = (plants.value || []).map((plant) =>
    [plant.name, plant.origin, plant.dimensions, plant.sun, plant.water, plant.rating].map(
      csvCell,
    ),
  )
  return [header, ...rows].map((row) => row.join(',')).join('\n')
}

const sendPlantsCsvEmail = httpsCallable(functions, 'sendPlantsCsvEmail')

async function confirmExport() {
  if (exportMode.value === 'download') {
    dt.value.exportCSV()
    exportDialogVisible.value = false
    return
  }

  exportError.value = ''
  exportSubjectError.value = ''
  exportDescriptionError.value = ''

  const email = trimmed(exportEmail.value) || ''
  const subject = trimmed(exportSubject.value) || ''

  let valid = true
  if (!EMAIL_REGEX.test(email)) {
    exportError.value = 'Please enter a valid email address.'
    valid = false
  }
  if (!subject) {
    exportSubjectError.value = 'A subject is required.'
    valid = false
  }
  if (!plainText(exportDescription.value)) {
    exportDescriptionError.value = 'A message is required.'
    valid = false
  }
  if (!valid) return

  exportSending.value = true
  try {
    await sendPlantsCsvEmail({
      to: email,
      csv: buildPlantsCsv(),
      subject,
      name: trimmed(exportName.value) || '',
      description: exportDescription.value,
    })
    exportSent.value = true
  } catch (err) {
    exportError.value = err?.message || 'Failed to send email. Please try again.'
  } finally {
    exportSending.value = false
  }
}

const getSunSeverity = (sun) => {
  switch (sun) {
    case 'Full Sun':
      return 'warn'
    case 'Part Shade':
      return 'info'
    case 'Full Shade':
      return 'secondary'
    default:
      return null
  }
}

const getWaterSeverity = (water) => {
  switch (water) {
    case 'Low':
      return 'success'
    case 'Medium':
      return 'info'
    case 'High':
      return 'danger'
    default:
      return null
  }
}
</script>
