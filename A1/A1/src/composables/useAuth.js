import { ref, computed } from 'vue'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { getFirestore, doc, getDoc } from 'firebase/firestore'

const currentUser = ref(null)
const role = ref(null)
const ready = ref(false)

const auth = getAuth()
const db = getFirestore()

onAuthStateChanged(auth, async (firebaseUser) => {
  currentUser.value = firebaseUser

  if (firebaseUser) {
    const snapshot = await getDoc(doc(db, 'users', firebaseUser.uid))
    role.value = snapshot.exists() ? snapshot.data().role : null
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
