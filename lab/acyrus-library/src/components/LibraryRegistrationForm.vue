<template>
<div class="container mt-5">
  <div class="row">
    <div class="col-md-8 offset-md-2">
      <div class="form">
        <h1 class="text-center">User Information Form</h1>
        <p class="text-center"> This form now includes validation. Registered users will be displayed in a table below the form.</p>
        <form @submit.prevent="submitForm">
          <div class="row mb-3">
            <div class="col-6">
              <label for="username" class="form-label">Username:</label><br>
              <input 
              type="text" 
              id="username" 
              name="username" 
              class="form-control" 
              v-model="formData.username" 
              @blur="() => validateName(true)" 
              @input="() => validateName(false)"
            >
            <div v-if="errors.username" class="text-danger">{{ errors.username }}</div>
            <br>
            </div>
            <div class="col-6">
              <label for="gender" class="form-label">Gender</label><br>
              <select id="gender" class="form-select" name="gender" v-model="formData.gender">
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
              </select>
              <div v-if="errors.gender" class="text-danger">{{ errors.gender }}</div>
            </div>
          </div>
          <div class="row mb-3">
            <div class="col-md-6 col-sm-6">
              <label for="confirm-password" class="form-label">Password</label>
              <input
                type="password"
                class="form-control"
                id="confirm-password"
                v-model="formData.password"
                @blur="() => validatePassword(false)"
                @input="() => validatePassword(false)"
              />
              <div v-if="errors.password" class="text-danger">{{ errors.password }}</div>
            </div>
            <div class="col-md-6 col-sm-6">
              <label for="confirm-password" class="form-label">Confirm password</label>
              <input
                type="password"
                class="form-control"
                id="confirm-password"
                v-model="formData.confirmPassword"
                @blur="() => validateConfirmPassword(false)"
                @input="() => validateConfirmPassword(false)"
              />
              <div v-if="errors.confirmPassword" class="text-danger">{{ errors.confirmPassword }}</div>
            </div>
            </div>
              <div class="col-6 ">
                <div class="form-check">
                  <input type="checkbox" id="isAustralian" name="isAustralian" class="form-check-input" v-model="formData.isAustralian">
                  <label for="isAustralian" class="form-check-label">Australian Resident?</label>
                  <div v-if="errors.isAustralian" class="text-danger">{{ errors.isAustralian }}</div>
                </div>
            </div>


          <div class="mb-3">
            <label for="reason" class="form-label">Reason For Joining:</label><br>
            <textarea 
              id="reason" 
              name="reason" 
              rows="3" 
              class="form-control" 
              v-model="formData.reason" 
              @blur="() => friendInReason(false)"
              @value="() => validateReason(false)"
              @input="() => validateReason(false)">
            </textarea><br>
            <div v-if="errors.reason" class="text-danger">{{ errors.reason }}</div>
            <div v-if="greenMessages.reason" class="text-success">{{ greenMessages.reason }}</div>
          </div>
          <div class="text-center">
            <button type="submit" class="btn btn-primary me-2">Submit</button>
            <button type="reset" class="btn btn-secondary" @click="clearForm">Reset</button>
          </div>
  
        </form>
      </div>
    </div>

    <div class="row mt-5" v-if="submittedCards.length">
    <div class="w-full">
        <DataTable :value="submittedCards" tableStyle="min-width: 50rem">
            <Column field="username" header="Username" />
            <Column field="password" header="Password" />
            <Column field="isAustralian" header="Australian" />
            <Column field="gender" header="Gender" />
            <Column field="reason" header="Reason for Joining" />
        </DataTable>
    </div>
    </div>
  </div>
</div>
</template>

<script setup>
import { ref } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import ColumnGroup from 'primevue/columngroup';   // optional
import Row from 'primevue/row';                   // optional
import { input } from '@primeuix/themes/aura/iftalabel';

//data table



  
//Form Data 
//object to hold form data
const formData = ref({
    username: '',
    password: '',
    confirmPassword: '',
    isAustralian: false,
    reason: '',
    gender: ''
});

//array to hold submitted cards
const submittedCards = ref([]);

const submitForm = () => {
  validateName(true);
  validatePassword(true);
  validateConfirmPassword();
  validateIsAustralian();
  validateGender();
  validateReason();
  friendInReason();

  if(!errors.value.username && !errors.value.password && !errors.value.confirmPassword && !errors.value.isAustralian && !errors.value.gender && !errors.value.reason) {
    submittedCards.value.push({...formData.value });
    clearForm();
  }
  

};

const clearForm = () => {
    formData.value = {
        username: '',
        password: '',
        confirmPassword: '',
        isAustralian: false,
        reason: '',
        gender: ''
    };
};

//Form validation
const errors = ref({
    username: null,
    password: null,
    confirmPassword: null,
    isAustralian: null,
    gender: null,
    reason: null
});
const greenMessages = ref({
  reason: null
});

const validateName = (blur) => {
  if (formData.value.username.length < 3) {
    if (blur) errors.value.username = 'Username must be at least 3 characters long.';
    } else {
    errors.value.username = null;
  }
}

const validatePassword = (blur) => {
  const password = formData.value.password;
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (password.length<minLength) {
    if (blur) errors.value.password = 'Password must be at least 8 characters long.';
  } else if (!hasUpperCase) {
    errors.value.password = 'Password must contain at least one uppercase letter.';
  } else if (!hasLowerCase) {
    errors.value.password = 'Password must contain at least one lowercase letter.';
  } else if (!hasNumber) {
    errors.value.password = 'Password must contain at least one number.';
  } else if (!hasSpecialChar) {
    errors.value.password = 'Password must contain at least one special character.';
  } else {
    errors.value.password = null;
  }
}

const validateIsAustralian = () => {
  if (!formData.value.isAustralian) {
    errors.value.isAustralian = 'Please confirm if you are an Australian resident.';
  } else {
    errors.value.isAustralian = null;
  }
}

const validateGender = () => {
  if (!formData.value.gender) {
    errors.value.gender = 'Please select a gender.';
  } else {
    errors.value.gender = null;
  }
}

const validateReason = () => {
  if (formData.value.reason.length < 10) {
    errors.value.reason = 'Please provide a reason for joining (at least 10 characters).';
  } else {
    errors.value.reason = null;
  }
}
const friendInReason = () => {
  if (formData.value.reason.toLowerCase().includes('friend')) {
    greenMessages.value.reason = 'It is good to have a friend.';
  } else {
    greenMessages.value.reason = null;
  }
}

const validateConfirmPassword = () => {
  if (formData.value.confirmPassword !== formData.value.password) {
    errors.value.confirmPassword = 'Passwords do not match.';
  } else {
    errors.value.confirmPassword = null;
  }
}

</script>

<style scoped>
  .card {
  border: 1px solid #ccc;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  .card-header {
  background-color: #275FDA;
  color: white;
  padding: 10px;
  border-radius: 10px 10px 0 0;
  }
  .list-group-item {
  padding: 10px;
  }

  .form-check {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

</style>