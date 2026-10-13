<template>
  <div class="flex justify-center items-center min-h-[calc(100vh-80px)]">
    <Card class="max-w-sm w-full">
      <template #title>Welcome back</template>
      <template #subtitle>Sign in with your email to continue.</template>
      <template #content>
        <form class="space-y-6 mt-3" @submit.prevent="handleLogin">
          <div class="flex flex-col gap-2">
            <Label for="email">Email</Label>
            <InputText
              id="email"
              v-model="email"
              type="email"
              autocomplete="email"
              maxlength="254"
              :invalid="touched.email && errors.email"
              @blur="touched.email = true"
            />
            <small v-if="touched.email && errors.email" class="text-red-500">{{
              errors.email
            }}</small>
          </div>
          <div class="flex flex-col gap-2">
            <div class="flex items-center justify-between">
              <Label for="password" class="flex-1">Password</Label>
              <Button variant="link" class="p-0">Forgot password?</Button>
            </div>
            <InputText
              id="password"
              v-model="password"
              type="password"
              autocomplete="current-password"
              maxlength="128"
              :invalid="touched.password && errors.password"
              @blur="touched.password = true"
            />
            <small v-if="touched.password && errors.password" class="text-red-500">{{
              errors.password
            }}</small>
          </div>
          <Message v-if="submitError" severity="error" :closable="false">{{
            submitError
          }}</Message>
        </form>
      </template>
      <template #footer>
        <div class="flex flex-col gap-4">
          <Button type="submit" class="w-full" :loading="submitting" @click="handleLogin"
            >Login</Button
          >
          <Button
            type="button"
            severity="secondary"
            variant="outlined"
            class="w-full"
            :loading="googleSubmitting"
            @click="handleGoogleSignIn"
            >Login with Google</Button
          >
          <div class="mt-2 text-center text-surface-500 text-sm">
            Don't have an account?
            <Button variant="link" class="p-0" @click="router.push('/FireRegister')"
              >Sign up</Button
            >
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Label from 'primevue/label'
import Message from 'primevue/message'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { useRouter } from 'vue-router'
import { EMAIL_REGEX, trimmed } from '../utils/validation'
import { useGoogleAuth } from '../composables/useGoogleAuth'

const email = ref('')
const password = ref('')
const router = useRouter()
const auth = getAuth()
const { signInWithGoogle, saveGoogleUserRole, googleAuthErrorMessage } = useGoogleAuth()

const submitting = ref(false)
const submitError = ref('')
const googleSubmitting = ref(false)

function authErrorMessage(code) {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Incorrect email or password.'
    case 'auth/invalid-email':
      return 'Please enter a valid email address.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.'
    default:
      return 'Something went wrong while signing in. Please try again.'
  }
}

async function signin() {
  submitting.value = true
  submitError.value = ''

  try {
    const { user } = await signInWithEmailAndPassword(auth, trimmed(email.value), password.value)
    console.log('User signed in:', user.uid)
    router.push('/')
  } catch (error) {
    console.error('Error signing in user:', error.code, error.message)
    submitError.value = authErrorMessage(error.code)
  } finally {
    submitting.value = false
  }
}

async function handleGoogleSignIn() {
  googleSubmitting.value = true
  submitError.value = ''

  try {
    const { user, isNewUser } = await signInWithGoogle()
    if (isNewUser) {
      // No role selector on the login form - default to 'user' (a brand-new
      // Google sign-in here reads as "I don't have an account yet, let me
      // in" rather than deliberately registering as an organisation).
      await saveGoogleUserRole(user, 'user')
    }
    console.log('User signed in with Google:', user.uid)
    router.push('/')
  } catch (error) {
    console.error('Google sign-in failed:', error.code, error.message)
    const message = googleAuthErrorMessage(error.code)
    if (message) submitError.value = message
  } finally {
    googleSubmitting.value = false
  }
}

const touched = reactive({ email: false, password: false })

const errors = computed(() => ({
  email: !email.value
    ? 'Email is required.'
    : !EMAIL_REGEX.test(email.value)
      ? 'Enter a valid email.'
      : '',
  password: !password.value ? 'Password is required.' : '',
}))

function handleLogin() {
  touched.email = true
  touched.password = true

  if (errors.value.email || errors.value.password) return

  signin()
}
</script>
