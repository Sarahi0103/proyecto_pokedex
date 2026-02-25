import { ref } from 'vue'

export function useNotifications() {
  const notifications = ref([])

  function addNotification(message, type = 'info', duration = 3000) {
    const id = Date.now() + Math.random()
    const notification = { id, message, type }
    
    notifications.value.push(notification)

    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, duration)
    }

    return id
  }

  function removeNotification(id) {
    notifications.value = notifications.value.filter(n => n.id !== id)
  }

  function success(message, duration = 3000) {
    return addNotification(message, 'success', duration)
  }

  function error(message, duration = 4000) {
    return addNotification(message, 'error', duration)
  }

  function warning(message, duration = 3500) {
    return addNotification(message, 'warning', duration)
  }

  function info(message, duration = 3000) {
    return addNotification(message, 'info', duration)
  }

  return {
    notifications,
    addNotification,
    removeNotification,
    success,
    error,
    warning,
    info
  }
}
