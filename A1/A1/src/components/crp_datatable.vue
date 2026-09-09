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
    >
      <template #header>
        <div class="flex justify-content-between">
          <Button
            type="button"
            icon="pi pi-filter-slash"
            label="Clear"
            outlined
            @click="clearFilter()"
          />
          <IconField iconPosition="left">
            <InputIcon>
              <i class="pi pi-search" />
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

      <Column field="rating" header="Reviews" sortable style="min-width: 10rem">
        <template #body="{ data }">
          <Rating :modelValue="data.rating" readonly :stars="5" />
        </template>
      </Column>
    </DataTable>
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
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import Rating from 'primevue/rating'

const plants = ref()
const loading = ref(true)

const sunOptions = ref(['Full Sun', 'Part Shade', 'Full Shade'])
const waterOptions = ref(['Low', 'Medium', 'High'])

onMounted(() => {
  PlantService.getPlants().then((data) => {
    plants.value = data
    loading.value = false
  })
})

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
