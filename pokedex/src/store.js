import { ref } from 'vue'

// Estado reactivo compartido globalmente
export const user = ref(null)

// Inicializar usuario desde localStorage al cargar la app
export function initUser(){
  try{
    if(!localStorage.token) return
    const userData = localStorage.user
    if(!userData || userData === '{}') return
    const parsed = JSON.parse(userData)
    if(!parsed.email) return
    user.value = parsed
  }catch(e){
    user.value = null
  }
}

// Actualizar usuario (al hacer login)
export function setUser(userData){
  user.value = userData
}

// Limpiar usuario (al hacer logout)
export function clearUser(){
  user.value = null
}

// Inicializar al cargar el módulo
initUser()
