import { ref, readonly } from 'vue'

interface GoogleUser {
  email?: string
  name?: string
  picture?: string
}

interface UserStatus {
  email: string
  isRegistered: boolean
  isAdmin: boolean
  user: any | null
}

// Global reactive state for authentication
const isSignedIn = ref(false)
const user = ref<GoogleUser | null>(null)
const userStatus = ref<UserStatus | null>(null)

export const useAuth = () => {
  // Initialize auth state from localStorage on first use
  const initializeAuth = async () => {
    if (process.client) {
      const savedUser = localStorage.getItem('matik-user')
      const savedAuthState = localStorage.getItem('matik-auth')
      
      if (savedUser && savedAuthState === 'true') {
        try {
          const userData = JSON.parse(savedUser)
          user.value = userData
          isSignedIn.value = true
          
          // Verify user status with backend
          await checkUserStatus()
        } catch (error) {
          console.error('Error restoring auth state:', error)
          clearAuth()
        }
      }
    }
  }

  const checkUserStatus = async () => {
    try {
      const savedUser = localStorage.getItem('matik-user')
      if (!savedUser) return

      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${btoa(savedUser)}`
        }
      })

      if (res.ok) {
        userStatus.value = await res.json()
      }
    } catch (error) {
      console.error('Error checking user status:', error)
    }
  }

  const requestSignup = async () => {
    try {
      const savedUser = localStorage.getItem('matik-user')
      if (!savedUser) throw new Error('No user data available')

      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${btoa(savedUser)}`
        }
      })

      const result = await res.json()
      return result
    } catch (error) {
      console.error('Error requesting signup:', error)
      throw error
    }
  }

  const setAuth = async (userData: GoogleUser) => {
    user.value = userData
    isSignedIn.value = true
    
    if (process.client) {
      localStorage.setItem('matik-user', JSON.stringify(userData))
      localStorage.setItem('matik-auth', 'true')
    }

    // Check user status after authentication
    await checkUserStatus()
  }

  const clearAuth = () => {
    user.value = null
    isSignedIn.value = false
    userStatus.value = null
    
    if (process.client) {
      localStorage.removeItem('matik-user')
      localStorage.removeItem('matik-auth')
    }
  }

  return {
    isSignedIn: readonly(isSignedIn),
    user: readonly(user),
    userStatus: readonly(userStatus),
    initializeAuth,
    setAuth,
    clearAuth,
    checkUserStatus,
    requestSignup
  }
}
