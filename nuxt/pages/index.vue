<template>
  <div class="page-container">
    <!-- Key Status Module -->
    <div class="module status-module">
      <div class="module-header">
        <h2>🔑 Key Status</h2>
      </div>
      
      <div v-if="!isSignedIn" class="auth-required">
        <div class="message-card">
          <div class="message-icon">🔒</div>
          <div class="message-content">
            <h3>Authentication Required</h3>
            <p>Please sign in to view the key status and access the system.</p>
          </div>
        </div>
      </div>
      
      <div v-else-if="userStatus && !userStatus.isRegistered" class="signup-section">
        <div class="message-card warning">
          <div class="message-icon">📝</div>
          <div class="message-content">
            <h3>Account Approval Needed</h3>
            <p>Your Google account is signed in, but you need approval to access the key system.</p>
          </div>
        </div>
      </div>
      
      <div v-else-if="pending" class="loading-card">
        <div class="loading-spinner"></div>
        <p>Loading key status...</p>
      </div>
      
      <div v-else-if="error" class="error-card">
        <div class="message-icon">❌</div>
        <div class="message-content">
          <h3>Error</h3>
          <p>{{ error }}</p>
        </div>
      </div>
      
      <div v-else class="status-display">
        <div class="status-indicator" :class="statusClass">
          <div class="status-icon">
            <span v-if="status === 'taken'">🔴</span>
            <span v-else>🟢</span>
          </div>
          <div class="status-text">
            <h3>{{ status === 'taken' ? 'Key Taken' : 'Key Available' }}</h3>
            <p v-if="!keyData?.isOrphaned">{{ status === 'taken' ? 'The key is currently in use' : 'The key is available for use' }}</p>
            <p v-else class="orphaned-warning">⚠️ Key is stuck - taken by removed RFID ({{ holder?.orphanedRfid }})</p>
          </div>
        </div>
        
        <div v-if="holder" class="holder-info">
          <h4>{{ keyData?.isOrphaned ? 'Orphaned Key Holder' : 'Current Holder' }}</h4>
          <div class="holder-details">
            <p><strong>Name:</strong> {{ holder.name }}</p>
            <p v-if="!keyData?.isOrphaned && holder.phone"><strong>Phone:</strong> {{ holder.phone }}</p>
            <p v-if="holder.role"><strong>Role:</strong> {{ holder.role }}</p>
            <p><strong>Since:</strong> {{ timestamp ? formatDate(timestamp) : 'Unknown' }}</p>
            <div v-if="keyData?.isOrphaned && userStatus?.isAdmin" class="admin-warning">
              <p class="warning-text">🚨 This key is orphaned (holder's RFID was removed from the system). Only admins can reset it.</p>
              <button @click="resetOrphanedKey" :disabled="actionPending" class="reset-btn">
                <span v-if="actionPending">⏳</span>
                <span v-else>🔧</span>
                Reset Key Status
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Registration Module (only show if user needs to signup) -->
    <div v-if="isSignedIn && userStatus && !userStatus.isRegistered" class="module registration-module">
      <div class="module-header">
        <h2>📋 Complete Registration</h2>
      </div>
      
      <div class="registration-form">
        <p class="form-instruction">Please provide your phone number to request access to the key system:</p>
        
        <div class="input-group">
          <label for="phone">Phone Number</label>
          <input 
            id="phone"
            v-model="phoneNumber" 
            type="tel" 
            placeholder="+1 (555) 123-4567"
            :disabled="signupPending"
            class="phone-input"
          />
        </div>
        
        <button 
          @click="handleSignupRequest" 
          :disabled="signupPending || !phoneNumber.trim()" 
          class="request-btn"
        >
          <span v-if="signupPending">⏳ Submitting...</span>
          <span v-else>🚀 Request Access</span>
        </button>
        
        <div v-if="signupMessage" class="message-card" :class="signupMessageClass">
          <div class="message-content">
            <p>{{ signupMessage }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Actions Module (only show if user is registered) -->
    <div v-if="isSignedIn && userStatus && userStatus.isRegistered" class="module actions-module">
      <div class="module-header">
        <h2>⚡ Actions</h2>
      </div>
      
      <div class="action-buttons">
        <button @click="takeKey" :disabled="actionPending || status === 'taken'" class="action-btn take-btn">
          <span v-if="actionPending">⏳</span>
          <span v-else>🔒</span>
          Take Key
        </button>
        
        <button @click="returnKey" :disabled="actionPending || status === 'available'" class="action-btn return-btn">
          <span v-if="actionPending">⏳</span>
          <span v-else>🔓</span>
          Return Key
        </button>
      </div>
      
      <div v-if="actionMessage" class="message-card" :class="actionMessageClass">
        <div class="message-content">
          <p>{{ actionMessage }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';

// State management
const status = ref<'taken' | 'available'>('available');
const holder = ref<{ name: string; phone: string; role: string; orphanedRfid?: string } | null>(null);
const timestamp = ref<string | null>(null);
const pending = ref(true);
const error = ref<string | null>(null);
const signupPending = ref(false);
const signupMessage = ref<string | null>(null);
const phoneNumber = ref('');
const actionPending = ref(false);
const actionMessage = ref<string | null>(null);
const keyData = ref<any>(null); // Full key status response

// Use the shared auth composable
const { isSignedIn, user, userStatus, initializeAuth } = useAuth();

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

// Computed properties
const statusClass = computed(() => 
  status.value === 'taken' ? 'taken' : 'available'
);

const signupMessageClass = computed(() => {
  if (!signupMessage.value) return '';
  return signupMessage.value.includes('success') || signupMessage.value.includes('submitted') ? 'success' : 'error';
});

const actionMessageClass = computed(() => {
  if (!actionMessage.value) return '';
  return actionMessage.value.includes('success') || actionMessage.value.includes('Success') ? 'success' : 'error';
});

// Helper functions
function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString();
}

// Authentication functions
async function handleSignupRequest() {
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
}

// Key management functions
async function takeKey() {
  actionPending.value = true;
  actionMessage.value = null;
  
  try {
    const savedUser = localStorage.getItem('matik-user');
    if (!savedUser) {
      throw new Error('No authentication token available');
    }
    
    const response = await fetch('/api/take-key', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${btoa(savedUser)}`
      }
    });
    
    const result = await response.json();
    
    if (response.ok) {
      actionMessage.value = 'Key taken successfully!';
      await fetchStatus(); // Refresh status
    } else {
      actionMessage.value = result.error || 'Failed to take key';
    }
  } catch (error) {
    console.error('Take key error:', error);
    actionMessage.value = 'Failed to take key. Please try again.';
  } finally {
    actionPending.value = false;
  }
}

async function returnKey() {
  actionPending.value = true;
  actionMessage.value = null;
  
  try {
    const savedUser = localStorage.getItem('matik-user');
    if (!savedUser) {
      throw new Error('No authentication token available');
    }
    
    const response = await fetch('/api/return-key', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${btoa(savedUser)}`
      }
    });
    
    const result = await response.json();
    
    if (response.ok) {
      actionMessage.value = 'Key returned successfully!';
      await fetchStatus(); // Refresh status
    } else {
      actionMessage.value = result.error || 'Failed to return key';
    }
  } catch (error) {
    console.error('Return key error:', error);
    actionMessage.value = 'Failed to return key. Please try again.';
  } finally {
    actionPending.value = false;
  }
}

