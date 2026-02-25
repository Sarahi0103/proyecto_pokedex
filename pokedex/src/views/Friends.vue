<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNetworkRequest } from '../composables/useNetworkRequest'
import { api, currentUser } from '../api'
import ValidationErrors from '../components/ValidationErrors.vue'
import FormInput from '../components/FormInput.vue'
import { useNotifications } from '../composables/useNotifications'
import { validateCode } from '../utils/validation'

const router = useRouter()
const friends = ref([])
const loading = ref(true)
const myCode = ref('')
const friendCode = ref('')
const { request, loading: adding, error: networkError } = useNetworkRequest()
const validationErrors = ref([])
const { success, error: showError, warning: showWarning } = useNotifications()

async function loadFriends(){
  if(!localStorage.token){
    router.push('/login')
    return
  }
  
  loading.value = true
  try{
    const data = await api('/api/friends')
    friends.value = data.friends || []
    
    const user = currentUser()
    myCode.value = user.code || ''
  }catch(e){
    console.error(e)
    showError('Error al cargar amigos')
  }finally{
    loading.value = false
  }
}

async function addFriend(){
  validationErrors.value = []
  
  if(!friendCode.value.trim()){
    showWarning('Por favor ingresa un código')
    return
  }
  
  // Validate friend code format
  const isValidCode = validateCode(friendCode.value.trim())
  if(!isValidCode){
    validationErrors.value = [{field: 'friendCode', message: 'Código inválido (6-9 caracteres alfanuméricos)'}]
    return
  }
  
  if(friendCode.value.trim().toUpperCase() === myCode.value.toUpperCase()){
    showWarning('No puedes agregarte a ti mismo')
    return
  }
  
  console.log('🔍 Intentando agregar amigo con código:', friendCode.value.trim())
  
  const result = await request(
    async () => {
      const result = await api('/api/friends/add', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ code: friendCode.value.trim() })
      })
      return result
    },
    {
      retries: 2,
      onRetry: (attempt, total, time) => {
        showWarning(`Reintentando... (${attempt}/${total})`)
      }
    }
  )
  
  if (result) {
    console.log('✅ Amigo agregado:', result)
    friends.value = result.friends || []
    friendCode.value = ''
    success('✓ Amigo agregado correctamente')
  } else if (networkError.value) {
    if (networkError.value.includes('No autorizado') || networkError.value.includes('Unauthorized')) {
      showError('⚠️ Sesión expirada. Redirigiendo al login...')
      setTimeout(() => {
        localStorage.clear()
        router.push('/login')
      }, 2000)
    } else {
      showError('✗ No se encontró usuario con ese código')
    }
  }
}

function copyCode(){
  navigator.clipboard.writeText(myCode.value)
  success('✓ Código copiado al portapapeles')
}

onMounted(loadFriends)
</script>

<template>
  <div class="friends-page">
    <!-- Header estilo Pokémon -->
    <div class="friends-header">
      <div class="header-content">
        <div class="header-title">
          <span class="friends-icon">👥</span>
          <h1>MIS AMIGOS</h1>
        </div>
        <p class="header-subtitle">Conecta con otros entrenadores Pokémon</p>
      </div>
    </div>

    <!-- My Code Section -->
    <div class="my-code-card">
      <h3>🏅 Tu Código de Entrenador</h3>
      <p class="code-desc">Comparte este código para que otros te agreguen como amigo</p>
      <div class="code-display">
        <div class="code-value">{{ myCode || '------' }}</div>
        <button class="copy-btn" @click="copyCode" :disabled="!myCode">
          <span>📋</span> Copiar
        </button>
      </div>
    </div>

    <!-- Add Friend Section -->
    <div class="add-friend-card">
      <h3>➕ Agregar Nuevo Amigo</h3>
      <p class="add-desc">Ingresa el código de otro entrenador</p>
      <ValidationErrors :errors="validationErrors" />
      <FormInput
        v-model="friendCode"
        type="text"
        label="Código del Amigo"
        placeholder="Código del amigo"
        icon="🔖"
        id="friendCode"
        :disabled="adding"
        :validator="validateCode"
        :show-validation="true"
        maxlength="10"
      />
      <button class="add-btn" @click="addFriend" :disabled="adding">
        {{ adding ? 'Agregando...' : 'Agregar Amigo' }}
      </button>
    </div>

    <!-- Friends List -->
    <div v-if="loading" class="pokemon-loading">
      <div class="loading-pokeball">
        <div class="pokeball-spin">⚪</div>
      </div>
      <p class="loading-text">Cargando amigos...</p>
    </div>

    <div v-else-if="friends.length === 0" class="empty-friends">
      <div class="empty-icon">👥</div>
      <h3>Aún no tienes amigos</h3>
      <p>Agrega amigos usando su código de entrenador</p>
    </div>

    <div v-else>
      <div class="card">
        <div class="section-header">
          <h3>Lista de Amigos ({{ friends.length }})</h3>
          <button class="btn btn-outline btn-sm" @click="loadFriends">
            🔄 Actualizar
          </button>
        </div>

        <div class="friends-grid">
          <div 
            v-for="friend in friends" 
            :key="friend.email || friend.code"
            class="friend-card"
          >
            <div class="friend-avatar">
              {{ (friend.name || friend.email || 'A')[0].toUpperCase() }}
            </div>
            <div class="friend-info">
              <div class="friend-name">{{ friend.name || 'Entrenador' }}</div>
              <div class="friend-email">{{ friend.email }}</div>
              <div class="friend-code">
                <span class="badge">
                  🔖 {{ friend.code }}
                </span>
              </div>
            </div>
            <div class="friend-actions">
              <button class="btn-challenge" @click="router.push(`/battle?friend=${friend.code}`)">
                ⚔️ Desafiar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.friends-page{
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
  min-height: 100vh;
}

