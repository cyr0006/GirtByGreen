import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/firebase'

const db = getFirestore()
const auth = getAuth()

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_resolve, reject) => setTimeout(() => reject(new Error('timed out')), ms)),
  ])
}

const sendProjectChatMessageCallable = httpsCallable(functions, 'sendProjectChatMessage')
const deleteProjectCallable = httpsCallable(functions, 'deleteProject')

export const ProjectService = {
  async createProject({ address, lat, lng, locality, goal, conditions }) {
    const uid = auth.currentUser?.uid
    if (!uid) throw new Error('You must be signed in to create a project.')

    const ref = doc(collection(db, 'projects'))
    await withTimeout(
      setDoc(ref, {
        ownerId: uid,
        address,
        lat,
        lng,
        locality,
        goal,
        conditions,
        enrichment: null,
        createdAt: serverTimestamp(),
      }),
      5000,
    )
    return ref.id
  },

  // Goal/conditions only - the address (and the enrichment derived from it)
  // is immutable after creation; Firestore rules enforce the same split.
  async updateProject(projectId, { goal, conditions }) {
    const uid = auth.currentUser?.uid
    if (!uid) throw new Error('You must be signed in to edit a project.')
    await withTimeout(updateDoc(doc(db, 'projects', projectId), { goal, conditions }), 5000)
  },

  // Owner-only (enforced server-side) - also removes the chat message
  // history, which a plain client delete of the project doc can't reach.
  async deleteProject(projectId) {
    const result = await deleteProjectCallable({ projectId })
    return result.data
  },

  async getProject(projectId) {
    const snapshot = await withTimeout(getDoc(doc(db, 'projects', projectId)), 5000)
    return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null
  },

  async listMyProjects(uid) {
    const snapshot = await withTimeout(
      getDocs(query(collection(db, 'projects'), where('ownerId', '==', uid))),
      5000,
    )
    const projects = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
    // Sorted client-side to avoid a Firestore composite-index requirement
    // that a where + orderBy query would otherwise force.
    projects.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0))
    return projects
  },

  listenToMessages(projectId, callback) {
    const messagesQuery = query(
      collection(db, 'projects', projectId, 'messages'),
      orderBy('createdAt'),
    )
    return onSnapshot(messagesQuery, (snapshot) => {
      callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
  },

  async sendChatMessage({ projectId, message, plantsContext }) {
    const result = await sendProjectChatMessageCallable({ projectId, message, plantsContext })
    return result.data
  },
}
