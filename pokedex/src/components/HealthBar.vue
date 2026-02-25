<template>
  <div class="health-bar-container">
    <div class="pokemon-info">
      <span class="pokemon-name">{{ pokemonName }}</span>
      <span class="pokemon-level">Lv{{ level }}</span>
    </div>
    <div class="health-bar-wrapper">
      <div class="health-bar">
        <div 
          class="health-bar-fill" 
          :class="healthClass"
          :style="{ width: healthPercentage + '%' }"
        ></div>
      </div>
      <div class="health-text">
        <span class="current-hp">{{ currentHP }}</span>
        <span class="separator">/</span>
        <span class="max-hp">{{ maxHP }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  pokemonName: {
    type: String,
    required: true
  },
  currentHP: {
    type: Number,
    required: true
  },
  maxHP: {
    type: Number,
    required: true
  },
  level: {
    type: Number,
    default: 50
  }
})

const healthPercentage = computed(() => {
  return Math.max(0, Math.min(100, (props.currentHP / props.maxHP) * 100))
})

const healthClass = computed(() => {
  const percent = healthPercentage.value
  if (percent > 50) return 'health-high'
  if (percent > 20) return 'health-medium'
  return 'health-low'
})
</script>

<style scoped>
.health-bar-container {
  min-width: 200px;
  padding: 8px 12px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.pokemon-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  font-weight: bold;
}

.pokemon-name {
  font-size: 14px;
  color: #2c3e50;
  text-transform: capitalize;
}

.pokemon-level {
  font-size: 12px;
  color: #7f8c8d;
}

.health-bar-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.health-bar {
  flex: 1;
  height: 20px;
  background: #ecf0f1;
  border-radius: 10px;
  overflow: hidden;
  border: 2px solid #34495e;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
}

.health-bar-fill {
  height: 100%;
  transition: width 0.8s ease-out, background-color 0.3s ease;
  border-radius: 8px;
  position: relative;
  overflow: hidden;
}

.health-bar-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.3) 50%,
    transparent 100%
  );
  animation: shine 2s infinite;
}

@keyframes shine {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.health-high {
  background: linear-gradient(90deg, #2ecc71 0%, #27ae60 100%);
}

.health-medium {
  background: linear-gradient(90deg, #f39c12 0%, #e67e22 100%);
}

.health-low {
  background: linear-gradient(90deg, #e74c3c 0%, #c0392b 100%);
  animation: pulse-low 0.5s infinite alternate;
}

@keyframes pulse-low {
  from {
    opacity: 1;
  }
  to {
    opacity: 0.7;
  }
}

.health-text {
  font-size: 12px;
  font-weight: bold;
  color: #2c3e50;
  white-space: nowrap;
  min-width: 60px;
  text-align: right;
}

.current-hp {
  color: #e74c3c;
}

.separator {
  color: #95a5a6;
  margin: 0 2px;
}

.max-hp {
  color: #7f8c8d;
}
</style>
