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
              :invalid="touched.password && errors.password"
              @blur="touched.password = true"
            />
            <small v-if="touched.password && errors.password" class="text-red-500">{{
              errors.password
            }}</small>
          </div>
        </form>
      </template>
      <template #footer>
        <div class="flex flex-col gap-4">
          <Button @click="register" type="submit" class="w-full">Sign Up</Button>
          <Button type="button" severity="secondary" variant="outlined" class="w-full"
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
import { ref } from 'vue'
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth'
import { useRouter } from 'vue-router'

const email = ref('')
const password = ref('')
const router = useRouter()
const auth = getAuth()

const register = () => {
  createUserWithEmailAndPassword(auth, email.value, password.value)
    .then((data) => {
      // Signed in
      const user = data.user
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
const touched = reactive({ email: false, password: false })

const errors = computed(() => ({
  email: !email.value
    ? 'Email is required.'
    : !/\S+@\S+\.\S+/.test(email.value)
      ? 'Enter a valid email.'
      : '',
  password: !password.value ? 'Password is required.' : '',
}))

function handleLogin() {
  touched.email = true
  touched.password = true

  if (errors.value.email || errors.value.password) return

  alert('Sign in successful!')
}
</script>
