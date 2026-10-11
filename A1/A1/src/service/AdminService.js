import { httpsCallable } from 'firebase/functions'
import { functions } from '@/firebase'

const getAdminDashboardStatsCallable = httpsCallable(functions, 'getAdminDashboardStats')

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_resolve, reject) => setTimeout(() => reject(new Error('timed out')), ms)),
  ])
}

export const AdminService = {
  /**
   * Admin-only aggregate counts for the dashboard: total users, a breakdown
   * by account type, and the total number of garden projects registered.
   * Throws if the caller isn't signed in as an admin.
   * @returns {Promise<{ totalUsers: number, usersByRole: Array<{label:string,count:number}>, totalGardenProjects: number }>}
   */
  async getAdminDashboardStats() {
    const result = await withTimeout(getAdminDashboardStatsCallable(), 10000)
    return result.data
  },
}
