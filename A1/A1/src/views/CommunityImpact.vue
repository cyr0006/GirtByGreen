<script setup>
import { ref, computed, onMounted } from 'vue'
import Chart from 'primevue/chart'
import SelectButton from 'primevue/selectbutton'
import ProgressSpinner from 'primevue/progressspinner'
import Message from 'primevue/message'
import ChartBar from '@primeicons/vue/chart-bar'
import ChartPie from '@primeicons/vue/chart-pie'
import ChartLine from '@primeicons/vue/chart-line'
import { ProjectStatsService } from '@/service/ProjectStatsService'

const GREEN = '#15803d'
const GREEN_FILL = 'rgba(21, 128, 61, 0.15)'

const loading = ref(true)
const loadError = ref('')
const stats = ref({ total: 0, byLocality: [], byGoal: [], byMonth: [] })

const views = [
  { value: 'locality', label: 'By suburb', icon: ChartBar },
  { value: 'goal', label: 'By project goal', icon: ChartPie },
  { value: 'month', label: 'Over time', icon: ChartLine },
]
const selectedView = ref('locality')

function monthLabel(key) {
  const [year, month] = key.split('-')
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString(undefined, {
    month: 'short',
    year: 'numeric',
  })
}

const rows = computed(() => {
  if (selectedView.value === 'locality') return stats.value.byLocality
  if (selectedView.value === 'goal') return stats.value.byGoal
  return stats.value.byMonth
})

const chartType = computed(() => (selectedView.value === 'month' ? 'line' : 'bar'))

const chartData = computed(() => {
  const labels = rows.value.map((r) => (selectedView.value === 'month' ? monthLabel(r.label) : r.label))
  const counts = rows.value.map((r) => r.count)

  return {
    labels,
    datasets: [
      {
        label: 'Garden projects',
        data: counts,
        backgroundColor: chartType.value === 'line' ? GREEN_FILL : GREEN,
        borderColor: GREEN,
        borderWidth: 2,
        borderRadius: chartType.value === 'bar' ? 4 : 0,
        fill: chartType.value === 'line',
        tension: 0.3,
        pointRadius: chartType.value === 'line' ? 4 : 0,
        pointBackgroundColor: GREEN,
      },
    ],
  }
})

const chartOptions = computed(() => ({
  indexAxis: selectedView.value === 'locality' ? 'y' : 'x',
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { mode: 'nearest', intersect: true },
  },
  scales: {
    x: { ticks: { precision: 0 }, grid: { color: 'rgba(0,0,0,0.05)' } },
    y: { ticks: { precision: 0 }, grid: { color: 'rgba(0,0,0,0.05)' } },
  },
}))

onMounted(() => {
  ProjectStatsService.getProjectStats()
    .then((data) => {
      stats.value = data
      loading.value = false
    })
    .catch(() => {
      loadError.value = 'Could not load community impact data right now. Please try again later.'
      loading.value = false
    })
})
</script>

<template>
  <div class="px-8 pt-10 mb-8 text-left">
    <h1 class="text-4xl font-bold mb-2">Community Impact</h1>
    <p class="text-gray-500 mb-4">
      A live look at the garden projects our community has registered through the AI Garden
      Advisor — where they are, what they're growing for, and how the movement is growing.
    </p>
  </div>

  <div class="impact-wrapper">
    <div v-if="loading" class="flex justify-center py-12">
      <ProgressSpinner />
    </div>

    <Message v-else-if="loadError" severity="error">{{ loadError }}</Message>

    <template v-else>
      <div class="card">
        <div class="flex flex-wrap items-center justify-between gap-4 mb-4">
          <p class="text-lg">
            <span class="font-semibold">{{ stats.total }}</span> garden projects registered so far
          </p>
          <SelectButton
            v-model="selectedView"
            :options="views"
            optionLabel="label"
            optionValue="value"
            :allowEmpty="false"
          >
            <template #option="{ option }">
              <component :is="option.icon" class="mr-2" style="width: 1rem; height: 1rem" />
              {{ option.label }}
            </template>
          </SelectButton>
        </div>

        <div v-if="rows.length === 0" class="text-gray-500 py-8 text-center">
          No garden projects have been registered yet — once people start one from the AI Garden
          Advisor, this chart will fill in.
        </div>
        <template v-else>
          <div style="height: 22rem">
            <Chart :type="chartType" :data="chartData" :options="chartOptions" />
          </div>

          <details class="mt-4">
            <summary class="cursor-pointer text-sm text-gray-500">View as table</summary>
            <table class="impact-table mt-2">
              <thead>
                <tr>
                  <th>{{ views.find((v) => v.value === selectedView).label }}</th>
                  <th>Projects</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in rows" :key="row.label">
                  <td>{{ selectedView === 'month' ? monthLabel(row.label) : row.label }}</td>
                  <td>{{ row.count }}</td>
                </tr>
              </tbody>
            </table>
          </details>
        </template>
      </div>
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
