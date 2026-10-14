<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import Card from 'primevue/card'
import Chart from 'primevue/chart'
import ProgressSpinner from 'primevue/progressspinner'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import Button from 'primevue/button'
import { useConfirm } from 'primevue/useconfirm'
import ExclamationTriangle from '@primeicons/vue/exclamation-triangle'
import { AdminService } from '@/service/AdminService'
import { useAuth } from '@/composables/useAuth'
import BlurText from '@/components/BlurText.vue'
import TypeText from '@/components/TypeText.vue'

const confirm = useConfirm()
const { user } = useAuth()

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

const ROLE_SEVERITY = {
  user: 'info',
  org: 'success',
  admin: 'warn',
  unspecified: 'secondary',
}

function roleLabel(role) {
  return ROLE_LABELS[role] || role
}
function roleColor(role) {
  return ROLE_COLORS[role] || ROLE_COLORS.unspecified
}
function roleSeverity(role) {
  return ROLE_SEVERITY[role] || ROLE_SEVERITY.unspecified
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

const accounts = ref([])
const accountsError = ref('')
const actionBusyUid = ref('')
let unsubUsers = null

const currentUid = computed(() => user.value?.uid || '')

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

  unsubUsers = AdminService.listenToUsers(
    (rows) => {
      accounts.value = rows
    },
    () => {
      accountsError.value = "You don't have admin access, so accounts aren't available."
    },
  )
})

onUnmounted(() => {
  unsubUsers?.()
})

async function approve(account) {
  accountsError.value = ''
  actionBusyUid.value = account.uid
  try {
    await AdminService.approveOrganisation(account.uid)
  } catch (err) {
    accountsError.value = err?.message || 'Could not approve this account. Please try again.'
  } finally {
    actionBusyUid.value = ''
  }
}

async function deleteAccount(account) {
  accountsError.value = ''
  actionBusyUid.value = account.uid
  try {
    await AdminService.deleteUserAccount(account.uid)
  } catch (err) {
    accountsError.value = err?.message || 'Could not delete this account. Please try again.'
  } finally {
    actionBusyUid.value = ''
  }
}

function confirmDeleteAccount(account) {
  confirm.require({
    header: 'Delete account',
    message: `Delete ${account.name || account.email || 'this account'}? This cannot be undone.`,
    icon: ExclamationTriangle,
    acceptProps: { label: 'Delete', severity: 'danger' },
    rejectProps: { label: 'Cancel', severity: 'secondary' },
    accept: () => deleteAccount(account),
  })
}
</script>

<template>
  <div class="px-8 pt-10 mb-8 text-left">
    <BlurText tag="h1" text="Admin Dashboard" class="text-4xl font-bold mb-2" />
    <TypeText
      tag="p"
      class="text-gray-500 mb-4"
      text="An overview of accounts and activity across GirtByGreen."
      :loop="false"
      :typing-speed="20"
    />
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

      <div class="card mt-6">
        <h2 class="text-xl font-semibold mb-4">Manage accounts</h2>
        <Message v-if="accountsError" severity="error" class="mb-4">{{ accountsError }}</Message>
        <div v-if="!accounts.length" class="text-gray-500 py-8 text-center">No accounts found.</div>
        <div v-else class="overflow-x-auto">
          <table class="dashboard-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="account in accounts" :key="account.uid">
                <td>{{ account.name || '—' }}</td>
                <td>{{ account.email || '—' }}</td>
                <td>
                  <Tag
                    :value="roleLabel(account.role || 'unspecified')"
                    :severity="roleSeverity(account.role || 'unspecified')"
                  />
                </td>
                <td>
                  <Tag
                    v-if="account.role === 'org'"
                    :value="account.status === 'pending' ? 'Pending approval' : 'Approved'"
                    :severity="account.status === 'pending' ? 'warn' : 'success'"
                  />
                  <span v-else class="text-gray-400">—</span>
                </td>
                <td>
                  <div class="flex gap-2 justify-end">
                    <Button
                      v-if="account.role === 'org' && account.status === 'pending'"
                      label="Approve"
                      size="small"
                      severity="success"
                      :loading="actionBusyUid === account.uid"
                      @click="approve(account)"
                    />
                    <Button
                      v-if="account.uid !== currentUid"
                      label="Delete"
                      size="small"
                      severity="danger"
                      outlined
                      :loading="actionBusyUid === account.uid"
                      @click="confirmDeleteAccount(account)"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
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
