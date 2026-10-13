import { httpsCallable } from 'firebase/functions'
import { functions } from '@/firebase'

const getProjectStatsCallable = httpsCallable(functions, 'getProjectStats')

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_resolve, reject) => setTimeout(() => reject(new Error('timed out')), ms)),
  ])
}

export const ProjectStatsService = {
  /**
   * De-identified rows of garden projects (suburb, goal, signup month - never
   * an address, coordinates, or owner), for client-side cross-filtering.
   * @returns {Promise<{ total: number, rows: Array<{ locality: string, goal: string, month: string | null }> }>}
   */
  async getProjectStats() {
    const result = await withTimeout(getProjectStatsCallable(), 10000)
    return result.data
  },
}