// Admin function to reset orphaned keys
async function resetOrphanedKey() {
  if (!userStatus.value?.isAdmin) {
    actionMessage.value = 'Only admins can reset orphaned keys';
    return;
  }
  
  actionPending.value = true;
  actionMessage.value = null;
  
  try {
    const savedUser = localStorage.getItem('matik-user');
    if (!savedUser) {
      throw new Error('No authentication token available');
    }
    
    const response = await fetch('/api/admin/reset-key', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${btoa(savedUser)}`
      },
      body: JSON.stringify({
        forceReturn: true,
        reason: 'Orphaned key reset by admin'
      })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      actionMessage.value = 'Key status successfully reset!';
      await fetchStatus(); // Refresh status
    } else {
      actionMessage.value = result.error || 'Failed to reset key status';
    }
  } catch (error) {
    console.error('Reset key error:', error);
    actionMessage.value = 'Failed to reset key status. Please try again.';
  } finally {
    actionPending.value = false;
  }
}

// Status fetching
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
    keyData.value = data; // Store the full key data
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
/* Page Container */
.page-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0;
  min-height: 100vh;
  background: transparent;
}

/* Module Base Styles */
.module {
  background: #1a1d23;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.2);
  border: 1px solid #2a2d36;
}

.module-header {
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #2a2d36;
  padding-bottom: 1rem;
}

.module-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #f1f1f1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Message Cards */
.message-card {
  background: #2a2d36;
  border-radius: 0.75rem;
  padding: 1.25rem;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  border: 1px solid #3a3d46;
}

.message-card.warning {
  background: #3a2a1a;
  border-color: #4a3a2a;
}

.message-card.success {
  background: #1a3a2a;
  border-color: #2a4a3a;
}

.message-card.error {
  background: #3a1a1a;
  border-color: #4a2a2a;
}

.message-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.message-content {
  flex: 1;
}

.message-content h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #f1f1f1;
}

.message-content p {
  margin: 0;
  color: #ccc;
  line-height: 1.5;
}

/* Loading Card */
.loading-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: #2a2d36;
  border-radius: 0.75rem;
  border: 1px solid #3a3d46;
}

.loading-spinner {
  width: 1.5rem;
  height: 1.5rem;
  border: 2px solid #3a3d46;
  border-top: 2px solid #6bffb1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Error Card */
.error-card {
  background: #3a1a1a;
  border: 1px solid #4a2a2a;
  border-radius: 0.75rem;
  padding: 1.25rem;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

/* Status Display */
.status-display {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.orphaned-warning {
  color: #ff6b6b;
  font-weight: 500;
}

.admin-warning {
  margin-top: 1rem;
  padding: 1rem;
  background: #3a1a1a;
  border-radius: 0.5rem;
  border: 1px solid #4a2a2a;
}

.warning-text {
  color: #ff6b6b;
  margin-bottom: 1rem;
}

.reset-btn {
  background: #ff6b6b;
  color: #181a20;
  border: none;
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 auto;
}

.reset-btn:hover:not(:disabled) {
  background: #ff4b4b;
  transform: translateY(-1px);
}

.reset-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  border-radius: 0.75rem;
  border: 1px solid #3a3d46;
}

.status-indicator.taken {
  background: #3a2323;
  border-color: #4a3333;
}

.status-indicator.available {
  background: #233a2a;
  border-color: #334a3a;
}

.status-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.status-text h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: #f1f1f1;
}

.status-text p {
  margin: 0;
  color: #ccc;
}

/* Holder Info */
.holder-info {
  background: #2a2d36;
  border-radius: 0.75rem;
  padding: 1.25rem;
  border: 1px solid #3a3d46;
}

.holder-info h4 {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #f1f1f1;
}

.holder-details p {
  margin: 0 0 0.5rem 0;
  color: #ccc;
}

.holder-details p:last-child {
  margin-bottom: 0;
}

/* Registration Form */
.registration-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-instruction {
  color: #ccc;
  text-align: center;
  margin: 0;
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
  background: #2a2d36;
  border: 1px solid #3a3d46;
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

.request-btn {
  background: #6bffb1;
  color: #181a20;
  border: none;
  border-radius: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  align-self: center;
}

.request-btn:hover:not(:disabled) {
  background: #5ae89d;
  transform: translateY(-1px);
}

.request-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.action-btn {
  background: #2a2d36;
  color: #f1f1f1;
  border: 1px solid #3a3d46;
  border-radius: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.action-btn:hover:not(:disabled) {
  background: #3a3d46;
  transform: translateY(-1px);
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.take-btn:hover:not(:disabled) {
  background: #3a2323;
  border-color: #4a3333;
  color: #ff6b6b;
}

.return-btn:hover:not(:disabled) {
  background: #233a2a;
  border-color: #334a3a;
  color: #6bffb1;
}

/* Responsive Design */
@media (max-width: 768px) {
  .page-container {
    padding: 1rem;
    gap: 1rem;
  }
  
  .module {
    padding: 1rem;
  }
  
  .module-header h2 {
    font-size: 1.3rem;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .action-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>