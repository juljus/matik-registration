<template>
  <div class="layout-container">
    <!-- Modular Navigation Bar -->
    <nav class="navbar-module">
      <div class="navbar-content">
        <h1 class="logo">Matik Key Registration</h1>
        <div class="nav-center">
          <div v-if="isSignedIn" class="nav-links">
            <NuxtLink to="/" class="nav-link">🏠 Home</NuxtLink>
            <NuxtLink v-if="userStatus?.isAdmin" to="/admin" class="nav-link">⚙️ Admin</NuxtLink>
          </div>
        </div>
        <div class="auth-section">
          <GoogleSignInButton v-if="!isSignedIn" @success="handleSignInSuccess" @error="handleSignInError" />
          <div v-else class="user-info">
            <div class="user-details">
              <img v-if="user?.picture" :src="user.picture" alt="Profile" class="user-avatar" />
              <div class="user-text">
                <span class="user-name">{{ user?.name || 'User' }}</span>
                <span class="user-email">{{ user?.email }}</span>
              </div>
            </div>
            <button @click="signOut" class="sign-out-btn">Sign out</button>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content Area -->
    <main class="main-content">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

const { isSignedIn, user, userStatus, initializeAuth, setAuth, clearAuth } = useAuth()

// Initialize auth state on app load
onMounted(() => {
  initializeAuth()
})

function handleSignInSuccess(response: any) {
  console.log('Login success:', response)
  
  let userData = null
  
  // The response contains credential with user info
  if (response.credential) {
    // Decode the JWT credential to get user info
    const payload = JSON.parse(atob(response.credential.split('.')[1]))
    userData = {
      email: payload.email,
      name: payload.name,
      picture: payload.picture
    }
  } else {
    // Fallback if credential structure is different
    userData = {
      email: response.email || response.user?.email || 'Unknown',
      name: response.name || response.user?.name,
      picture: response.picture || response.user?.picture
    }
  }
  
  setAuth(userData)
}

function handleSignInError(error: any) {
  console.error('Login error:', error)
  clearAuth()
}

function signOut() {
  clearAuth()
}
</script>

<style scoped>
/* Remove all white borders and create modular design */
.layout-container {
  min-height: 100vh;
  background: #0f1114;
  color: #f1f1f1;
  display: flex;
  flex-direction: column;
  font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
  padding: 1rem;
  gap: 1rem;
  margin: 0;
  box-sizing: border-box;
}

/* Modular Navigation Bar */
.navbar-module {
  background: #1a1d23;
  border-radius: 1rem;
  padding: 1rem 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  border: 1px solid #2a2d36;
}

.navbar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
}

.logo {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 700;
  letter-spacing: 1px;
  color: #ffffff;
  white-space: nowrap;
}

.nav-center {
  flex: 1;
  display: flex;
  justify-content: center;
}

.nav-links {
  display: flex;
  gap: 0.5rem;
}

.nav-link {
  color: #b8bcc8;
  text-decoration: none;
  padding: 0.6rem 1rem;
  border-radius: 0.6rem;
  transition: all 0.2s ease;
  font-weight: 500;
  font-size: 0.9rem;
  border: 1px solid transparent;
}

.nav-link:hover {
  background: #2a2d36;
  color: #ffffff;
  border-color: #3a3d46;
  transform: translateY(-1px);
}

.nav-link.router-link-active {
  background: #007bff;
  color: #ffffff;
  border-color: #007bff;
}

.auth-section {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-details {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid #3a3d46;
}

.user-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.user-name {
  font-weight: 600;
  font-size: 0.9rem;
  color: #ffffff;
}

.user-email {
  font-size: 0.75rem;
  color: #8b8f98;
}

.sign-out-btn {
  background: #dc3545;
  color: #ffffff;
  border: none;
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.sign-out-btn:hover {
  background: #c82333;
  transform: translateY(-1px);
}

/* Main Content Area */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0;
}

/* Remove the old styling that added containers */
.main-content > * {
  /* Remove the old container styling */
}

/* Responsive Design */
@media (max-width: 768px) {
  .layout-container {
    padding: 0.5rem;
  }
  
  .navbar-content {
    flex-direction: column;
    gap: 1rem;
  }
  
  .nav-center {
    order: 3;
  }
  
  .auth-section {
    order: 2;
  }
  
  .user-details {
    flex-direction: column;
    text-align: center;
    gap: 0.5rem;
  }
  
  .user-text {
    align-items: center;
  }
}
</style>
