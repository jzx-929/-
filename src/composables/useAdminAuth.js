import { ref } from 'vue'

const ADMIN_TOKEN_KEY = 'admin_token'
const isAuthenticated = ref(false)

const API_BASE = import.meta.env.VITE_API_BASE || ''

const loadAuthState = () => {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY)
  isAuthenticated.value = !!token
}

loadAuthState()

export function useAdminAuth() {
  const login = async (password) => {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    })
    if (response.ok) {
      const data = await response.json()
      localStorage.setItem(ADMIN_TOKEN_KEY, data.token)
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
