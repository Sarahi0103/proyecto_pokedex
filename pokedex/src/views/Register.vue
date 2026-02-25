<script setup>
import { ref } from 'vue'
import { login } from '../api'
import { setUser } from '../store'
import { useRouter } from 'vue-router'
import { useNetworkRequest } from '../composables/useNetworkRequest'
import ValidationErrors from '../components/ValidationErrors.vue'
import FormInput from '../components/FormInput.vue'
import { validateRegisterForm, validateEmail, validatePassword, validateName } from '../utils/validation'
import { useNotifications } from '../composables/useNotifications'

const router = useRouter()
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const name = ref('')
const validationErrors = ref([])
const { request, loading, error: networkError } = useNetworkRequest()

const { success, error: showError, warning: showWarning } = useNotifications()

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

async function submit(){
  // Validar formulario
  validationErrors.value = validateRegisterForm(
    email.value,
    password.value,
    confirmPassword.value,
    name.value
  )
  
  if (validationErrors.value.length > 0) {
    return
  }
  
  const result = await request(
    async () => {
      const res = await fetch(API_BASE + '/auth/register', { 
        method: 'POST', 
        headers:{'Content-Type':'application/json'}, 
        body: JSON.stringify({ email: email.value, password: password.value, name: name.value }) 
      })
      
      // Verificar si la respuesta es HTML en lugar de JSON
      const contentType = res.headers.get('content-type')
      if (contentType && contentType.includes('text/html')) {
        throw new Error('Error de comunicación con el servidor. El backend no está respondiendo correctamente.')
      }
      
      const data = await res.json()
      
      if(!res.ok) {
        const err = new Error(data.error || 'Error al registrarse')
        err.status = res.status
        throw err
      }
      
      return data
    },
    {
      retries: 3,
      onRetry: (attempt, total, time) => {
        showWarning(`Reintentando... (${attempt}/${total}) en ${Math.round(time/1000)}s`)
      }
    }
  )

  if (result && result.token) {
    login(result.token, result.user)
    setUser(result.user)
    success('¡Cuenta creada exitosamente!')
    setTimeout(() => router.push('/'), 1500)
  } else if (networkError.value) {
    showError(networkError.value)
  }
}

function registerWithGoogle() {
  window.location.href = `${API_BASE}/auth/google`
}
</script>

<template>
  <div class="register-container">
    <div class="register-card">
      <div class="pokeball-decoration">
        <div class="pokeball-big">
          <div class="pokeball-top"></div>
          <div class="pokeball-center"></div>
          <div class="pokeball-bottom"></div>
        </div>
      </div>
      
      <div class="register-header">
        <h1>¡Únete a la Aventura!</h1>
        <p class="subtitle">Crea tu cuenta de Entrenador Pokémon</p>
      </div>

      <form @submit.prevent="submit" class="register-form">
        <ValidationErrors :errors="validationErrors" />
        
        <FormInput
          v-model="name"
          type="text"
          label="Nombre"
          placeholder="Tu nombre"
          icon="👤"
          id="name"
          :disabled="loading"
          :validator="validateName"
          :show-validation="true"
          autocomplete="name"
        />

        <FormInput
          v-model="email"
          type="email"
          label="Email"
          placeholder="tu@email.com"
          icon="📧"
          id="email"
          :disabled="loading"
          :validator="validateEmail"
          :show-validation="true"
          autocomplete="email"
        />

        <FormInput
          v-model="password"
          type="password"
          label="Contraseña"
          placeholder="Mínimo 8 caracteres, 1 mayúscula y 1 número"
          icon="🔐"
          id="password"
          :disabled="loading"
          :validator="validatePassword"
          :show-validation="true"
          :show-strength="true"
          autocomplete="new-password"
        />

        <FormInput
          v-model="confirmPassword"
          type="password"
          label="Confirmar Contraseña"
          placeholder="Repite tu contraseña"
          icon="🔐"
          id="confirmPassword"
          :disabled="loading"
          autocomplete="new-password"
        />

        <button type="submit" class="btn btn-accent" :disabled="loading" style="width:100%">
          {{ loading ? 'Creando cuenta...' : 'Crear Cuenta' }}
        </button>

        <div class="divider">
          <span>o regístrate con</span>
        </div>

        <button 
          type="button" 
          class="btn btn-google" 
          @click="registerWithGoogle"
          :disabled="loading"
        >
          <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            <path fill="none" d="M0 0h48v48H0z"/>
          </svg>
          Registrarse con Google
        </button>

        <div class="register-footer">
          <p class="muted small">
            ¿Ya tienes cuenta? 
            <router-link to="/login" style="color:var(--blue); font-weight:600; text-decoration:none">
              Inicia sesión aquí
            </router-link>
          </p>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.register-container{
  display:flex;
  align-items:center;
  justify-content:center;
  min-height:calc(100vh - 200px);
  padding: 20px;
  background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
}

