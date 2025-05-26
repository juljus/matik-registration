<template>
  <div class="layout-container">
    <header class="layout-header">
      <h1>Matik Key Registration</h1>
      <div class="auth-bar">
        <GoogleSignInButton v-if="!isSignedIn" @success="handleSignInSuccess" @error="handleSignInError" />
        <div v-else class="user-section">
          <div class="nav-links">
            <NuxtLink to="/" class="nav-link">Status</NuxtLink>
            <NuxtLink v-if="userStatus?.isAdmin" to="/admin" class="nav-link">Admin</NuxtLink>
          </div>
          <div class="user-info">
            <span>Signed in as {{ user?.email || 'User' }}</span>
            <button @click="signOut" class="sign-out-btn">Sign out</button>
          </div>
        </div>
      </div>
    </header>
    <main class="layout-main">
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
.layout-container {
  min-height: 100vh;
  background: #181a20;
  color: #f1f1f1;
  display: flex;
  flex-direction: column;
  font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
}
.layout-header {
  background: #23262f;
  padding: 2rem 0 1rem 0;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  border-bottom: 2px solid #23262f;
  position: relative;
}
.layout-header h1 {
  margin: 0;
  font-size: 2rem;
  letter-spacing: 2px;
  font-weight: 700;
}
.auth-bar {
  margin-top: 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
}

.user-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.8rem;
}

.nav-links {
  display: flex;
  gap: 1rem;
}

.nav-link {
  color: #f1f1f1;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  transition: background 0.2s, color 0.2s;
  border: 1px solid transparent;
}

.nav-link:hover {
  background: #35384a;
  color: #6bffb1;
  border-color: #444;
}

.nav-link.router-link-active {
  background: #35384a;
  color: #6bffb1;
  border-color: #6bffb1;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.auth-bar button, .sign-out-btn {
  background: #23262f;
  color: #f1f1f1;
  border: 1px solid #444;
  border-radius: 0.5rem;
  padding: 0.5rem 1.2rem;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.auth-bar button:hover, .sign-out-btn:hover {
  background: #35384a;
  color: #6bffb1;
}
.layout-main {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 2rem 1rem;
}
.layout-main > * {
  background: #23262f;
  border-radius: 1.2rem;
  box-shadow: 0 4px 24px rgba(0,0,0,0.25);
  padding: 2rem 2.5rem;
  min-width: 320px;
  max-width: 420px;
  width: 100%;
}
</style>
