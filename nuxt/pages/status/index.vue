  <template>
  <div class="status-box">
    <h2>Key Status</h2>
    <div v-if="!isSignedIn" class="auth-required">
      <p>🔒 Please sign in to view the key status</p>
      <p class="auth-hint">You need to be logged in to access this information.</p>
    </div>
    <div v-else-if="userStatus && !userStatus.isRegistered" class="signup-required">
      <p>📝 Account approval needed</p>
      <p class="auth-hint">Your Google account is signed in, but you need approval to access the key system.</p>
      <button @click="handleSignupRequest" :disabled="signupPending" class="signup-btn">
        {{ signupPending ? 'Requesting...' : 'Request Access' }}
      </button>
      <p v-if="signupMessage" class="signup-message">{{ signupMessage }}</p>
    </div>
    <div v-else-if="pending" class="status-loading">Loading...</div>
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
import { ref, computed, onMounted, watch } from 'vue';

const status = ref<'taken' | 'available'>('available');
const holder = ref<{ name: string; phone: string; role: string } | null>(null);
const timestamp = ref<string | null>(null);
const pending = ref(true);
const error = ref<string | null>(null);
const signupPending = ref(false);
const signupMessage = ref<string | null>(null);

// Use the shared auth composable
const { isSignedIn, userStatus, initializeAuth, requestSignup } = useAuth();

// Check if user is authenticated on page load
onMounted(async () => {
  await initializeAuth();
  if (isSignedIn.value && userStatus.value?.isRegistered) {
    fetchStatus();
  } else {
    pending.value = false;
  }
});

// Watch for authentication changes and fetch status when user logs in
watch([isSignedIn, userStatus], ([newSignedIn, newUserStatus]) => {
  if (newSignedIn && newUserStatus?.isRegistered) {
    fetchStatus();
  } else {
    // Clear data when user logs out or is not registered
    status.value = 'available';
    holder.value = null;
    timestamp.value = null;
    pending.value = false;
  }
});

const handleSignupRequest = async () => {
  signupPending.value = true;
  signupMessage.value = null;
  
  try {
    const result = await requestSignup();
    signupMessage.value = result.message || 'Signup request submitted successfully';
  } catch (error) {
    signupMessage.value = 'Failed to submit signup request. Please try again.';
    console.error('Signup request error:', error);
  } finally {
    signupPending.value = false;
  }
};

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
    // Get user data from localStorage to include as token
    const savedUser = localStorage.getItem('matik-user');
    if (!savedUser) {
      throw new Error('No authentication token available');
    }
    
    const res = await fetch('/api/key-status', {
      headers: {
        'Authorization': `Bearer ${btoa(savedUser)}` // Use base64 encoded user data as simple token
      }
    });
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    
    const data = await res.json();
    status.value = data.status;
    holder.value = data.holder;
    timestamp.value = data.timestamp;
  } catch (e) {
    error.value = 'Failed to load key status.';
    console.error('Fetch error:', e);
  } finally {
    pending.value = false;
  }
}
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
.auth-required {
  text-align: center;
  color: #aaa;
}
.auth-hint {
  font-size: 0.9rem;
  color: #666;
  margin-top: 0.5rem;
}
.signup-required {
  text-align: center;
  color: #aaa;
}
.signup-btn {
  background: #23262f;
  color: #f1f1f1;
  border: 1px solid #444;
  border-radius: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  margin-top: 1rem;
}
.signup-btn:hover:not(:disabled) {
  background: #35384a;
  color: #6bffb1;
}
.signup-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.signup-message {
  margin-top: 1rem;
  font-size: 0.9rem;
  color: #6bffb1;
}
</style>
