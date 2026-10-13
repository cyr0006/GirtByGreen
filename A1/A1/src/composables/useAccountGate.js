import { getAuth, signOut } from 'firebase/auth'
import { getFirestore, doc, getDoc } from 'firebase/firestore'

const auth = getAuth()
const db = getFirestore()

export const PENDING_ORG_MESSAGE =
  "Your organisation account is still waiting on admin approval. You'll be able to sign in once it's approved."

// Firebase Auth has no concept of "pending" - signing in always succeeds at
// that layer, so the only way to block a pending org is to sign them back
// out immediately once we've read their Firestore role/status.
export async function rejectIfPendingOrg(user) {
  const snap = await getDoc(doc(db, 'users', user.uid))
  const data = snap.exists() ? snap.data() : null
  if (data?.role === 'org' && data?.status === 'pending') {
    await signOut(auth)
    return true
  }
  return false
}
