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
   * Aggregated, de-identified counts of garden projects grouped by suburb,
   * goal, and signup month. Never includes addresses, coordinates or owners.
   * @returns {Promise<{ total: number, byLocality: Array<{label:string,count:number}>, byGoal: Array<{label:string,count:number}>, byMonth: Array<{label:string,count:number}> }>}
   */
  async getProjectStats() {
    const result = await withTimeout(getProjectStatsCallable(), 10000)
    return result.data
  },
}
