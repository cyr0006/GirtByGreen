<template>
  <div class="flex justify-center">
    <Card class="max-w-sm w-full">
      <template #title>Welcome back</template>
      <template #subtitle>Sign in with your email to continue.</template>
      <template #content>
        <form class="space-y-6 mt-3">
          <div class="flex flex-col gap-2">
            <Label for="email">Email</Label>
            <InputText id="email" v-model="email" type="email" />
          </div>
          <div class="flex flex-col gap-2">
            <div class="flex items-center justify-between">
              <Label for="password" class="flex-1">Password</Label>
              <Button variant="link" class="p-0">Forgot password?</Button>
            </div>
            <InputText id="password" v-model="password" type="password" />
          </div>
        </form>
      </template>
      <template #footer>
        <div class="flex flex-col gap-4">
          <Button class="w-full">Login</Button>
          <Button severity="secondary" variant="outlined" class="w-full">Login with Google</Button>
          <div class="mt-2 text-center text-surface-500 text-sm">
            Don't have an account?
            <Button variant="link" class="p-0">Sign up</Button>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Label from 'primevue/label'

const email = ref('')
const password = ref('')
</script>
