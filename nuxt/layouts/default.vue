<template>
  <div class="layout-container">
    <header class="layout-header">
      <h1>Matik Key Registration</h1>
      <div class="auth-bar">
        <button v-if="!isSignedIn" @click="signIn">Sign in with Google</button>
        <div v-else>
          <span>Signed in as {{ googleUser?.email }}</span>
          <button @click="signOut">Sign out</button>
        </div>
      </div>
    </header>
    <main class="layout-main">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useGoogleSignin } from 'vue3-google-signin'

const user = ref(null)
const { isReady, isSignedIn, googleUser, signIn, signOut } = useGoogleSignin()

function onSignInSuccess(userInfo) {
  user.value = userInfo
}
function onSignInError(error) {
  user.value = null
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
.auth-bar button {
  background: #23262f;
  color: #f1f1f1;
  border: 1px solid #444;
  border-radius: 0.5rem;
  padding: 0.5rem 1.2rem;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.auth-bar button:hover {
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
