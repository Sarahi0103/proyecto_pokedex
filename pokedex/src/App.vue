<script setup>
import { useRouter, useRoute } from 'vue-router'
import { onMounted } from 'vue'
import { logout } from './api'
import { user, clearUser } from './store'
import ThemeToggle from './components/ThemeToggle.vue'
import NotificationCenter from './components/NotificationCenter.vue'
import { useAnalytics } from './composables/useAnalytics'
import { usePerformance } from './composables/usePerformance'
import './styles.css'

const router = useRouter()
const route = useRoute()
const { setupAutoTracking } = useAnalytics()
const { monitorWebVitals } = usePerformance()

onMounted(() => {
  // Inicializar analytics
  setupAutoTracking()
  
  // Monitorear Web Vitals
  monitorWebVitals()
  
  // Manejar clicks en notificaciones push
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
        const url = event.data.url || '/'
        console.log('📱 Navegando desde notificación push:', url)
        router.push(url)
      }
    })
  }
})

function handleLogout(){
  logout()
  clearUser()
  router.push('/login')
}

function isActive(path){
  return route.path === path
}
</script>

<template>
  <div class="app-shell">
    <NotificationCenter />
    <header class="pokemon-header">
      <div class="header-top">
        <div class="pokeball-logo" @click="router.push('/')" style="cursor:pointer">
          <div class="pokeball">
            <div class="pokeball-button"></div>
          </div>
          <div class="brand-text">
            <div class="brand-title">PokéDex</div>
            <div class="brand-subtitle">Entrenador Master</div>
          </div>
        </div>

        <div class="user-section" v-if="user">
          <ThemeToggle />
          <div class="trainer-card">
            <div class="trainer-avatar">👤</div>
            <div class="trainer-info">
              <div class="trainer-name">{{ user.name || user.email }}</div>
              <div class="trainer-rank">Entrenador</div>
            </div>
          </div>
          <button class="logout-btn" @click="handleLogout">
            <span>🚪</span> Salir
          </button>
        </div>

        <div v-else class="auth-buttons-header">
          <router-link to="/login">
            <button class="pokemon-btn login-btn">Iniciar Sesión</button>
          </router-link>
          <router-link to="/register">
            <button class="pokemon-btn register-btn">Registrarse</button>
          </router-link>
        </div>
      </div>
      
      <nav class="pokemon-nav" v-if="user">
        <router-link to="/" :class="['nav-item', { active: isActive('/') }]">
          <span class="nav-icon">🔍</span>
          <span class="nav-text">Explorar</span>
        </router-link>
        <router-link to="/favorites" :class="['nav-item', { active: isActive('/favorites') }]">
          <span class="nav-icon">⭐</span>
          <span class="nav-text">Favoritos</span>
        </router-link>
        <router-link to="/teams" :class="['nav-item', { active: isActive('/teams') }]">
          <span class="nav-icon">🛡️</span>
          <span class="nav-text">Equipos</span>
        </router-link>
        <router-link to="/friends" :class="['nav-item', { active: isActive('/friends') }]">
          <span class="nav-icon">👥</span>
          <span class="nav-text">Agregar Amigos</span>
        </router-link>
        <router-link to="/battle" :class="['nav-item', { active: isActive('/battle') }]">
          <span class="nav-icon">⚔️</span>
          <span class="nav-text">Batallas</span>
        </router-link>
      </nav>
    </header>
    
    <main class="container">
      <router-view />
    </main>

    <footer class="app-footer">
      <div class="footer-content">
        <p class="muted small">© 2026 PokeMinimal - Proyecto Fullstack Vue + Express</p>
        <p class="muted small">Datos de <a href="https://pokeapi.co/" target="_blank" style="color:var(--blue)">PokeAPI</a></p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* Header Pokémon Style */
.pokemon-header{
  background: linear-gradient(135deg, #CC0000 0%, #FF0000 50%, #CC0000 100%);
  box-shadow: 0 4px 15px rgba(0,0,0,0.3);
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 4px solid #FFCB05;
}

.header-top{
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 32px;
  background: linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, transparent 100%);
}

