<script setup>
import { ref } from 'vue'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { useRouter } from 'vue-router'

const email = ref('')
const password = ref('')
const router = useRouter()
const auth = getAuth()

const signin = () => {
  signInWithEmailAndPassword(auth, email.value, password.value)
    .then((data) => {
      // Signed in
      const user = data.user
      console.log('User signed in:', user)
      router.push('/FireLogin')
    })
    .catch((error) => {
      const errorCode = error.code
      const errorMessage = error.message
      console.error('Error signing in user:', errorCode, errorMessage)
    })
}
</script>

<template>
  <h1>Sign In</h1>
  <p><input type="text" placeholder="Email" v-model="email" /></p>
  <p><input type="password" placeholder="Password" v-model="password" /></p>
  <p><Button @click="signin">Sign In with Firebase</Button></p>
</template>
