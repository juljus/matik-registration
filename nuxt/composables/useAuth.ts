import { ref, readonly } from 'vue'

interface GoogleUser {
  email?: string
  name?: string
  picture?: string
}

// Global reactive state for authentication
const isSignedIn = ref(false)
const user = ref<GoogleUser | null>(null)

export const useAuth = () => {
  // Initialize auth state from localStorage on first use
  const initializeAuth = () => {
    if (process.client) {
      const savedUser = localStorage.getItem('matik-user')
      const savedAuthState = localStorage.getItem('matik-auth')
      
      if (savedUser && savedAuthState === 'true') {
        try {
          user.value = JSON.parse(savedUser)
          isSignedIn.value = true
        } catch (error) {
          console.error('Error restoring auth state:', error)
          clearAuth()
        }
      }
    }
  }

  const setAuth = (userData: GoogleUser) => {
    user.value = userData
    isSignedIn.value = true
    
    if (process.client) {
      localStorage.setItem('matik-user', JSON.stringify(userData))
      localStorage.setItem('matik-auth', 'true')
    }
  }

  const clearAuth = () => {
    user.value = null
    isSignedIn.value = false
    
    if (process.client) {
      localStorage.removeItem('matik-user')
      localStorage.removeItem('matik-auth')
    }
  }

  return {
    isSignedIn: readonly(isSignedIn),
    user: readonly(user),
    initializeAuth,
    setAuth,
    clearAuth
  }
}
