import { ref, reactive } from 'vue'

export function useNetworkRequest() {
  const loading = ref(false)
  const error = ref(null)
  const isOnline = ref(navigator.onLine)
  const retryCount = ref(0)
  const maxRetries = 3

  // Listen for online/offline events
  window.addEventListener('online', () => {
    isOnline.value = true
    error.value = null
  })

  window.addEventListener('offline', () => {
    isOnline.value = false
    error.value = 'Sin conexión. Intenta de nuevo cuando estés online.'
  })

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

  async function request(fn, options = {}) {
    const { retries = maxRetries, onRetry = null, backoffMultiplier = 2 } = options

    if (!isOnline.value) {
      error.value = 'Sin conexión a internet'
      return null
    }

    loading.value = true
    retryCount.value = 0

    while (retryCount.value <= retries) {
      try {
        const result = await fn()
        loading.value = false
        error.value = null
        retryCount.value = 0
        return result
      } catch (err) {
        // No reintentar si es error de validación (4xx)
        if (err.status && err.status >= 400 && err.status < 500 && err.status !== 408) {
          error.value = err.message || 'Error en la solicitud'
          loading.value = false
          return null
        }

        retryCount.value++

        if (retryCount.value <= retries) {
          // Exponential backoff: 1s, 2s, 4s
          const backoffTime = Math.pow(backoffMultiplier, retryCount.value - 1) * 1000
          
          if (onRetry) {
            onRetry(retryCount.value, retries, backoffTime)
          }

          await sleep(backoffTime)
        } else {
          error.value = err.message || 'Error de conexión. Intenta de nuevo más tarde.'
          loading.value = false
          return null
        }
      }
    }
  }

  function clearError() {
    error.value = null
  }

  function reset() {
    loading.value = false
    error.value = null
    retryCount.value = 0
  }

  return {
    loading,
    error,
    isOnline,
    retryCount,
    request,
    clearError,
    reset
  }
}
