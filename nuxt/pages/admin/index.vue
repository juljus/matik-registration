<template>
  <div class="page-container">
    <div v-if="!isSignedIn" class="module auth-module">
      <div class="module-header">
        <h2>🔒 Authentication Required</h2>
      </div>
      <div class="message-card">
        <div class="message-icon">🔑</div>
        <div class="message-content">
          <h3>Admin Access Required</h3>
          <p>Please sign in to access admin features.</p>
        </div>
      </div>
    </div>
    
    <div v-else-if="userStatus && !userStatus.isAdmin" class="module access-denied-module">
      <div class="module-header">
        <h2>🚫 Access Denied</h2>
      </div>
      <div class="message-card error">
        <div class="message-icon">⛔</div>
        <div class="message-content">
          <h3>Admin Privileges Required</h3>
          <p>You need admin privileges to access this page.</p>
        </div>
      </div>
    </div>
    
    <div v-else-if="loading" class="module loading-module">
      <div class="module-header">
        <h2>⏳ Loading</h2>
      </div>
      <div class="loading-card">
        <div class="loading-spinner"></div>
        <p>Loading admin panel...</p>
      </div>
    </div>
    
    <div v-else class="admin-content">
      <!-- Pending Requests Module -->
      <div class="module requests-module">
        <div class="module-header">
          <h2>📋 Pending Signup Requests</h2>
        </div>
        
        <div v-if="!signupRequests.length" class="message-card">
          <div class="message-icon">✨</div>
          <div class="message-content">
            <h3>All Caught Up!</h3>
            <p>No pending signup requests at this time.</p>
          </div>
        </div>
        
        <div v-else class="requests-list">
          <div v-for="request in signupRequests" :key="request.email" class="request-card">
            <div class="request-info">
              <h4>{{ request.name || 'Unknown Name' }}</h4>
              <p><strong>Email:</strong> {{ request.email }}</p>
              <p><strong>Phone:</strong> {{ request.phoneNumber || 'Not provided' }}</p>
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

      <!-- Complete Accounts Module -->
      <div class="module complete-users-module">
        <div class="module-header">
          <h2>✅ Complete Accounts ({{ completeUsers.length }})</h2>
        </div>
        
        <div v-if="!completeUsers.length" class="message-card">
          <div class="message-icon">👥</div>
          <div class="message-content">
            <h3>No Complete Accounts</h3>
            <p>No users with assigned RFID tags found.</p>
          </div>
        </div>
        
        <div v-else class="users-list">
          <div v-for="user in completeUsers" :key="user.email" class="user-card complete">
            <div class="user-info">
              <h4>{{ user.name || 'Unknown Name' }}</h4>
              <p><strong>Email:</strong> {{ user.email }}</p>
              <p><strong>Phone:</strong> {{ user.phone || 'Not provided' }}</p>
              <p><strong>RFID:</strong> {{ user.rfid }}</p>
              <p><strong>Joined:</strong> {{ formatDate(user.createdAt) }}</p>
              <div v-if="user.isAdmin" class="admin-badge">
                👑 Admin
              </div>
              <div class="status-badge complete-badge">
                ✅ Complete
              </div>
            </div>
            <div class="user-actions">
              <button 
                @click="editRfid(user)" 
                :disabled="actionPending"
                class="edit-rfid-btn"
              >
                🏷️ Edit RFID
              </button>
              <button 
                v-if="!user.isAdmin"
                @click="removeUser(user.email)" 
                :disabled="actionPending"
                class="remove-btn"
              >
                🗑️ Remove
              </button>
              <span v-else class="admin-notice">Cannot remove admin</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Incomplete Accounts Module -->
      <div class="module incomplete-users-module">
        <div class="module-header">
          <h2>⚠️ Incomplete Accounts ({{ incompleteUsers.length }})</h2>
        </div>
        
        <div v-if="!incompleteUsers.length" class="message-card">
          <div class="message-icon">🎯</div>
          <div class="message-content">
            <h3>All Users Complete</h3>
            <p>All approved users have RFID tags assigned.</p>
          </div>
        </div>
        
        <div v-else class="users-list">
          <div v-for="user in incompleteUsers" :key="user.email" class="user-card incomplete">
            <div class="user-info">
              <h4>{{ user.name || 'Unknown Name' }}</h4>
              <p><strong>Email:</strong> {{ user.email }}</p>
              <p><strong>Phone:</strong> {{ user.phone || 'Not provided' }}</p>
              <p><strong>Joined:</strong> {{ formatDate(user.createdAt) }}</p>
              <div v-if="user.isAdmin" class="admin-badge">
                👑 Admin
              </div>
              <div class="status-badge incomplete-badge">
                ⚠️ Missing RFID
              </div>
            </div>
            <div class="user-actions">
              <button 
                @click="addRfid(user)" 
                :disabled="actionPending"
                class="add-rfid-btn"
              >
                🏷️ Add RFID
              </button>
              <button 
                v-if="!user.isAdmin"
                @click="removeUser(user.email)" 
                :disabled="actionPending"
                class="remove-btn"
              >
                🗑️ Remove
              </button>
              <span v-else class="admin-notice">Cannot remove admin</span>
            </div>
          </div>
        </div>
      </div>

      <!-- RFID Modal -->
      <div v-if="showRfidModal" class="modal-overlay" @click="closeRfidModal">
        <div class="modal-content" @click.stop>
          <h3>{{ isEditingRfid ? 'Edit RFID' : 'Add RFID' }} for {{ selectedUser?.name }}</h3>
          <div class="rfid-form">
            <label>RFID Tag ID:</label>
            <input 
              v-model="rfidInput" 
              type="text" 
              placeholder="Enter RFID tag ID"
              class="rfid-input"
              @keyup.enter="saveRfid"
              ref="rfidInputRef"
            />
            <div class="scan-instructions">
              <p>💡 Tap or scan the RFID tag to read its ID, then enter it above.</p>
            </div>
            <div class="modal-actions">
              <button @click="saveRfid" :disabled="!rfidInput.trim() || actionPending" class="save-btn">
                {{ actionPending ? 'Saving...' : 'Save RFID' }}
              </button>
              <button @click="closeRfidModal" :disabled="actionPending" class="cancel-btn">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue';

