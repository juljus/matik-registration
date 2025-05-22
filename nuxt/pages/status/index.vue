<template>
  <div class="status-box">
    <h2>Key Status</h2>
    <div v-if="pending" class="status-loading">Loading...</div>
    <div v-else-if="error" class="status-error">{{ error }}</div>
    <div v-else>
      <div class="status-indicator" :class="statusClass">
        <span v-if="status === 'taken'">🔴 Taken</span>
        <span v-else>🟢 Available</span>
      </div>
      <div v-if="holder">
        <p><strong>Holder:</strong> {{ holder.name }}</p>
        <p><strong>Phone:</strong> {{ holder.phone }}</p>
        <p><strong>Role:</strong> {{ holder.role }}</p>
      </div>
      <div v-else>
        <p>The key is currently available.</p>
      </div>
      <div class="status-timestamp">
        <small>Last updated: {{ formattedTimestamp }}</small>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

const status = ref<'taken' | 'available'>('available');
const holder = ref<{ name: string; phone: string; role: string } | null>(null);
const timestamp = ref<string | null>(null);
const pending = ref(true);
const error = ref<string | null>(null);

const statusClass = computed(() =>
  status.value === 'taken' ? 'taken' : 'available'
);

const formattedTimestamp = computed(() => {
  if (!timestamp.value) return '';
  return new Date(timestamp.value).toLocaleString();
});

async function fetchStatus() {
  pending.value = true;
  error.value = null;
  try {
    const res = await fetch('/api/key-status');
    const data = await res.json();
    status.value = data.status;
    holder.value = data.holder;
    timestamp.value = data.timestamp;
  } catch (e) {
    error.value = 'Failed to load key status.';
  } finally {
    pending.value = false;
  }
}

onMounted(fetchStatus);
</script>

<style scoped>
.status-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.2rem;
}
.status-box h2 {
  margin-bottom: 0.5rem;
  font-size: 1.5rem;
  font-weight: 600;
  letter-spacing: 1px;
}
.status-indicator {
  font-size: 1.2rem;
  font-weight: 500;
  padding: 0.5rem 1.2rem;
  border-radius: 0.7rem;
  margin-bottom: 0.5rem;
  display: inline-block;
}
.status-indicator.taken {
  background: #3a2323;
  color: #ff6b6b;
}
.status-indicator.available {
  background: #233a2a;
  color: #6bffb1;
}
.status-loading {
  color: #aaa;
}
.status-error {
  color: #ff6b6b;
}
.status-timestamp {
  margin-top: 0.5rem;
  color: #888;
}
</style>
