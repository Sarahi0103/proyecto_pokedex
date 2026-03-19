import { ref, onMounted, onUnmounted } from 'vue'
import { getPendingRequests } from '../main.js'

export function useOfflineStatus() {
  const isOnline = ref(navigator.onLine)
  const pendingRequests = ref(0)

  async function updatePendingCount() {
    const pending = await getPendingRequests()
    pendingRequests.value = pending.length
  }

  function handleOnline() {
    console.log('🟢 Conexión restaurada')
    isOnline.value = true
    
    // Forzar sincronización cuando vuelve la conexión
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      navigator.serviceWorker.ready
        .then((registration) => {
          console.log('📤 Forzando sincronización de peticiones pendientes...')
          return registration.sync.register('sync-requests')
        })
        .catch(err => console.warn('⚠️ No se pudo sincronizar:', err))
    }
    
    updatePendingCount()
  }

  function handleOffline() {
    console.log('🔴 Sin conexión')
    isOnline.value = false
    updatePendingCount()
  }

  onMounted(() => {
    updatePendingCount()
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    // Verificar cada 5 segundos si hay nuevas peticiones pendientes
    const interval = setInterval(updatePendingCount, 5000)
    
    onUnmounted(() => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    })
  })

  return {
    isOnline,
    pendingRequests
  }
}