interface SignupRequest {
  email: string;
  name: string;
  picture: string;
  phoneNumber: string;
  requestedAt: string;
  status: string;
}

interface User {
  email: string;
  name: string;
  createdAt: string;
  isAdmin: boolean;
  rfid?: string;
  phone?: string;
}

const signupRequests = ref<SignupRequest[]>([]);
const allUsers = ref<User[]>([]);
const loading = ref(true);
const actionPending = ref(false);

// RFID modal state
const showRfidModal = ref(false);
const selectedUser = ref<User | null>(null);
const rfidInput = ref('');
const isEditingRfid = ref(false);
const rfidInputRef = ref<HTMLInputElement | null>(null);

// Computed properties to separate users
const completeUsers = computed(() => 
  allUsers.value.filter(user => user.rfid && user.rfid.trim() !== '')
);

const incompleteUsers = computed(() => 
  allUsers.value.filter(user => !user.rfid || user.rfid.trim() === '')
);

// Use the shared auth composable
const { isSignedIn, userStatus, initializeAuth } = useAuth();

onMounted(async () => {
  await initializeAuth();
  if (isSignedIn.value && userStatus.value?.isAdmin) {
    await fetchAdminData();
  }
  loading.value = false;
});

const fetchAdminData = async () => {
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
      allUsers.value = data.users || [];
    }
  } catch (error) {
    console.error('Error fetching admin data:', error);
  }
};

const fetchSignupRequests = async () => {
  // This function is now replaced by fetchAdminData
  await fetchAdminData();
};

const approveUser = async (email: string) => {
  await handleUserAction(email, 'approve');
};

const rejectUser = async (email: string) => {
  await handleUserAction(email, 'reject');
};

const removeUser = async (email: string) => {
  if (confirm(`Are you sure you want to remove user ${email}?`)) {
    await handleUserAction(email, 'remove');
  }
};

// RFID management functions
const addRfid = (user: User) => {
  selectedUser.value = user;
  rfidInput.value = '';
  isEditingRfid.value = false;
  showRfidModal.value = true;
  nextTick(() => {
    rfidInputRef.value?.focus();
  });
};

const editRfid = (user: User) => {
  selectedUser.value = user;
  rfidInput.value = user.rfid || '';
  isEditingRfid.value = true;
  showRfidModal.value = true;
  nextTick(() => {
    rfidInputRef.value?.focus();
  });
};

