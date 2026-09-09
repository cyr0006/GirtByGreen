import { ref, computed } from 'vue'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { getFirestore, doc, getDoc } from 'firebase/firestore'

const currentUser = ref(null)
const role = ref(null)
const ready = ref(false)

const auth = getAuth()
const db = getFirestore()

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_resolve, reject) => setTimeout(() => reject(new Error('timed out')), ms)),
  ])
}

onAuthStateChanged(auth, async (firebaseUser) => {
  currentUser.value = firebaseUser

  if (firebaseUser) {
    try {
      const snapshot = await withTimeout(getDoc(doc(db, 'users', firebaseUser.uid)), 5000)
      role.value = snapshot.exists() ? snapshot.data().role : null
    } catch (error) {
      console.error('Failed to load account role:', error)
      role.value = null
    }
  } else {
    role.value = null
  }

  ready.value = true
})

export function useAuth() {
  return {
    user: currentUser,
    role,
    ready,
    isOrg: computed(() => role.value === 'org'),
    isUser: computed(() => role.value === 'user'),
  }
}
