<template>
  <div v-if="validationErrors.length > 0" class="validation-errors">
    <div v-for="error in validationErrors" :key="error.field" class="error-message">
      <span class="error-icon">⚠️</span>
      <span class="error-text">{{ error.message }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  errors: {
    type: Array,
    default: () => []
  }
})

const validationErrors = computed(() => props.errors || [])
</script>

<style scoped>
.validation-errors {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #fee;
  border-left: 4px solid #f44;
  border-radius: 4px;
  color: #c33;
  font-size: 14px;
  animation: slideDown 0.3s ease;
}

.error-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.error-text {
  flex: 1;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .error-message {
    padding: 10px 12px;
    font-size: 13px;
  }
}
</style>
