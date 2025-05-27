<template>
  <div class="simple-test">
    <h2>Simple Form Test</h2>
    
    <div v-if="!showForm">
      <button @click="showForm = true">Show Form</button>
    </div>
    
    <div v-else>
      <form @submit.prevent="handleSubmit">
        <input 
          v-model="phoneNumber" 
          type="tel" 
          placeholder="Phone number"
          required
        />
        <button type="submit" :disabled="!phoneNumber.trim()">
          Submit
        </button>
      </form>
      <p v-if="message">{{ message }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const showForm = ref(false);
const phoneNumber = ref('');
const message = ref('');

const handleSubmit = async () => {
  console.log('=== SIMPLE FORM SUBMIT ===');
  console.log('Phone:', phoneNumber.value);
  
  message.value = 'Processing...';
  
  try {
    const mockUser = JSON.stringify({
      email: 'test@example.com',
      name: 'Test User'
    });
    
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${btoa(mockUser)}`
      },
      body: JSON.stringify({ phoneNumber: phoneNumber.value })
    });
    
    const result = await response.json();
    message.value = `Response: ${JSON.stringify(result)}`;
    console.log('API Response:', result);
    
  } catch (error) {
    message.value = `Error: ${error instanceof Error ? error.message : String(error)}`;
    console.error('Error:', error);
  }
};
</script>

<style scoped>
.simple-test {
  padding: 20px;
  max-width: 400px;
  margin: 0 auto;
}

input {
  width: 100%;
  padding: 10px;
  margin: 10px 0;
  background: #181a20;
  border: 1px solid #444;
  border-radius: 5px;
  color: #f1f1f1;
}

button {
  padding: 10px 15px;
  margin: 5px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  background: #6bffb1;
  color: #181a20;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
