<template>
  <div class="admin-box">
    <h2>Admin Panel</h2>
    <div v-if="!isSignedIn" class="auth-required">
      <p>🔒 Please sign in to access admin features</p>
    </div>
    <div v-else-if="userStatus && !userStatus.isAdmin" class="access-denied">
      <p>🚫 Admin access required</p>
      <p class="auth-hint">You need admin privileges to access this page.</p>
    </div>
    <div v-else-if="loading" class="loading">Loading...</div>
    <div v-else>
      <div class="section">
        <h3>Pending Signup Requests</h3>
        <div v-if="!signupRequests.length" class="no-requests">
          <p>No pending signup requests</p>
        </div>
        <div v-else class="requests-list">
          <div v-for="request in signupRequests" :key="request.email" class="request-card">
            <div class="request-info">
              <h4>{{ request.name || 'Unknown Name' }}</h4>
              <p><strong>Email:</strong> {{ request.email }}</p>
              <p><strong>Requested:</strong> {{ formatDate(request.requestedAt) }}</p>
            </div>
            <div class="request-actions">
              <button 
                @click="approveUser(request.email)" 
                :disabled="actionPending"
                class="approve-btn"
              >
                ✓ Approve
              </button>
              <button 
                @click="rejectUser(request.email)" 
                :disabled="actionPending"
                class="reject-btn"
              >
                ✗ Reject
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

interface SignupRequest {
  email: string;
  name: string;
  picture: string;
  requestedAt: string;
  status: string;
}

const signupRequests = ref<SignupRequest[]>([]);
const loading = ref(true);
const actionPending = ref(false);

// Use the shared auth composable
const { isSignedIn, userStatus, initializeAuth } = useAuth();

onMounted(async () => {
  await initializeAuth();
  if (isSignedIn.value && userStatus.value?.isAdmin) {
    await fetchSignupRequests();
  }
  loading.value = false;
});

const fetchSignupRequests = async () => {
  try {
    const savedUser = localStorage.getItem('matik-user');
    if (!savedUser) return;

    const res = await fetch('/api/admin/users', {
      headers: {
        'Authorization': `Bearer ${btoa(savedUser)}`
      }
    });

    if (res.ok) {
      const data = await res.json();
      signupRequests.value = data.requests || [];
    }
  } catch (error) {
    console.error('Error fetching signup requests:', error);
  }
};

const approveUser = async (email: string) => {
  await handleUserAction(email, 'approve');
};

const rejectUser = async (email: string) => {
  await handleUserAction(email, 'reject');
};

const handleUserAction = async (email: string, action: 'approve' | 'reject') => {
  actionPending.value = true;
  try {
    const savedUser = localStorage.getItem('matik-user');
    if (!savedUser) return;

    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${btoa(savedUser)}`
      },
      body: JSON.stringify({ action, email })
    });

    if (res.ok) {
      const result = await res.json();
      console.log(result.message);
      // Refresh the list
      await fetchSignupRequests();
    } else {
      console.error('Failed to', action, 'user');
    }
  } catch (error) {
    console.error('Error processing user action:', error);
  } finally {
    actionPending.value = false;
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString();
};
</script>

<style scoped>
.admin-box {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  min-width: 600px;
}

.admin-box h2 {
  margin-bottom: 0.5rem;
  font-size: 1.8rem;
  font-weight: 600;
  letter-spacing: 1px;
  text-align: center;
}

.section h3 {
  font-size: 1.3rem;
  margin-bottom: 1rem;
  color: #f1f1f1;
}

.auth-required, .access-denied {
  text-align: center;
  color: #aaa;
}

.auth-hint {
  font-size: 0.9rem;
  color: #666;
  margin-top: 0.5rem;
}

.loading {
  text-align: center;
  color: #aaa;
}

.no-requests {
  text-align: center;
  color: #888;
  font-style: italic;
}

.requests-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.request-card {
  background: #2a2d36;
  border: 1px solid #444;
  border-radius: 0.8rem;
  padding: 1.2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.request-info h4 {
  margin: 0 0 0.5rem 0;
  color: #f1f1f1;
}

.request-info p {
  margin: 0.2rem 0;
  color: #ccc;
  font-size: 0.9rem;
}

.request-actions {
  display: flex;
  gap: 0.8rem;
}

.approve-btn, .reject-btn {
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.approve-btn {
  background: #28a745;
  color: white;
}

.approve-btn:hover:not(:disabled) {
  background: #34ce57;
}

.reject-btn {
  background: #dc3545;
  color: white;
}

.reject-btn:hover:not(:disabled) {
  background: #e74c3c;
}

.approve-btn:disabled, .reject-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
