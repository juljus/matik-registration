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
      
      <!-- Always visible phone number input and request button -->
      <div class="signup-form">
        <h3>Complete Your Registration</h3>
        <p class="form-instruction">Please provide your phone number to request access:</p>
        
        <div class="input-group">
          <label for="phone">Phone Number:</label>
          <input 
            id="phone"
            v-model="phoneNumber" 
            type="tel" 
            placeholder="+1 (555) 123-4567"
            :disabled="signupPending"
            class="phone-input"
          />
        </div>
        
        <div class="form-actions">
          <button 
            @click="handleSignupRequest" 
            :disabled="signupPending || !phoneNumber.trim()" 
            class="signup-btn"
          >
            {{ signupPending ? 'Submitting...' : 'Request Access' }}
          </button>
        </div>
        
        <p v-if="signupMessage" class="signup-message" :class="signupMessageClass">{{ signupMessage }}</p>
      </div>
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
const phoneNumber = ref('');

// Use the shared auth composable
const { isSignedIn, user, userStatus, initializeAuth, requestSignup, setAuth } = useAuth();

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

// Watch for phoneNumber changes
watch(phoneNumber, (newValue) => {
  // Phone number changed
});

const handleSignupRequest = async () => {
  if (!phoneNumber.value.trim()) {
    signupMessage.value = 'Please enter a valid phone number.';
    return;
  }

  signupPending.value = true;
  signupMessage.value = null;
  
  try {
    const savedUser = localStorage.getItem('matik-user');
    if (!savedUser) {
      throw new Error('No user data available');
    }
    
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${btoa(savedUser)}`
      },
      body: JSON.stringify({ phoneNumber: phoneNumber.value })
    });
    
    const result = await response.json();
    
    signupMessage.value = result.message || result.error || 'Signup request submitted successfully';
    if (result.message && !result.error) {
      // Clear phone number on success
      phoneNumber.value = '';
    }
  } catch (error) {
    console.error('Signup request error:', error);
    signupMessage.value = 'Failed to submit signup request. Please try again.';
  } finally {
    signupPending.value = false;
  }
};

const signupMessageClass = computed(() => {
  if (!signupMessage.value) return '';
  return signupMessage.value.includes('success') || signupMessage.value.includes('submitted') ? 'success' : 'error';
});

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
.signup-message {
  margin-top: 1rem;
  font-size: 0.9rem;
  color: #6bffb1;
}

.signup-message.success {
  color: #6bffb1;
}

.signup-message.error {
  color: #ff6b6b;
}

.signup-form {
  text-align: left;
  background: #2a2d36;
  border: 1px solid #444;
  border-radius: 0.8rem;
  padding: 1.5rem;
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.signup-form h3 {
  margin: 0 0 0.5rem 0;
  color: #f1f1f1;
  text-align: center;
}

.form-instruction {
  color: #ccc;
  font-size: 0.9rem;
  margin-bottom: 1rem;
  text-align: center;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-group label {
  color: #f1f1f1;
  font-weight: 500;
  font-size: 0.9rem;
}

.phone-input {
  background: #181a20;
  border: 1px solid #444;
  border-radius: 0.5rem;
  padding: 0.75rem;
  color: #f1f1f1;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.phone-input:focus {
  outline: none;
  border-color: #6bffb1;
}

.phone-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-actions {
  display: flex;
  gap: 0.8rem;
  justify-content: center;
}

.signup-btn {
  background: #6bffb1;
  color: #181a20;
  border: none;
  border-radius: 0.5rem;
  padding: 0.6rem 1.2rem;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.signup-btn:hover:not(:disabled) {
  background: #5ae89d;
}

.signup-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>