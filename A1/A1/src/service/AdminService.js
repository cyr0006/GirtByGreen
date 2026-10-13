import { httpsCallable } from 'firebase/functions'
import { getFirestore, collection, onSnapshot } from 'firebase/firestore'
import { functions } from '@/firebase'

const db = getFirestore()

const getAdminDashboardStatsCallable = httpsCallable(functions, 'getAdminDashboardStats')
const approveOrganisationCallable = httpsCallable(functions, 'approveOrganisation')
const deleteUserAccountCallable = httpsCallable(functions, 'deleteUserAccount')

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

  // Firestore rules let an admin read every users/{uid} doc (not just their
  // own), so this lists accounts directly via the client SDK rather than
  // another Admin SDK endpoint - real-time, same as the events listing.
  listenToUsers(callback, onError) {
    return onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        callback(snapshot.docs.map((d) => ({ uid: d.id, ...d.data() })))
      },
      onError,
    )
  },

  async approveOrganisation(uid) {
    const result = await withTimeout(approveOrganisationCallable({ uid }), 10000)
    return result.data
  },

  async deleteUserAccount(uid) {
    const result = await withTimeout(deleteUserAccountCallable({ uid }), 15000)
    return result.data
  },
}
