import { getAuth, GoogleAuthProvider, signInWithPopup, getAdditionalUserInfo } from 'firebase/auth'
import { getFirestore, doc, setDoc } from 'firebase/firestore'

const auth = getAuth()
const db = getFirestore()

export function useGoogleAuth() {
  async function signInWithGoogle() {
    const provider = new GoogleAuthProvider()
    const result = await signInWithPopup(auth, provider)
    return { user: result.user, isNewUser: !!getAdditionalUserInfo(result)?.isNewUser }
  }

  // Only called for brand-new Google sign-ins - an existing account already
  // has a users/{uid} doc (with whatever role it was created with) and this
  // must not clobber it.
  async function saveGoogleUserRole(user, role, { pending = false } = {}) {
    try {
      await setDoc(doc(db, 'users', user.uid), {
        name: user.displayName || '',
        email: user.email || '',
        role,
        ...(pending ? { status: 'pending' } : {}),
      })
    } catch (error) {
      console.error('Failed to save account role:', error)
    }
  }

  // Empty string means "don't show an error" (e.g. the user just closed the popup).
  function googleAuthErrorMessage(code) {
    switch (code) {
      case 'auth/account-exists-with-different-credential':
        return 'An account with this email already exists. Please sign in with your password instead.'
      case 'auth/popup-closed-by-user':
      case 'auth/cancelled-popup-request':
        return ''
      default:
        return 'Something went wrong signing in with Google. Please try again.'
    }
  }

  return { signInWithGoogle, saveGoogleUserRole, googleAuthErrorMessage }
}
