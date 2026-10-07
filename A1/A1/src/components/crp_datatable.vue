<template>
  <div class="card">
    <DataTable
      v-model:filters="filters"
      :value="plants"
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
          <Button type="button" label="Clear" outlined @click="clearFilter()">
            <template #icon>
              <FilterSlash />
            </template>
          </Button>
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
import Search from '@primeicons/vue/search'
import FilterSlash from '@primeicons/vue/filter-slash'
import { useAuth } from '@/composables/useAuth'
import { trimmed, containsHtml } from '@/utils/validation'

const { user } = useAuth()

const plants = ref()
const loading = ref(true)
const detailVisible = ref(false)
const selectedPlant = ref(null)

const reviewForm = ref({ rating: 0, comment: '' })
const reviewErrors = ref({})
const reviewSubmitted = ref(false)

const sunOptions = ref(['Full Sun', 'Part Shade', 'Full Shade'])
const waterOptions = ref(['Low', 'Medium', 'High'])

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