/* Pokéball Logo */
.pokeball-logo{
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.pokeball-logo:hover{
  transform: scale(1.05);
}

.pokeball{
  width: 50px;
  height: 50px;
  background: linear-gradient(to bottom, #f44336 0%, #f44336 45%, #222 45%, #222 55%, white 55%, white 100%);
  border-radius: 50%;
  border: 3px solid #222;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 3px 10px rgba(0,0,0,0.4);
}

.pokeball-button{
  width: 16px;
  height: 16px;
  background: white;
  border-radius: 50%;
  border: 3px solid #222;
  box-shadow: inset 0 2px 5px rgba(0,0,0,0.3);
}

.brand-text{
  color: white;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
}

.brand-title{
  font-size: 24px;
  font-weight: 900;
  letter-spacing: 1px;
  color: #FFCB05;
  text-transform: uppercase;
}

.brand-subtitle{
  font-size: 12px;
  font-weight: 600;
  color: white;
  opacity: 0.9;
}

/* Trainer Card */
.user-section{
  display: flex;
  align-items: center;
  gap: 16px;
  animation: fadeInRight 0.4s ease-out;
}

@keyframes fadeInRight {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.trainer-card{
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255,255,255,0.95);
  padding: 8px 16px;
  border-radius: 25px;
  border: 3px solid #FFCB05;
  box-shadow: 0 3px 10px rgba(0,0,0,0.3);
  transition: transform 0.2s ease;
}

.trainer-card:hover{
  transform: scale(1.02);
}

.trainer-avatar{
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #3B4CCA 0%, #2A75BB 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  border: 2px solid white;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
}

.trainer-info{
  display: flex;
  flex-direction: column;
}

.trainer-name{
  font-weight: 700;
  color: #222;
  font-size: 14px;
}

.trainer-rank{
  font-size: 11px;
  color: #666;
  font-weight: 500;
}

.logout-btn{
  background: linear-gradient(135deg, #FF6B6B 0%, #EE5A52 100%);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 20px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 3px 10px rgba(0,0,0,0.3);
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  border: 2px solid rgba(255,255,255,0.3);
}

.logout-btn:hover{
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.4);
}

.logout-btn:active{
  transform: translateY(0);
}

/* Auth Buttons */
.auth-buttons-header{
  display: flex;
  gap: 12px;
}

.pokemon-btn{
  padding: 10px 24px;
  border-radius: 20px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.login-btn{
  background: white;
  color: #CC0000;
  border-color: #FFCB05;
}

.login-btn:hover{
  background: #FFCB05;
  color: #222;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.3);
}

.register-btn{
  background: #FFCB05;
  color: #222;
  border-color: white;
}

.register-btn:hover{
  background: white;
  color: #CC0000;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.3);
}

/* Navigation Menu */
.pokemon-nav{
  display: flex;
  justify-content: center;
  gap: 8px;
  padding: 8px 32px 10px 32px;
  background: linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.05) 100%);
  overflow-x: auto;
  animation: slideDown 0.3s ease-out;
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

.nav-item{
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 20px;
  background: rgba(255,255,255,0.9);
  border-radius: 15px;
  text-decoration: none;
  color: #222;
  font-weight: 600;
  font-size: 13px;
  transition: all 0.3s ease;
  border: 3px solid transparent;
  min-width: 100px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.nav-item:hover{
  background: #FFCB05;
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  border-color: white;
}

.nav-item.active{
  background: linear-gradient(135deg, #3B4CCA 0%, #2A75BB 100%);
  color: white;
  border-color: #FFCB05;
  box-shadow: 0 4px 12px rgba(0,0,0,0.4);
}

.nav-icon{
  font-size: 24px;
  filter: drop-shadow(0 2px 3px rgba(0,0,0,0.2));
}

.nav-item.active .nav-icon{
  filter: drop-shadow(0 2px 3px rgba(0,0,0,0.5));
}

.nav-text{
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-size: 11px;
}

/* Footer */
.app-footer{
  margin-top: auto;
  padding: 24px;
  background: linear-gradient(135deg, #222 0%, #111 100%);
  color: white;
  text-align: center;
  border-top: 3px solid #FFCB05;
}

.footer-content{
  max-width: 1200px;
  margin: 0 auto;
}

.footer-content p{
  margin: 4px 0;
}

/* Responsive */
@media (max-width: 968px){
  .header-top{
    flex-direction: column;
    gap: 16px;
    padding: 16px;
  }
  
  .pokemon-nav{
    flex-wrap: nowrap;
    justify-content: flex-start;
    padding: 12px 16px;
    gap: 6px;
  }
  
  .nav-item{
    min-width: 80px;
    padding: 10px 12px;
  }
  
  .nav-icon{
    font-size: 20px;
  }
  
  .nav-text{
    font-size: 10px;
  }
  
  .trainer-card{
    width: 100%;
    justify-content: center;
  }
  
  .user-section{
    width: 100%;
    flex-direction: column;
  }
  
  .logout-btn{
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 640px){
  .brand-title{
    font-size: 20px;
  }
  
  .pokeball{
    width: 40px;
    height: 40px;
  }
  
  .pokeball-button{
    width: 12px;
    height: 12px;
  }
}
</style>
