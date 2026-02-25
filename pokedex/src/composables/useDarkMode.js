import { ref, watch, onMounted } from 'vue'

/**
 * useDarkMode - Composable para manejar tema oscuro
 */
export function useDarkMode() {
  const isDark = ref(false)

  // Preferencia del usuario guardada
  const preferredTheme = ref(localStorage.getItem('theme') || 'system')

  /**
   * Detecta preferencia de SO
   */
  function getSystemPreference() {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }

  /**
   * Determina si debe ser dark mode
   */
  function shouldBeDark() {
    if (preferredTheme.value === 'dark') return true
    if (preferredTheme.value === 'light') return false
    return getSystemPreference()
  }

  /**
   * Aplica el tema a la página
   */
  function applyTheme() {
    isDark.value = shouldBeDark()

    if (isDark.value) {
      document.documentElement.setAttribute('data-theme', 'dark')
      document.documentElement.classList.add('dark-mode')
    } else {
      document.documentElement.removeAttribute('data-theme')
      document.documentElement.classList.remove('dark-mode')
    }

    localStorage.setItem('theme', preferredTheme.value)
  }

  /**
   * Cambia el tema
   */
  function setTheme(theme) {
    preferredTheme.value = theme // 'light', 'dark', 'system'
    applyTheme()
  }

  /**
   * Toggle entre light/dark (ignora system)
   */
  function toggleTheme() {
    setTheme(isDark.value ? 'light' : 'dark')
  }

  /**
   * Watch para cambios en preferencia del sistema
   */
  function setupSystemPreferenceListener() {
    if (typeof window === 'undefined') return
    
    const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    colorSchemeQuery.addEventListener('change', () => {
      if (preferredTheme.value === 'system') {
        applyTheme()
      }
    })
  }

  // Inicializar en mount
  onMounted(() => {
    applyTheme()
    setupSystemPreferenceListener()
  })

  return {
    isDark,
    preferredTheme,
    setTheme,
    toggleTheme,
    applyTheme,
  }
}
