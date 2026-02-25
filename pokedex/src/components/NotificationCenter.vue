<template>
  <div class="notifications-container">
    <transition-group name="notification" tag="div">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        class="notification"
        :class="`notification-${notification.type}`"
      >
        <div class="notification-icon">
          <span v-if="notification.type === 'success'">✅</span>
          <span v-else-if="notification.type === 'error'">❌</span>
          <span v-else-if="notification.type === 'warning'">⚠️</span>
          <span v-else>ℹ️</span>
        </div>
        <div class="notification-message">{{ notification.message }}</div>
        <button
          class="notification-close"
          @click="removeNotification(notification.id)"
        >
          ×
        </button>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
const props = defineProps({
  notifications: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['remove'])

function removeNotification(id) {
  emit('remove', id)
}
</script>

<style scoped>
.notifications-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none;
}

.notification {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  color: white;
  pointer-events: auto;
  animation: slideIn 0.3s ease;
  max-width: 400px;
}

.notification-success {
  background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
}

.notification-error {
  background: linear-gradient(135deg, #f44 0%, #d32f2f 100%);
}

.notification-warning {
  background: linear-gradient(135deg, #ff9800 0%, #fb8c00 100%);
}

.notification-info {
  background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
}

.notification-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.notification-message {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
}

.notification-close {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  font-size: 24px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  flex-shrink: 0;
}

.notification-close:hover {
  background: rgba(255, 255, 255, 0.3);
}

.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(400px);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(400px);
}

@media (max-width: 768px) {
  .notifications-container {
    top: 10px;
    right: 10px;
    left: 10px;
    max-width: none;
  }

  .notification {
    max-width: none;
    padding: 12px 16px;
  }

  .notification-message {
    font-size: 13px;
  }
}
</style>
