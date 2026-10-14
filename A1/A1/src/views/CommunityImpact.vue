<script setup>
import { ref, computed, onMounted } from 'vue'
import * as d3 from 'd3'
import ProgressSpinner from 'primevue/progressspinner'
import Message from 'primevue/message'
import Button from 'primevue/button'
import D3BarChart from '@/components/D3BarChart.vue'
import D3TimeSeries from '@/components/D3TimeSeries.vue'
import BlurText from '@/components/BlurText.vue'
import { ProjectStatsService } from '@/service/ProjectStatsService'

const GREEN = '#15803d'
const GREEN_FILL = 'rgba(21, 128, 61, 0.15)'
const BLUE = '#2563eb'

const loading = ref(true)
const loadError = ref('')
const rows = ref([]) // [{ locality, goal, month }]
const total = ref(0)

// The three cross-filters. Each chart is driven by the OTHER two filters
// (never its own), so clicking a bar narrows the other charts while still
// letting you pick a different bar in the same chart afterwards.
const selectedLocality = ref(null)
const selectedGoal = ref(null)
const selectedRange = ref(null) // [startMonth, endMonth] | null

onMounted(() => {
  ProjectStatsService.getProjectStats()
    .then((data) => {
      total.value = data.total
      rows.value = data.rows
      loading.value = false
    })
    .catch(() => {
      loadError.value = 'Could not load community impact data right now. Please try again later.'
      loading.value = false
    })
})

function inRange(month, range) {
  if (!range) return true
  if (!month) return false
  return month >= range[0] && month <= range[1]
}
function matchesLocality(r) {
  return !selectedLocality.value || r.locality === selectedLocality.value
}
function matchesGoal(r) {
  return !selectedGoal.value || r.goal === selectedGoal.value
}
function matchesRange(r) {
  return inRange(r.month, selectedRange.value)
}

const localityRows = computed(() => rows.value.filter((r) => matchesGoal(r) && matchesRange(r)))
const goalRows = computed(() => rows.value.filter((r) => matchesLocality(r) && matchesRange(r)))
const timeRows = computed(() => rows.value.filter((r) => matchesLocality(r) && matchesGoal(r)))
const visibleRows = computed(() =>
  rows.value.filter((r) => matchesLocality(r) && matchesGoal(r) && matchesRange(r)),
)

function rollupCounts(list, key) {
  const counts = d3.rollup(
    list,
    (v) => v.length,
    (d) => d[key],
  )
  return Array.from(counts, ([label, count]) => ({ label, count })).sort(
    (a, b) => b.count - a.count,
  )
}

const localityCounts = computed(() => rollupCounts(localityRows.value, 'locality').slice(0, 12))
const goalCounts = computed(() => rollupCounts(goalRows.value, 'goal'))
const monthCounts = computed(() => {
  const counts = d3.rollup(
    timeRows.value.filter((r) => r.month),
    (v) => v.length,
    (d) => d.month,
  )
  return Array.from(counts, ([month, count]) => ({ month, count }))
})

function toggleLocality(label) {
  selectedLocality.value = selectedLocality.value === label ? null : label
}
function toggleGoal(label) {
  selectedGoal.value = selectedGoal.value === label ? null : label
}
function handleBrush(range) {
  selectedRange.value = range
}
function clearFilters() {
  selectedLocality.value = null
  selectedGoal.value = null
  selectedRange.value = null
}

const hasFilters = computed(
  () => !!(selectedLocality.value || selectedGoal.value || selectedRange.value),
)

function monthLabel(key) {
  const [year, month] = key.split('-')
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString(undefined, {
    month: 'short',
    year: 'numeric',
  })
}
</script>

<template>
  <div class="px-8 pt-10 mb-8 text-left">
    <BlurText tag="h1" text="Community Impact" class="text-4xl font-bold mb-2" />
    <TypeText
      tag="p"
      class="text-gray-500 mb-4"
      text="A live look at the garden projects our community has registered through the AI Garden Advisor.
      Click a bar, or drag across the timeline, to dig into a suburb, goal, or date range; the other
      charts filter to match."
      :loop="false"
      :typing-speed="20"
    />
  </div>

  <div class="impact-wrapper">
    <div v-if="loading" class="flex justify-center py-12">
      <ProgressSpinner />
    </div>

    <Message v-else-if="loadError" severity="error">{{ loadError }}</Message>

    <div v-else-if="!rows.length" class="card text-gray-500 py-8 text-center">
      No garden projects have been registered yet; once people start one from the AI Garden Advisor,
      these charts will fill in.
    </div>

    <template v-else>
      <div class="flex flex-wrap items-center justify-between gap-4 mb-4">
        <p class="text-lg">
          Showing <span class="font-semibold">{{ visibleRows.length }}</span> of
          <span class="font-semibold">{{ total }}</span> garden projects
        </p>
        <Button
          v-if="hasFilters"
          label="Clear filters"
          severity="secondary"
          outlined
          size="small"
          @click="clearFilters"
        />
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div class="card">
          <h2 class="text-lg font-semibold mb-1">By suburb</h2>
          <p class="text-sm text-gray-500 mb-3">Click a bar to filter the other charts.</p>
          <D3BarChart
            :data="localityCounts"
            :selected="selectedLocality"
            orientation="horizontal"
            :color="GREEN"
            @select="toggleLocality"
          />
        </div>
        <div class="card">
          <h2 class="text-lg font-semibold mb-1">By project goal</h2>
          <p class="text-sm text-gray-500 mb-3">Click a bar to filter the other charts.</p>
          <D3BarChart
            :data="goalCounts"
            :selected="selectedGoal"
            orientation="vertical"
            :color="BLUE"
            @select="toggleGoal"
          />
        </div>
      </div>

      <div class="card mb-6">
        <div class="flex items-center justify-between gap-2 mb-1">
          <h2 class="text-lg font-semibold">Over time</h2>
          <Button
            v-if="selectedRange"
            :label="`${monthLabel(selectedRange[0])} – ${monthLabel(selectedRange[1])} (clear)`"
            severity="secondary"
            text
            size="small"
            @click="selectedRange = null"
          />
        </div>
        <p class="text-sm text-gray-500 mb-3">Drag across the chart to filter by date range.</p>
        <D3TimeSeries
          :data="monthCounts"
          :selected-range="selectedRange"
          :color="GREEN"
          :fill="GREEN_FILL"
          @brush="handleBrush"
        />
      </div>

      <details class="card">
        <summary class="cursor-pointer text-sm text-gray-500">
          View current breakdown as tables
        </summary>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-3">
          <table class="impact-table">
            <thead>
              <tr>
                <th>Suburb</th>
                <th>Projects</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in localityCounts" :key="row.label">
                <td>{{ row.label }}</td>
                <td>{{ row.count }}</td>
              </tr>
            </tbody>
          </table>
          <table class="impact-table">
            <thead>
              <tr>
                <th>Goal</th>
                <th>Projects</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in goalCounts" :key="row.label">
                <td>{{ row.label }}</td>
                <td>{{ row.count }}</td>
              </tr>
            </tbody>
          </table>
          <table class="impact-table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Projects</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in monthCounts" :key="row.month">
                <td>{{ monthLabel(row.month) }}</td>
                <td>{{ row.count }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>
    </template>
  </div>
</template>

<style scoped>
.impact-wrapper {
  margin: 0 2rem 2rem;
}

.impact-table {
  width: 100%;
  border-collapse: collapse;
}

.impact-table th,
.impact-table td {
  text-align: left;
  padding: 0.4rem 0.6rem;
  border-bottom: 1px solid var(--p-surface-200, #e5e7eb);
}
</style>
