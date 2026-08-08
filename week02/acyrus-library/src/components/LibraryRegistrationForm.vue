<template>
<div class="container mt-5">
  <div class="row">
    <div class="col-md-8 offset-md-2">
      <div class="form">
        <h1 class="text-center">User Information Form</h1>
        <form @submit.prevent="submitForm">
          <div class="row mb-3">
            <div class="col-md-6">
              <label for="username" class="form-label">Username:</label><br>
              <input type="text" id="username" name="username" class="form-control" v-model="formData.username"><br>
            </div>
            <div class="col-md-6">
           
              <label for="password" class="form-label">Password:</label><br>
              <input type="password" id="password" name="password" class="form-control" v-model="formData.password"><br>
            </div>
          </div>
          <div class="row mb-3">
            <div class="col-md-6">
              <div class="form-check">
                <input type="checkbox" id="isAustralian" name="isAustralian" class="form-check-input" v-model="formData.isAustralian"><br>
                <label for="isAustralian" class="form-check-label">Australian Resident?</label><br>
              </div>
            </div>
            <div class="col-md-6">
              <label for="gender" class="form-label">Gender</label><br>
              <select id="gender" class="form-select" name="gender" v-model="formData.gender">
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div class="mb-3">
            <label for="reason" class="form-label">Reason For Joining:</label><br>
            <textarea id="reason" name="reason" rows="3" class="form-control" v-model="formData.reason"></textarea><br>
          </div>
          <div class="text-center">
            <button type="submit" class="btn btn-primary me-2">Submit</button>
            <button type="reset" class="btn btn-secondary" @click="clearForm">Reset</button>
          </div>
  
        </form>
      </div>
    </div>
  </div>
</div>
</template>

<script setup>
import { ref } from 'vue'

const formData = ref({
  username: '',
  password: '',
  isAustralian: false,
  gender: 'other',
  reason: ''
})

const submitForm = () => {
  console.log(formData.value)
}

const clearForm = () => {
  formData.value = {
    username: '',
    password: '',
    isAustralian: false,
    gender: 'other',
    reason: ''
  }
}

</script>

<style scoped>
</style>