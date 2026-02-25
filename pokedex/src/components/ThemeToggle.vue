<template>
  <div class="theme-toggle" :title="`Cambiar a modo ${isDark ? 'claro' : 'oscuro'}`">
    <button 
      class="theme-toggle-btn"
      @click="toggleTheme"
      :aria-label="`Cambiar a modo ${isDark ? 'claro' : 'oscuro'}`"
    >
      <span v-if="!isDark" class="theme-icon">🌙</span>
      <span v-else class="theme-icon">☀️</span>
    </button>

    <div v-if="showMenu" class="theme-menu">
      <button 
        v-for="theme in ['light', 'dark', 'system']"
        :key="theme"
        class="theme-option"
        :class="{ active: preferredTheme === theme }"
        @click="selectTheme(theme)"
      >
        {{ themeLabels[theme] }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useDarkMode } from '../composables/useDarkMode'

const { isDark, preferredTheme, toggleTheme, setTheme } = useDarkMode()
const showMenu = ref(false)

const themeLabels = {
  light: '☀️ Claro',
  dark: '🌙 Oscuro',
  system: '🖥️ Sistema',
}

function selectTheme(theme) {
  setTheme(theme)
  showMenu.value = false
}
</script>

<style scoped>
.theme-toggle {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.theme-toggle-btn {
  background: none;
  border: 2px solid var(--border);
  border-radius: var(--radius-full);
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-base);
  font-size: 1.25rem;
}

.theme-toggle-btn:hover {
  background-color: var(--surface-primary);
  border-color: var(--blue);
}

.theme-toggle-btn:active {
  transform: scale(0.95);
}

.theme-icon {
  display: inline-block;
  transition: transform var(--transition-base);
}

.theme-toggle-btn:hover .theme-icon {
  transform: rotate(20deg);
}

.theme-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: var(--space-2);
  background-color: var(--surface-primary);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  z-index: 1000;
  min-width: 150px;
  overflow: hidden;
}

.theme-option {
  display: block;
  width: 100%;
  padding: var(--space-3) var(--space-4);
  background: transparent;
  border: none;
  color: var(--text-primary);
  text-align: left;
  cursor: pointer;
  transition: all var(--transition-base);
  font-size: 0.9375rem;
}

.theme-option:hover {
  background-color: var(--surface-secondary);
  color: var(--blue);
}

.theme-option.active {
  background-color: rgba(77, 184, 255, 0.15);
  color: var(--blue);
  font-weight: 600;
}

@media (max-width: 640px) {
  .theme-toggle-btn {
    width: 36px;
    height: 36px;
    font-size: 1.125rem;
  }

  .theme-menu {
    min-width: 140px;
  }

  .theme-option {
    padding: var(--space-2) var(--space-3);
    font-size: 0.875rem;
  }
}
</style>