.friends-page::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url('/icons/background.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  opacity: 0.3;
  z-index: 0;
  pointer-events: none;
}

.friends-page > * {
  position: relative;
  z-index: 1;
}

/* Header estilo Pokémon */
.friends-header{
  background: linear-gradient(135deg, #06d6a0 0%, #00b894 50%, #06d6a0 100%);
  border-radius: 20px;
  padding: 32px;
  margin-bottom: 24px;
  box-shadow: 0 8px 24px rgba(6, 214, 160, 0.4);
  border: 4px solid #FFCB05;
  position: relative;
  overflow: hidden;
}

.friends-header::before{
  content: '';
  position: absolute;
  top: -50%;
  right: -10%;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(255, 203, 5, 0.2) 0%, transparent 70%);
  border-radius: 50%;
}

.header-content{
  position: relative;
  z-index: 1;
  text-align: center;
}

.header-title{
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 8px;
}

.friends-icon{
  font-size: 36px;
}

.header-title h1{
  color: #FFCB05;
  font-size: 36px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 2px;
  text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.5);
  margin: 0;
}

.header-subtitle{
  color: white;
  font-size: 16px;
  font-weight: 600;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  margin: 0;
}

/* My Code Card */
.my-code-card{
  background: linear-gradient(135deg, #3B4CCA 0%, #2A75BB 100%);
  border-radius: 20px;
  padding: 28px;
  margin-bottom: 24px;
  box-shadow: 0 8px 24px rgba(59, 76, 202, 0.4);
  border: 4px solid #FFCB05;
  color: white;
}

.my-code-card h3{
  color: #FFCB05;
  font-weight: 900;
  margin: 0 0 8px 0;
  font-size: 20px;
  text-transform: uppercase;
  letter-spacing: 1px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.code-desc{
  color: rgba(255,255,255,0.9);
  margin: 0 0 20px 0;
  font-size: 14px;
  font-weight: 500;
}

.code-display{
  display: flex;
  align-items: center;
  gap: 16px;
  background: rgba(255,255,255,0.15);
  padding: 20px;
  border-radius: 15px;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255,255,255,0.2);
}

.code-value{
  flex: 1;
  font-size: 32px;
  font-weight: 900;
  letter-spacing: 4px;
  font-family: monospace;
  text-align: center;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.copy-btn{
  padding: 12px 24px;
  background: linear-gradient(135deg, #FFCB05 0%, #FFA000 100%);
  color: #222;
  border: none;
  border-radius: 20px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(255, 203, 5, 0.4);
  white-space: nowrap;
}

.copy-btn:hover:not(:disabled){
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(255, 203, 5, 0.6);
}

.copy-btn:disabled{
  opacity: 0.5;
  cursor: not-allowed;
}

/* Add Friend Card */
.add-friend-card{
  background: white;
  border-radius: 20px;
  padding: 28px;
  margin-bottom: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 3px solid #FFCB05;
}

.add-friend-card h3{
  color: #3B4CCA;
  font-weight: 900;
  margin: 0 0 8px 0;
  font-size: 20px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.add-desc{
  color: #666;
  margin: 0 0 20px 0;
  font-size: 14px;
}

.add-friend-form{
  display: flex;
  gap: 12px;
}

.friend-code-input{
  flex: 1;
  padding: 14px 20px;
  border: 3px solid #3B4CCA;
  border-radius: 15px;
  font-size: 16px;
  font-weight: 600;
  font-family: monospace;
  letter-spacing: 1px;
  outline: none;
  transition: all 0.3s ease;
  background: #f8f9fa;
}

.friend-code-input:focus{
  border-color: #FFCB05;
  background: white;
  box-shadow: 0 4px 12px rgba(255, 203, 5, 0.3);
}

.friend-code-input:disabled{
  opacity: 0.6;
  cursor: not-allowed;
}

.add-btn{
  padding: 14px 32px;
  background: linear-gradient(135deg, #06d6a0 0%, #00b894 100%);
  color: white;
  border: none;
  border-radius: 15px;
  font-weight: 700;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(6, 214, 160, 0.3);
}

.add-btn:hover:not(:disabled){
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(6, 214, 160, 0.5);
}

.add-btn:disabled{
  opacity: 0.6;
  cursor: not-allowed;
}

.message{
  margin-top: 16px;
  padding: 12px 20px;
  border-radius: 12px;
  font-weight: 600;
  text-align: center;
}

.message.success{
  background: #d4edda;
  color: #155724;
  border: 2px solid #c3e6cb;
}

.message.error{
  background: #f8d7da;
  color: #721c24;
  border: 2px solid #f5c6cb;
}

/* Loading */
.pokemon-loading{
  text-align: center;
  padding: 60px 20px;
}

.loading-pokeball{
  margin-bottom: 20px;
}

.pokeball-spin{
  display: inline-block;
  font-size: 60px;
  animation: spin 1s linear infinite;
}

@keyframes spin{
  from{ transform: rotate(0deg); }
  to{ transform: rotate(360deg); }
}

.loading-text{
  font-size: 18px;
  font-weight: 600;
  color: #666;
}

/* Empty State */
.empty-friends{
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 20px;
  border: 3px dashed #06d6a0;
}

.empty-icon{
  font-size: 80px;
  margin-bottom: 16px;
}

.empty-friends h3{
  color: #222;
  margin-bottom: 8px;
  font-size: 24px;
}

.empty-friends p{
  color: #666;
}

/* Friends List */
.section-header{
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px 24px;
  background: white;
  border-radius: 15px;
  border: 3px solid #FFCB05;
}

.section-header h3{
  color: #3B4CCA;
  font-weight: 900;
  margin: 0;
  font-size: 20px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.friends-grid{
  display: grid;
  gap: 20px;
}

.friend-card{
  display: grid;
  grid-template-columns: 70px 1fr auto;
  gap: 20px;
  align-items: center;
  padding: 20px;
  background: white;
  border-radius: 15px;
  border: 3px solid transparent;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.friend-card:hover{
  border-color: #FFCB05;
  box-shadow: 0 6px 20px rgba(255, 203, 5, 0.3);
  transform: translateY(-2px);
}

.friend-avatar{
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3B4CCA 0%, #2A75BB 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: 900;
  box-shadow: 0 4px 12px rgba(59, 76, 202, 0.4);
  border: 4px solid #FFCB05;
}

.friend-info{
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.friend-name{
  font-weight: 800;
  font-size: 18px;
  color: #222;
  text-transform: capitalize;
  letter-spacing: 0.5px;
}

.friend-email{
  color: #666;
  font-size: 14px;
  font-weight: 500;
}

.friend-code{
  margin-top: 4px;
}

.friend-code .badge{
  background: linear-gradient(135deg, #3B4CCA 0%, #2A75BB 100%);
  color: white;
  padding: 6px 14px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
  font-family: monospace;
  letter-spacing: 1px;
  box-shadow: 0 2px 8px rgba(59, 76, 202, 0.3);
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.friend-actions{
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.btn-challenge{
  padding: 12px 24px;
  background: linear-gradient(135deg, #FF6B6B 0%, #FF5252 100%);
  color: white;
  border: 3px solid #FFCB05;
  border-radius: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 3px 10px rgba(255, 107, 107, 0.3);
  font-size: 14px;
  white-space: nowrap;
}

.btn-challenge:hover{
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(255, 107, 107, 0.5);
  background: linear-gradient(135deg, #FF5252 0%, #FF6B6B 100%);
}

@media (max-width: 768px){
  .header-title h1{
    font-size: 24px;
  }
  
  .friends-icon{
    font-size: 28px;
  }
  
  .code-display{
    flex-direction: column;
  }
  
  .code-value{
    font-size: 24px;
  }
  
  .copy-btn, .add-btn{
    width: 100%;
    justify-content: center;
  }
  
  .add-friend-form{
    flex-direction: column;
  }
  
  .friend-card{
    grid-template-columns: 1fr;
    text-align: center;
    gap: 16px;
  }
  
  .friend-avatar{
    margin: 0 auto;
  }
  
  .friend-actions button{
    width: 100%;
  }
}
</style>
