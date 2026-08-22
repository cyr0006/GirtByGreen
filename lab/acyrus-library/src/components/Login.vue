<script setup>
import InputText from 'primevue/inputtext'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Label from 'primevue/label'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../stores/auth'

const router = useRouter()
const { login } = useAuth()

const credentials = ref({
  username: '',
  password: '',
})
const errorMessage = ref('')

const checkCredentials = () => {
  const success = login(credentials.value.username, credentials.value.password)
  if (success) {
    router.push('/')
  } else {
    errorMessage.value = 'Invalid username or password.'
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center">
    <div class="w-full max-w-sm">
      <Card>
        <template #title>Welcome back</template>
        <template #subtitle>Sign in with your email to continue.</template>
        <template #content>
          <form class="space-y-6 mt-3" @submit.prevent="checkCredentials">
            <div class="flex flex-col gap-2">
              <Label for="email">Email</Label>
              <InputText id="email" v-model="credentials.username" type="text" />
            </div>
            <div class="flex flex-col gap-2">
              <div class="flex items-center justify-between">
                <Label for="password" class="flex-1">Password</Label>
                <Button variant="link" class="p-0">Forgot password?</Button>
              </div>
              <InputText id="password" v-model="credentials.password" type="password" />
            </div>
            <p v-if="errorMessage" class="text-red-500 text-sm">{{ errorMessage }}</p>
          </form>
        </template>
        <template #footer>
          <div class="flex flex-col gap-4">
            <Button class="w-full" @click="checkCredentials">Login</Button>
            <Button severity="secondary" variant="outlined" class="w-full"
              >Login with Google</Button
            >
            <div class="mt-2 text-center text-surface-500 text-sm">
              Don't have an account?
              <Button variant="link" class="p-0">Sign up</Button>
            </div>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<style scoped></style>
