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
              :invalid="touched.name && errors.name"
              @blur="touched.name = true"
            />
            <small v-if="touched.name && errors.name" class="text-red-500">{{
              errors.name
            }}</small>
          </div>
          <div class="flex flex-col gap-2">
            <Label for="email">Email</Label>
            <InputText
              id="email"
              v-model="email"
              type="email"
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
              :invalid="touched.confirmPassword && errors.confirmPassword"
              @blur="touched.confirmPassword = true"
            />
            <small v-if="touched.confirmPassword && errors.confirmPassword" class="text-red-500">{{
              errors.confirmPassword
            }}</small>
          </div>
          <Button type="submit" class="w-full">Register</Button>
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
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { useRouter } from 'vue-router'

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const router = useRouter()
const auth = getAuth()

const register = () => {
  createUserWithEmailAndPassword(auth, email.value, password.value)
    .then((data) => {
      const user = data.user
      return updateProfile(user, { displayName: name.value }).then(() => user)
    })
    .then((user) => {
      console.log('User registered:', user)
      router.push('/FireLogin')
    })
    .catch((error) => {
      const errorCode = error.code
      const errorMessage = error.message
      console.error('Error registering user:', errorCode, errorMessage)
    })
}

//Form Validation
const touched = reactive({
  name: false,
  email: false,
  password: false,
  confirmPassword: false,
})

const errors = computed(() => ({
  name: !name.value ? 'Name is required.' : '',
  email: !email.value
    ? 'Email is required.'
    : !/\S+@\S+\.\S+/.test(email.value)
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
}))

function handleRegister() {
  touched.name = true
  touched.email = true
  touched.password = true
  touched.confirmPassword = true

  if (errors.value.name || errors.value.email || errors.value.password || errors.value.confirmPassword) return

  register()
}
</script>