const closeRfidModal = () => {
  showRfidModal.value = false;
  selectedUser.value = null;
  rfidInput.value = '';
  isEditingRfid.value = false;
};

const saveRfid = async () => {
  if (!selectedUser.value || !rfidInput.value.trim()) return;
  
  actionPending.value = true;
  try {
    const savedUser = localStorage.getItem('matik-user');
    if (!savedUser) return;

    const res = await fetch('/api/admin/rfid', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${btoa(savedUser)}`
      },
      body: JSON.stringify({ 
        email: selectedUser.value.email, 
        rfid: rfidInput.value.trim() 
      })
    });

    if (res.ok) {
      const result = await res.json();
      console.log(result.message);
      closeRfidModal();
      await fetchAdminData(); // Refresh the data
    } else {
      const error = await res.json();
      console.error('Failed to save RFID:', error.message);
      alert('Failed to save RFID: ' + (error.message || 'Unknown error'));
    }
  } catch (error) {
    console.error('Error saving RFID:', error);
    alert('Error saving RFID. Please try again.');
  } finally {
    actionPending.value = false;
  }
};

const handleUserAction = async (email: string, action: 'approve' | 'reject' | 'remove') => {
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
      // Refresh the data
      await fetchAdminData();
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
/* Page Container */
.page-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.5rem;
  min-height: 100vh;
  background: #0f1114;
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

/* Admin Content */
.admin-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Lists */
.requests-list,
.users-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Request Cards */
.request-card {
  background: #2a2d36;
  border-radius: 0.75rem;
  padding: 1.25rem;
  border: 1px solid #3a3d46;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.request-info {
  flex: 1;
}

.request-info h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #f1f1f1;
}

.request-info p {
  margin: 0 0 0.25rem 0;
  color: #ccc;
  font-size: 0.9rem;
}

.request-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

/* User Cards */
.user-card {
  background: #2a2d36;
  border-radius: 0.75rem;
  padding: 1.25rem;
  border: 1px solid #3a3d46;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  position: relative;
}

.user-card.complete {
  border-color: #2a4a3a;
  background: #1a2a23;
}

.user-card.incomplete {
  border-color: #4a3a2a;
  background: #2a231a;
}

.user-info {
  flex: 1;
}

.user-info h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #f1f1f1;
}

.user-info p {
  margin: 0 0 0.25rem 0;
  color: #ccc;
  font-size: 0.9rem;
}

.user-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
  align-items: center;
}

/* Badges */
.admin-badge {
  display: inline-block;
  background: #ffd700;
  color: #000;
  padding: 0.25rem 0.5rem;
  border-radius: 0.5rem;
  font-size: 0.8rem;
  font-weight: 600;
  margin-top: 0.5rem;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 0.5rem;
  font-size: 0.8rem;
  font-weight: 600;
  margin-top: 0.5rem;
}

.complete-badge {
  background: #2a4a3a;
  color: #6bffb1;
}

.incomplete-badge {
  background: #4a3a2a;
  color: #ffaa6b;
}

.admin-notice {
  color: #888;
  font-size: 0.8rem;
  font-style: italic;
}

/* Buttons */
.approve-btn,
.reject-btn,
.edit-rfid-btn,
.add-rfid-btn,
.remove-btn {
  background: #2a2d36;
  color: #f1f1f1;
  border: 1px solid #3a3d46;
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.approve-btn:hover:not(:disabled) {
  background: #1a3a2a;
  border-color: #2a4a3a;
  color: #6bffb1;
}

.reject-btn:hover:not(:disabled),
.remove-btn:hover:not(:disabled) {
  background: #3a1a1a;
  border-color: #4a2a2a;
  color: #ff6b6b;
}

.edit-rfid-btn:hover:not(:disabled),
.add-rfid-btn:hover:not(:disabled) {
  background: #2a2a3a;
  border-color: #3a3a4a;
  color: #6bb1ff;
}

.approve-btn:disabled,
.reject-btn:disabled,
.edit-rfid-btn:disabled,
.add-rfid-btn:disabled,
.remove-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: #1a1d23;
  border-radius: 1rem;
  padding: 2rem;
  width: 90%;
  max-width: 500px;
  border: 1px solid #2a2d36;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
}

.modal-content h3 {
  margin: 0 0 1.5rem 0;
  color: #f1f1f1;
  font-size: 1.3rem;
  text-align: center;
}

.rfid-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.rfid-form label {
  color: #f1f1f1;
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.rfid-input {
  background: #2a2d36;
  border: 1px solid #3a3d46;
  border-radius: 0.5rem;
  padding: 0.75rem;
  color: #f1f1f1;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.rfid-input:focus {
  outline: none;
  border-color: #6bffb1;
}

.scan-instructions {
  background: #2a2d36;
  border-radius: 0.5rem;
  padding: 1rem;
  border: 1px solid #3a3d46;
}

.scan-instructions p {
  margin: 0;
  color: #ccc;
  font-size: 0.9rem;
  text-align: center;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1.5rem;
}

.save-btn,
.cancel-btn {
  background: #2a2d36;
  color: #f1f1f1;
  border: 1px solid #3a3d46;
  border-radius: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.save-btn:hover:not(:disabled) {
  background: #1a3a2a;
  border-color: #2a4a3a;
  color: #6bffb1;
}

.cancel-btn:hover:not(:disabled) {
  background: #3a2d36;
  border-color: #4a3d46;
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
  
  .request-card,
  .user-card {
    flex-direction: column;
    align-items: stretch;
  }
  
  .request-actions,
  .user-actions {
    justify-content: center;
    margin-top: 1rem;
  }
  
  .modal-content {
    padding: 1.5rem;
    margin: 1rem;
  }
}

.no-users {
  text-align: center;
  color: #888;
  font-style: italic;
}

.requests-list, .users-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.request-card, .user-card {
  background: #2a2d36;
  border: 1px solid #444;
  border-radius: 0.8rem;
  padding: 1.2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.request-info, .user-info {
  flex: 1;
}

.request-info h4, .user-info h4 {
  margin: 0 0 0.5rem 0;
  color: #f1f1f1;
}

.request-info p, .user-info p {
  margin: 0.2rem 0;
  color: #ccc;
  font-size: 0.9rem;
}

.admin-badge {
  display: inline-block;
  background: #ffd700;
  color: #000;
  padding: 0.2rem 0.6rem;
  border-radius: 0.4rem;
  font-size: 0.8rem;
  font-weight: 600;
  margin-top: 0.5rem;
}

.request-actions, .user-actions {
  display: flex;
  gap: 0.8rem;
  align-items: center;
}

.approve-btn, .reject-btn, .remove-btn {
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.remove-btn {
  background: #dc3545;
  color: white;
}

.remove-btn:hover:not(:disabled) {
  background: #e74c3c;
}

.admin-notice {
  color: #888;
  font-size: 0.9rem;
  font-style: italic;
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

.approve-btn:disabled, .reject-btn:disabled, .remove-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* RFID Management Styles */
.user-card.complete {
  border-left: 4px solid #28a745;
}

.user-card.incomplete {
  border-left: 4px solid #ffc107;
}

.status-badge {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 0.4rem;
  font-size: 0.8rem;
  font-weight: 600;
  margin-top: 0.5rem;
}

.complete-badge {
  background: #28a745;
  color: white;
}

.incomplete-badge {
  background: #ffc107;
  color: #000;
}

.add-rfid-btn, .edit-rfid-btn {
  background: #007bff;
  color: white;
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.add-rfid-btn:hover:not(:disabled), .edit-rfid-btn:hover:not(:disabled) {
  background: #0056b3;
}

.add-rfid-btn:disabled, .edit-rfid-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #2a2d36;
  border: 1px solid #444;
  border-radius: 0.8rem;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}

.modal-content h3 {
  margin: 0 0 1.5rem 0;
  color: #f1f1f1;
  font-size: 1.2rem;
}

.rfid-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.rfid-form label {
  color: #f1f1f1;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.rfid-input {
  padding: 0.8rem;
  border: 1px solid #555;
  border-radius: 0.5rem;
  background: #1a1d23;
  color: #f1f1f1;
  font-size: 1rem;
}

.rfid-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.scan-instructions {
  background: #1a1d23;
  border: 1px solid #555;
  border-radius: 0.5rem;
  padding: 1rem;
  color: #ccc;
  font-size: 0.9rem;
}

.scan-instructions p {
  margin: 0;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.save-btn {
  background: #28a745;
  color: white;
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.save-btn:hover:not(:disabled) {
  background: #34ce57;
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.cancel-btn {
  background: #6c757d;
  color: white;
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.cancel-btn:hover:not(:disabled) {
  background: #5a6268;
}
</style>