.register-card{
  max-width:520px;
  width:100%;
  margin:0 auto;
  background: white;
  border-radius: 25px;
  padding: 40px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.15);
  border: 4px solid #3B4CCA;
  position: relative;
  overflow: hidden;
  animation: slideInUp 0.5s ease-out;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.pokeball-decoration{
  position: absolute;
  top: -60px;
  right: -60px;
  width: 200px;
  height: 200px;
  opacity: 0.08;
  animation: spin 20s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.pokeball-big{
  width: 100%;
  height: 100%;
  position: relative;
}

.pokeball-top{
  width: 100%;
  height: 50%;
  background: #3B4CCA;
  border-radius: 100px 100px 0 0;
}

.pokeball-bottom{
  width: 100%;
  height: 50%;
  background: white;
  border-radius: 0 0 100px 100px;
}

.pokeball-center{
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60px;
  height: 60px;
  background: white;
  border: 8px solid #222;
  border-radius: 50%;
}

.pokeball-center::after{
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 24px;
  height: 24px;
  background: white;
  border: 4px solid #222;
  border-radius: 50%;
}

.register-header{
  text-align:center;
  margin-bottom:32px;
  position: relative;
  z-index: 1;
}

.register-header h1{
  color:#3B4CCA;
  margin-bottom:8px;
  font-size: 28px;
  font-weight: 800;
  text-shadow: 2px 2px 0px rgba(255, 203, 5, 0.3);
}

.subtitle{
  color: #666;
  font-size: 15px;
  font-weight: 500;
}

.register-form{
  display:flex;
  flex-direction:column;
  gap:16px;
  position: relative;
  z-index: 1;
}

.form-group{
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label{
  font-weight: 700;
  color: #222;
  font-size: 14px;
}

.form-group input{
  padding: 14px 18px;
  border: 3px solid #E0E0E0;
  border-radius: 15px;
  font-size: 15px;
  transition: all 0.3s ease;
  background: #F9F9F9;
}

.form-group input:focus{
  outline: none;
  border-color: #3B4CCA;
  background: white;
  box-shadow: 0 0 0 4px rgba(59, 76, 202, 0.1);
}

.form-group input:disabled{
  opacity: 0.6;
  cursor: not-allowed;
}

.error{
  background: linear-gradient(135deg, #FF6B6B 0%, #EE5A52 100%);
  color: white;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  text-align: center;
  border: 2px solid #CC0000;
  animation: shake 0.5s ease;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
}

.btn-accent{
  background: linear-gradient(135deg, #3B4CCA 0%, #2A75BB 100%);
  color: white;
  border: none;
  padding: 16px;
  border-radius: 15px;
  font-size: 16px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(59, 76, 202, 0.3);
  border: 3px solid #FFCB05;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.btn-accent:hover:not(:disabled){
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(59, 76, 202, 0.4);
}

.btn-accent:active:not(:disabled){
  transform: translateY(0);
}

.btn-accent:disabled{
  opacity: 0.6;
  cursor: not-allowed;
}

.register-footer{
  text-align:center;
  margin-top:24px;
  padding-top:24px;
  border-top:2px solid #E0E0E0;
}

.register-footer a{
  color: #3B4CCA;
  font-weight: 700;
  text-decoration: none;
  transition: color 0.3s ease;
}

.register-footer a:hover{
  color: #2A75BB;
  text-decoration: underline;
}

.divider{
  position:relative;
  text-align:center;
  margin:24px 0;
}

.divider::before{
  content:'';
  position:absolute;
  top:50%;
  left:0;
  right:0;
  height:2px;
  background: #E0E0E0;
}

.divider span{
  position:relative;
  background: white;
  padding:0 16px;
  color: #999;
  font-size: 13px;
  font-weight: 600;
}

.btn-google{
  width:100%;
  background: white;
  color: #333;
  border: 3px solid #E0E0E0;
  display:flex;
  align-items:center;
  justify-content:center;
  gap:12px;
  font-weight: 700;
  padding: 14px;
  border-radius: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 15px;
}

.btn-google:hover:not(:disabled){
  background: #F9F9F9;
  border-color: #3B4CCA;
  transform:translateY(-2px);
  box-shadow:0 4px 15px rgba(0,0,0,0.1);
}

.btn-google:disabled{
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-google svg{
  flex-shrink:0;
}

.muted{
  color: #999;
}

.small{
  font-size: 14px;
}
</style>
