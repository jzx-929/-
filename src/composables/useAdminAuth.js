import { ref } from 'vue'

const ADMIN_TOKEN_KEY = 'admin_token'
const ADMIN_PASSWORD = 'admin123'

const isAuthenticated = ref(false)

const loadAuthState = () => {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY)
  isAuthenticated.value = token === ADMIN_PASSWORD
}

loadAuthState()

export function useAdminAuth() {
  const login = (password) => {
    if (password === ADMIN_PASSWORD) {
      localStorage.setItem(ADMIN_TOKEN_KEY, ADMIN_PASSWORD)
      isAuthenticated.value = true
      return true
    }
    return false
  }

  const logout = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY)
    isAuthenticated.value = false
  }

  const checkAuth = () => {
    return isAuthenticated.value
  }

  return {
    isAuthenticated,
    login,
    logout,
    checkAuth
  }
}