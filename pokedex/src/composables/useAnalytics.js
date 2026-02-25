import { ref, watch } from 'vue'

/**
 * useAnalytics - Composable para rastrear eventos de usuario
 * Implementa Google Analytics compatible events
 */

export function useAnalytics() {
  const analyticsEnabled = ref(JSON.parse(localStorage.getItem('analytics_enabled') ?? 'false'))
  
  // Queue de eventos por si no hay conexión
  const eventQueue = ref([])

  // Configuración del analytics
  const config = {
    apiEndpoint: (import.meta.env.VITE_API_BASE || 'http://localhost:4000') + '/api/analytics',
    batchSize: 10,
    batchInterval: 30000, // 30 segundos
  }

  // Watch para cambios en el toggle
  watch(analyticsEnabled, (newVal) => {
    localStorage.setItem('analytics_enabled', JSON.stringify(newVal))
  })

  /**
   * Registra un evento de usuario
   */
  function trackEvent(category, action, label = null, value = null) {
    if (!analyticsEnabled.value) return

    const event = {
      timestamp: new Date().toISOString(),
      category,
      action,
      label,
      value,
      url: window.location.pathname,
      userAgent: navigator.userAgent,
    }

    eventQueue.value.push(event)

    // Si alcanzamos el batch size, enviar inmediatamente
    if (eventQueue.value.length >= config.batchSize) {
      flushEvents()
    }
  }

  /**
   * Rastrear vista de página
   */
  function trackPageView(title = document.title) {
    trackEvent('pageview', window.location.pathname, title)
  }

  /**
   * Rastrear tiempo en página
   */
  function trackTimeOnPage(pageName) {
    const startTime = performance.now()
    
    return () => {
      const endTime = performance.now()
      const timeSpent = Math.round(endTime - startTime) / 1000 // en segundos
      trackEvent('time_on_page', pageName, 'seconds', timeSpent)
    }
  }

  /**
   * Rastrear clics en botones
   */
  function trackButtonClick(buttonName) {
    trackEvent('interaction', 'button_click', buttonName)
  }

  /**
   * Rastrear envío de formularios
   */
  function trackFormSubmit(formName, success = true) {
    trackEvent('form', 'submit', formName, success ? 1 : 0)
  }

  /**
   * Rastrear errores
   */
  function trackError(errorName, errorMessage, severity = 'error') {
    trackEvent('error', errorName, errorMessage, severity === 'critical' ? 1 : 0)
    
    // También log en consola para debugging
    console.warn(`[Analytics] ${errorName}: ${errorMessage}`)
  }

  /**
   * Rastrear acciones de usuario
   */
  function trackAction(category, action, metadata = {}) {
    const event = {
      timestamp: new Date().toISOString(),
      category,
      action,
      metadata,
      url: window.location.pathname,
    }
    
    eventQueue.value.push(event)
  }

  /**
   * Envía eventos acumulados al servidor
   */
  async function flushEvents() {
    if (!analyticsEnabled.value || eventQueue.value.length === 0) return

    const eventsToSend = [...eventQueue.value]
    eventQueue.value = [] // Limpiar la queue

    try {
      const response = await fetch(config.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: eventsToSend }),
      })

      if (!response.ok) {
        // Si falla, re-agregar a la queue (con límite)
        if (eventQueue.value.length < 100) {
          eventQueue.value = [...eventsToSend, ...eventQueue.value]
        }
      }
    } catch (error) {
      console.error('[Analytics] Error al enviar eventos:', error)
      // Re-agregar eventos a la queue
      if (eventQueue.value.length < 100) {
        eventQueue.value = [...eventsToSend, ...eventQueue.value]
      }
    }
  }

  /**
   * Setup automático de tracking
   */
  function setupAutoTracking() {
    // Rastrear vista inicial
    trackPageView()

    // Rastrear cambios de página
    window.addEventListener('popstate', () => {
      trackPageView()
    })

    // Flush periódico de eventos
    setInterval(flushEvents, config.batchInterval)

    // Flush al cerrar/recargar página
    window.addEventListener('beforeunload', flushEvents)

    // Rastrear visibilidad de página
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        flushEvents()
      }
    })
  }

  /**
   * Métodos de conveniencia para acciones comunes
   */
  const tracking = {
    // Autenticación
    login: (success = true) => trackFormSubmit('login', success),
    register: (success = true) => trackFormSubmit('register', success),
    logout: () => trackAction('auth', 'logout'),

    // Batalla
    startBattle: (opponent) => trackAction('battle', 'start', { opponent }),
    endBattle: (winner, duration) => trackAction('battle', 'end', { winner, duration }),
    attackAction: (pokemon) => trackAction('battle', 'attack', { pokemon }),

    // Amigos
    addFriend: (success = true) => trackFormSubmit('add_friend', success),
    removeFriend: () => trackAction('social', 'remove_friend'),
    viewFriendList: () => trackPageView('friends_list'),

    // Pokémon
    viewPokemon: (pokemonId) => trackAction('pokemon', 'view', { id: pokemonId }),
    addToFavorite: (pokemonId) => trackAction('pokemon', 'favorite', { id: pokemonId }),
    removeFromFavorite: (pokemonId) => trackAction('pokemon', 'unfavorite', { id: pokemonId }),

    // Equipo
    createTeam: (teamName) => trackAction('team', 'create', { name: teamName }),
    updateTeam: (teamId) => trackAction('team', 'update', { id: teamId }),
    deleteTeam: (teamId) => trackAction('team', 'delete', { id: teamId }),
  }

  return {
    analyticsEnabled,
    eventQueue,
    trackEvent,
    trackPageView,
    trackTimeOnPage,
    trackButtonClick,
    trackFormSubmit,
    trackError,
    trackAction,
    flushEvents,
    setupAutoTracking,
    tracking,
  }
}
