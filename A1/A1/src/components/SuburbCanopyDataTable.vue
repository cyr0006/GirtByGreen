<script setup>
import { ref, onMounted } from 'vue'
import { FilterMatchMode } from '@primevue/core/api'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Search from '@primeicons/vue/search'
import FilterSlash from '@primeicons/vue/filter-slash'
import SuburbCanopyService from '@/service/SuburbCanopyService'
import { hviColor } from '@/utils/heatVulnerability'

const rows = ref([])
const loading = ref(true)
const loadError = ref('')

const filters = ref()

function initFilters() {
  filters.value = {
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    locality: { value: null, matchMode: FilterMatchMode.CONTAINS },
    vegCoverPct: { value: null, matchMode: FilterMatchMode.GREATER_THAN_OR_EQUAL_TO },
    treeCoverPct: { value: null, matchMode: FilterMatchMode.GREATER_THAN_OR_EQUAL_TO },
    vegChangePct: { value: null, matchMode: FilterMatchMode.GREATER_THAN_OR_EQUAL_TO },
    heatVulnerabilityIndex: { value: null, matchMode: FilterMatchMode.GREATER_THAN_OR_EQUAL_TO },
  }
}
initFilters()

function clearFilter() {
  initFilters()
}

onMounted(() => {
  SuburbCanopyService.getSuburbCanopyData()
    .then((data) => {
      rows.value = data
      loading.value = false
    })
    .catch(() => {
      loadError.value = 'Could not load suburb canopy data right now.'
      loading.value = false
    })
})

function pct(value) {
  return value == null ? '—' : `${value.toFixed(1)}%`
}
</script>

<template>
  <div class="card">
    <DataTable
      v-model:filters="filters"
      :value="rows"
      paginator
      showGridlines
      :rows="10"
      dataKey="locality"
      filterDisplay="menu"
      :loading="loading"
      :globalFilterFields="['locality']"
      sortField="locality"
      :sortOrder="1"
      rowHover
    >
      <template #header>
        <div class="flex justify-between items-center gap-4">
          <Button type="button" label="Clear filters" outlined @click="clearFilter()">
            <template #icon>
              <FilterSlash />
            </template>
          </Button>
          <IconField iconPosition="left">
            <InputIcon>
              <Search />
            </InputIcon>
            <InputText v-model="filters['global'].value" placeholder="Search suburb" />
          </IconField>
        </div>
      </template>
      <template #empty>
        {{ loadError || 'No suburbs found.' }}
      </template>
      <template #loading> Loading suburb canopy and heat data. Please wait. </template>

      <Column field="locality" header="Suburb" sortable style="min-width: 12rem">
        <template #filter="{ filterModel }">
          <InputText
            v-model="filterModel.value"
            type="text"
            class="p-column-filter"
            placeholder="Search by suburb"
          />
        </template>
      </Column>

      <Column
        field="vegCoverPct"
        header="Vegetation Cover 2018"
        sortable
        dataType="numeric"
        style="min-width: 12rem"
      >
        <template #body="{ data }">{{ pct(data.vegCoverPct) }}</template>
        <template #filter="{ filterModel }">
          <InputNumber v-model="filterModel.value" placeholder="Min %" suffix="%" />
        </template>
      </Column>

      <Column
        field="treeCoverPct"
        header="Tree Cover 2018"
        sortable
        dataType="numeric"
        style="min-width: 10rem"
      >
        <template #body="{ data }">{{ pct(data.treeCoverPct) }}</template>
        <template #filter="{ filterModel }">
          <InputNumber v-model="filterModel.value" placeholder="Min %" suffix="%" />
        </template>
      </Column>

      <Column
        field="vegChangePct"
        header="Vegetation Change 2014-2018"
        sortable
        dataType="numeric"
        style="min-width: 13rem"
      >
        <template #body="{ data }">
          <span
            v-if="data.vegChangePct != null"
            :style="{ color: data.vegChangePct < 0 ? '#e34948' : '#008300' }"
          >
            {{ data.vegChangePct > 0 ? '+' : '' }}{{ data.vegChangePct.toFixed(1) }}%
          </span>
          <span v-else>—</span>
        </template>
        <template #filter="{ filterModel }">
          <InputNumber v-model="filterModel.value" placeholder="Min %" suffix="%" />
        </template>
      </Column>

      <Column
        field="heatVulnerabilityIndex"
        header="Heat Vulnerability"
        sortable
        dataType="numeric"
        style="min-width: 11rem"
      >
        <template #body="{ data }">
          <Tag
            v-if="data.heatVulnerabilityIndex != null"
            :value="data.heatVulnerabilityIndex.toFixed(1)"
            :style="{
              backgroundColor: hviColor(data.heatVulnerabilityIndex),
              color: data.heatVulnerabilityIndex > 2.5 ? '#ffffff' : '#0b0b0b',
            }"
          />
          <span v-else>—</span>
        </template>
        <template #filter="{ filterModel }">
          <InputNumber v-model="filterModel.value" placeholder="Min index" />
        </template>
      </Column>
    </DataTable>
  </div>
</template>
