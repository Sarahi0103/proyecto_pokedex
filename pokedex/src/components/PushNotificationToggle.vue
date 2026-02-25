<script setup>
import { onMounted, ref } from 'vue';
import { usePushNotifications } from '../composables/usePushNotifications';
import { api } from '../api';

const {
  isSupported,
  isSubscribed,
  loading,
  error,
  subscribe,
  unsubscribe,
  checkSubscription
} = usePushNotifications();

const testLoading = ref(false);
const testMessage = ref('');

// Manejar suscripción
async function handleSubscribe() {
  try {
    await subscribe();
  } catch (err) {
    console.error('Error al suscribirse:', err);
  }
}

// Manejar desuscripción
async function handleUnsubscribe() {
  try {
    await unsubscribe();
  } catch (err) {
    console.error('Error al desuscribirse:', err);
  }
}

// Enviar notificación de prueba
async function sendTestNotification() {
  try {
    testLoading.value = true;
    testMessage.value = '';
    
    const response = await api('/api/push/test', 'POST');
    
    if (response.success) {
      testMessage.value = '✅ Notificación enviada! Revisa tus notificaciones.';
      console.log('✅ Notificación de prueba enviada:', response);
    } else {
      testMessage.value = '⚠️ No hay suscripciones activas';
    }
    
    // Limpiar mensaje después de 5 segundos
    setTimeout(() => {
      testMessage.value = '';
    }, 5000);
  } catch (err) {
    console.error('Error al enviar notificación de prueba:', err);
    testMessage.value = '❌ Error al enviar notificación';
  } finally {
    testLoading.value = false;
  }
}

onMounted(() => {
  checkSubscription();
});
</script>

<template>
  <div class="push-notifications-toggle">
    <!-- Siempre mostrar el componente -->
    <div class="notification-controls">
      <div class="notification-info">
        <div class="icon">🔔</div>
        <div class="text-content">
          <h3>Notificaciones Push</h3>
          <p v-if="!isSupported" class="status warning">
            ⚠️ Tu navegador no soporta notificaciones push
          </p>
          <p v-else-if="isSubscribed" class="status active">
            ✅ Activadas - Recibirás notificaciones sobre invitaciones de amistad y retos de batalla
          </p>
          <p v-else class="status inactive">
            🔕 Desactivadas - No recibirás notificaciones push
          </p>
        </div>
      </div>
      
      <div class="notification-actions" v-if="isSupported">
        <button 
          v-if="!isSubscribed"
          @click="handleSubscribe"
          :disabled="loading"
          class="btn-subscribe"
        >
          <span v-if="!loading">🔔 Activar Notificaciones</span>
          <span v-else>⏳ Activando...</span>
        </button>
        
        <button 
          v-else
          @click="handleUnsubscribe"
          :disabled="loading"
          class="btn-unsubscribe"
        >
          <span v-if="!loading">🔕 Desactivar Notificaciones</span>
          <span v-else>⏳ Desactivando...</span>
        </button>
        
        <!-- Botón de prueba (solo si está suscrito) -->
        <button 
          v-if="isSubscribed"
          @click="sendTestNotification"
          :disabled="testLoading"
          class="btn-test"
        >
          <span v-if="!testLoading">🧪 Probar Notificación</span>
          <span v-else>⏳ Enviando...</span>
        </button>
      </div>
      
      <!-- Mensaje de prueba -->
      <div v-if="testMessage" class="test-message" :class="{ success: testMessage.includes('✅') }">
        {{ testMessage }}
      </div>
      
      <div v-if="error" class="notification-error">
        ❌ Error: {{ error }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.push-notifications-toggle {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 1.5rem;
  margin: 1rem 0;
}

.notification-warning {
  text-align: center;
  padding: 1rem;
  color: var(--text-muted);
}

.notification-controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.notification-info {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.text-content {
  flex: 1;
}

.text-content h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.125rem;
  color: var(--text-primary);
}

.status {
  margin: 0;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.status.active {
  color: var(--success-color, #10b981);
}

.status.inactive {
  color: var(--text-muted);
}

.notification-actions {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.btn-subscribe,
.btn-unsubscribe,
.btn-test {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-subscribe {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-subscribe:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-unsubscribe {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.btn-unsubscribe:hover:not(:disabled) {
  background: var(--bg-tertiary);
}

.btn-test {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
}

.btn-test:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
}

.btn-subscribe:disabled,
.btn-unsubscribe:disabled,
.btn-test:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.test-message {
  padding: 0.75rem;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 8px;
  color: #f59e0b;
  font-size: 0.875rem;
  text-align: center;
  margin-top: 0.5rem;
}

.test-message.success {
  background: rgba(16, 185, 129, 0.1);
  border-color: rgba(16, 185, 129, 0.3);
  color: #10b981;
}

.notification-error {
  padding: 0.75rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  color: #ef4444;
  font-size: 0.875rem;
  text-align: center;
}

@media (max-width: 640px) {
  .push-notifications-toggle {
    padding: 1rem;
  }
  
  .notification-info {
    flex-direction: column;
    text-align: center;
  }
  
  .icon {
    font-size: 2.5rem;
  }
}
</style>
