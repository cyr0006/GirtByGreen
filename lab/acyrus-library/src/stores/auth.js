import { ref } from 'vue'

const HARDCODED_CREDENTIALS = {
  username: 'User123',
  password: '123456',
}

const isLoggedIn = ref(false)

export function useAuth() {
  const login = (username, password) => {
    if (
      username === HARDCODED_CREDENTIALS.username &&
      password === HARDCODED_CREDENTIALS.password
    ) {
      isLoggedIn.value = true
      return true
    }
    return false
  }

  const logout = () => {
    isLoggedIn.value = false
  }

  return { isLoggedIn, login, logout }
}
