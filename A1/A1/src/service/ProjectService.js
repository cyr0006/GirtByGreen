import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
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
