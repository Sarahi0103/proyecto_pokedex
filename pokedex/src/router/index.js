import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'

// Lazy load non-critical routes
const PokemonDetail = () => import('../views/PokemonDetail.vue')
const Favorites = () => import('../views/Favorites.vue')
const Teams = () => import('../views/Teams.vue')
const Friends = () => import('../views/Friends.vue')
const Battle = () => import('../views/Battle.vue')
const AuthCallback = () => import('../views/AuthCallback.vue')

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/pokemon/:id', name: 'PokemonDetail', component: PokemonDetail },
  { path: '/login', name: 'Login', component: Login },
  { path: '/register', name: 'Register', component: Register },
  { path: '/favorites', name: 'Favorites', component: Favorites },
  { path: '/teams', name: 'Teams', component: Teams },
  { path: '/friends', name: 'Friends', component: Friends },
  { path: '/battle', name: 'Battle', component: Battle },
  { path: '/auth/callback', name: 'AuthCallback', component: AuthCallback }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
