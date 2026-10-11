<script setup>
import { ref, computed, onMounted } from 'vue'
import Card from 'primevue/card'
import Chart from 'primevue/chart'
import ProgressSpinner from 'primevue/progressspinner'
import Message from 'primevue/message'
import { AdminService } from '@/service/AdminService'

const loading = ref(true)
const loadError = ref('')
const stats = ref({ totalUsers: 0, usersByRole: [], totalGardenProjects: 0 })

// Fixed categorical colours per account type - never cycled, so "org" is
// always this blue and "admin" is always this amber no matter the order the
// API returns them in.
const ROLE_COLORS = {
  user: '#2563eb',
  org: '#15803d',
  admin: '#d97706',
  unspecified: '#6b7280',
}
const ROLE_LABELS = {
  user: 'User',
  org: 'Organisation',
  admin: 'Admin',
  unspecified: 'Unspecified',
}

function roleLabel(role) {
  return ROLE_LABELS[role] || role
}
function roleColor(role) {
  return ROLE_COLORS[role] || ROLE_COLORS.unspecified
}

const chartData = computed(() => ({
  labels: stats.value.usersByRole.map((r) => roleLabel(r.label)),
  datasets: [
    {
      label: 'Users',
      data: stats.value.usersByRole.map((r) => r.count),
      backgroundColor: stats.value.usersByRole.map((r) => roleColor(r.label)),
      borderRadius: 4,
    },
  ],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { mode: 'nearest', intersect: true },
  },
  scales: {
    x: { grid: { display: false } },
    y: { ticks: { precision: 0 }, grid: { color: 'rgba(0,0,0,0.05)' } },
  },
}

onMounted(() => {
  AdminService.getAdminDashboardStats()
    .then((data) => {
      stats.value = data
      loading.value = false
    })
    .catch((err) => {
      loadError.value =
        err?.code === 'functions/permission-denied'
          ? "You don't have admin access, so this dashboard isn't available."
          : 'Could not load dashboard stats right now. Please try again later.'
      loading.value = false
    })
})
</script>

<template>
  <div class="px-8 pt-10 mb-8 text-left">
    <h1 class="text-4xl font-bold mb-2">Admin Dashboard</h1>
    <p class="text-gray-500 mb-4">An overview of accounts and activity across GirtByGreen.</p>
  </div>

  <div class="dashboard-wrapper">
    <div v-if="loading" class="flex justify-center py-12">
      <ProgressSpinner />
    </div>

    <Message v-else-if="loadError" severity="error">{{ loadError }}</Message>

    <template v-else>
      <div class="stat-grid mb-6">
        <Card>
          <template #title>Total users</template>
          <template #content>
            <p class="text-4xl font-bold">{{ stats.totalUsers }}</p>
          </template>
        </Card>
        <Card>
          <template #title>Garden projects registered</template>
          <template #content>
            <p class="text-4xl font-bold">{{ stats.totalGardenProjects }}</p>
          </template>
        </Card>
      </div>

      <div class="card">
        <h2 class="text-xl font-semibold mb-4">Users by account type</h2>
        <div v-if="stats.usersByRole.length === 0" class="text-gray-500 py-8 text-center">
          No users found.
        </div>
        <template v-else>
          <div style="height: 18rem">
            <Chart type="bar" :data="chartData" :options="chartOptions" />
          </div>

          <details class="mt-4">
            <summary class="cursor-pointer text-sm text-gray-500">View as table</summary>
            <table class="dashboard-table mt-2">
              <thead>
                <tr>
                  <th>Account type</th>
                  <th>Users</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in stats.usersByRole" :key="row.label">
                  <td>{{ roleLabel(row.label) }}</td>
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
.dashboard-wrapper {
  margin: 0 2rem 2rem;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
  gap: 1rem;
}

.dashboard-table {
  width: 100%;
  border-collapse: collapse;
}

.dashboard-table th,
.dashboard-table td {
  text-align: left;
  padding: 0.4rem 0.6rem;
  border-bottom: 1px solid var(--p-surface-200, #e5e7eb);
}
</style>
