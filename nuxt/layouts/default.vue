<template>
  <div class="layout-container">
    <header class="layout-header">
      <h1>Matik Key Registration</h1>
    </header>
    <main class="layout-main">
      <slot />
    </main>
  </div>
</template>

<script setup>
// No script needed for default layout
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
  padding: 2rem 0;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  border-bottom: 2px solid #23262f;
}
.layout-header h1 {
  margin: 0;
  font-size: 2rem;
  letter-spacing: 2px;
  font-weight: 700;
}
.layout-main {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 2rem 1rem;
}

/* Boxy feel for content */
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
