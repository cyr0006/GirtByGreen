<template>
  <div class="flex justify-center items-center min-h-[calc(100vh-80px)]">
    <Card class="max-w-sm w-full">
      <template #title>Welcome!</template>
      <template #subtitle>Register with your email to continue.</template>
      <template #content>
        <form class="space-y-6 mt-3" @submit.prevent="handleRegister">
          <div class="flex flex-col gap-2">
            <Label for="name">Name</Label>
            <InputText
              id="name"
              v-model="name"
              type="text"
              autocomplete="name"
              maxlength="100"
              :invalid="touched.name && errors.name"
              @blur="touched.name = true"
            />
            <small v-if="touched.name && errors.name" class="text-red-500">{{ errors.name }}</small>
          </div>
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
            </div>
            <InputText
              id="password"
              v-model="password"
              type="password"
              autocomplete="new-password"
              maxlength="128"
              :invalid="touched.password && errors.password"
              @blur="touched.password = true"
            />
            <small v-if="touched.password && errors.password" class="text-red-500">{{
              errors.password
            }}</small>
          </div>
          <div class="flex flex-col gap-2">
            <Label for="confirmPassword">Confirm Password</Label>
            <InputText
              id="confirmPassword"
              v-model="confirmPassword"
              type="password"
              autocomplete="new-password"
              maxlength="128"
              :invalid="touched.confirmPassword && errors.confirmPassword"
              @blur="touched.confirmPassword = true"
            />
            <small v-if="touched.confirmPassword && errors.confirmPassword" class="text-red-500">{{
              errors.confirmPassword
            }}</small>
          </div>
          <div class="flex flex-col gap-2">
            <Label for="role">I am registering as</Label>
            <SelectButton
              id="role"
              v-model="role"
              :options="roleOptions"
              optionLabel="label"
              optionValue="value"
              :invalid="touched.role && errors.role"
              class="w-full"
              @change="touched.role = true"
            />
            <small v-if="touched.role && errors.role" class="text-red-500">{{ errors.role }}</small>
          </div>
          <Message v-if="submitError" severity="error" :closable="false">{{ submitError }}</Message>
          <Button type="submit" class="w-full" :loading="submitting">Register</Button>
        </form>
      </template>
      <template #footer>
        <div class="flex flex-col gap-4">
          <Button type="button" severity="secondary" variant="outlined" class="w-full"
            >Register with Google</Button
          >
          <div class="mt-2 text-center text-surface-500 text-sm">
            Back to Sign In?
            <Button variant="link" class="p-0" @click="router.push('/SignIn')">Sign up</Button>
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
import SelectButton from 'primevue/selectbutton'
import Message from 'primevue/message'
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { getFirestore, doc, setDoc } from 'firebase/firestore'
import { useRouter } from 'vue-router'
import { EMAIL_REGEX, trimmed, containsHtml } from '../utils/validation'

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const role = ref(null)
const roleOptions = ref([
  { label: 'User', value: 'user' },
  { label: 'Organisation', value: 'org' },
])
const router = useRouter()
const auth = getAuth()
const db = getFirestore()

const submitting = ref(false)
const submitError = ref('')

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_resolve, reject) => setTimeout(() => reject(new Error('timed out')), ms)),
  ])
}

function authErrorMessage(code) {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Please sign in instead.'
    case 'auth/invalid-email':
      return 'Please enter a valid email address.'
    case 'auth/weak-password':
      return 'Password is too weak. Please choose a stronger password.'
    default:
      return 'Something went wrong while registering. Please try again.'
  }
}

async function register() {
  submitting.value = true
  submitError.value = ''

  const cleanName = trimmed(name.value)
  const cleanEmail = trimmed(email.value)

  try {
    const { user } = await createUserWithEmailAndPassword(auth, cleanEmail, password.value)
    await updateProfile(user, { displayName: cleanName })

    try {
      await withTimeout(
        setDoc(doc(db, 'users', user.uid), {
          name: cleanName,
          email: cleanEmail,
          role: role.value,
        }),
        5000,
      )
    } catch (roleError) {
      console.error('Failed to save account role:', roleError)
    }

    console.log('User registered:', user.uid)
    router.push('/')
  } catch (error) {
    console.error('Error registering user:', error.code, error.message)
    submitError.value = authErrorMessage(error.code)
  } finally {
    submitting.value = false
  }
}

//Form Validation
const touched = reactive({
  name: false,
  email: false,
  password: false,
  confirmPassword: false,
  role: false,
})

const errors = computed(() => ({
  name: !name.value.trim()
    ? 'Name is required.'
    : containsHtml(name.value)
      ? 'Name cannot contain < or > characters.'
      : '',
  email: !email.value
    ? 'Email is required.'
    : !EMAIL_REGEX.test(email.value)
      ? 'Enter a valid email.'
      : '',
  password: !password.value
    ? 'Password is required.'
    : password.value.length < 6
      ? 'Password must be at least 6 characters.'
      : '',
  confirmPassword: !confirmPassword.value
    ? 'Please confirm your password.'
    : confirmPassword.value !== password.value
      ? 'Passwords do not match.'
      : '',
  role: !role.value ? 'Please select an account type.' : '',
}))

function handleRegister() {
  touched.name = true
  touched.email = true
  touched.password = true
  touched.confirmPassword = true
  touched.role = true

  if (
    errors.value.name ||
    errors.value.email ||
    errors.value.password ||
    errors.value.confirmPassword ||
    errors.value.role
  )
    return

  register()
}
</script>
