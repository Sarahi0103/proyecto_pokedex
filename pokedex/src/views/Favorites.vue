<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../api'

const router = useRouter()
const favorites = ref([])
const loading = ref(true)
const deleting = ref(null)

const typeColors = {
  normal: '#A8A878', fire: '#F08030', water: '#6890F0', electric: '#F8D030',
  grass: '#78C850', ice: '#98D8D8', fighting: '#C03028', poison: '#A040A0',
  ground: '#E0C068', flying: '#A890F0', psychic: '#F85888', bug: '#A8B820',
  rock: '#B8A038', ghost: '#705898', dragon: '#7038F8', dark: '#705848',
  steel: '#B8B8D0', fairy: '#EE99AC'
}

async function loadFavorites(){
  if(!localStorage.token){
    router.push('/login')
    return
  }
  
  loading.value = true
  try{
    const data = await api('/api/favorites')
    favorites.value = data.favorites || []
  }catch(e){
    console.error(e)
  }finally{
    loading.value = false
  }
}

async function removeFavorite(pokemonId){
  deleting.value = pokemonId
  try{
    await api(`/api/favorites/${pokemonId}`, { method: 'DELETE' })
    favorites.value = favorites.value.filter(f => f.id !== pokemonId)
  }catch(e){
    console.error(e)
  }finally{
    deleting.value = null
  }
}

function goToDetail(id){
  router.push(`/pokemon/${id}`)
}

function getTypeColor(type){
  return typeColors[type] || '#777'
}

onMounted(loadFavorites)
</script>

<template>
  <div class="favorites-page">
    <!-- Header estilo Pokémon -->
    <div class="favorites-header">
      <div class="header-content">
        <div class="header-title">
          <span class="heart-icon">❤️</span>
          <h1>MIS FAVORITOS</h1>
        </div>
        <p class="header-subtitle">Tus Pokémon favoritos guardados</p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="pokemon-loading">
      <div class="loading-pokeball">
        <div class="pokeball-spin">⚪</div>
      </div>
      <p class="loading-text">Cargando favoritos...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="favorites.length === 0" class="empty-favorites">
      <div class="empty-icon">💔</div>
      <h3>No tienes favoritos aún</h3>
      <p>Explora Pokémon y agrégalos a tus favoritos</p>
      <button class="explore-btn" @click="router.push('/')">
        <span>🔍</span> Explorar Pokémon
      </button>
    </div>

    <!-- Favorites Content -->
    <div v-else>
      <!-- Stats Card -->
      <div class="stats-card">
        <div class="stat-item">
          <span class="stat-icon">⭐</span>
          <div class="stat-info">
            <div class="stat-value">{{ favorites.length }}</div>
            <div class="stat-label">Pokémon Favoritos</div>
          </div>
        </div>
        <button class="refresh-btn" @click="loadFavorites">
          <span>🔄</span> Actualizar
        </button>
      </div>

      <!-- Favorites Grid -->
      <div class="favorites-grid">
        <div 
          v-for="f in favorites" 
          :key="f.id" 
          class="favorite-card"
        >
          <button 
            class="remove-btn" 
            @click.stop="removeFavorite(f.id)"
            :disabled="deleting === f.id"
            :title="'Eliminar de favoritos'"
          >
            {{ deleting === f.id ? '...' : '❌' }}
          </button>

          <div class="card-content" @click="goToDetail(f.id)">
            <div class="card-number">#{{ String(f.id).padStart(3, '0') }}</div>
            
            <div class="card-image-container">
              <div class="card-background"></div>
              <img 
                :src="f.sprite || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${f.id}.png`" 
                :alt="f.name"
                class="pokemon-image"
              />
            </div>
            
            <div class="card-info">
              <h3 class="pokemon-name">{{ f.name }}</h3>
              
              <div v-if="f.types" class="pokemon-types">
                <span 
                  v-for="type in f.types" 
                  :key="type"
                  class="type-badge"
                  :style="{background: getTypeColor(type)}"
                >
                  {{ type }}
                </span>
              </div>
            </div>

            <div class="favorite-badge">
              <span>⭐</span> FAVORITO
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.favorites-page{
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
  min-height: 100vh;
}

.favorites-page::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url('/icons/background.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  opacity: 0.3;
  z-index: 0;
  pointer-events: none;
}

.favorites-page > * {
  position: relative;
  z-index: 1;
}

/* Header estilo Pokémon */
.favorites-header{
  background: linear-gradient(135deg, #FF1744 0%, #FF5252 50%, #FF1744 100%);
  border-radius: 20px;
  padding: 32px;
  margin-bottom: 24px;
  box-shadow: 0 8px 24px rgba(255, 23, 68, 0.4);
  border: 4px solid #FFCB05;
  position: relative;
  overflow: hidden;
}

.favorites-header::before{
  content: '';
  position: absolute;
  top: -50%;
  right: -10%;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(255, 203, 5, 0.2) 0%, transparent 70%);
  border-radius: 50%;
}

.header-content{
  position: relative;
  z-index: 1;
  text-align: center;
}

.header-title{
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 8px;
}

.heart-icon{
  font-size: 36px;
  animation: heartbeat 1.5s ease-in-out infinite;
}

@keyframes heartbeat{
  0%, 100%{ transform: scale(1); }
  50%{ transform: scale(1.1); }
}

.header-title h1{
  color: #FFCB05;
  font-size: 36px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 2px;
  text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.5);
  margin: 0;
}

.header-subtitle{
  color: white;
  font-size: 16px;
  font-weight: 600;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  margin: 0;
}

/* Loading */
.pokemon-loading{
  text-align: center;
  padding: 60px 20px;
}

.loading-pokeball{
  margin-bottom: 20px;
}

.pokeball-spin{
  display: inline-block;
  font-size: 60px;
  animation: spin 1s linear infinite;
}

@keyframes spin{
  from{ transform: rotate(0deg); }
  to{ transform: rotate(360deg); }
}

.loading-text{
  font-size: 18px;
  font-weight: 600;
  color: #666;
}

/* Empty State */
.empty-favorites{
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 20px;
  border: 3px dashed #FF5252;
}

.empty-icon{
  font-size: 80px;
  margin-bottom: 16px;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse{
  0%, 100%{ opacity: 1; }
  50%{ opacity: 0.5; }
}

.empty-favorites h3{
  color: #222;
  margin-bottom: 8px;
  font-size: 24px;
}

.empty-favorites p{
  color: #666;
  margin-bottom: 24px;
}

.explore-btn{
  padding: 14px 32px;
  background: linear-gradient(135deg, #FFCB05 0%, #FFA000 100%);
  color: #222;
  border: none;
  border-radius: 25px;
  font-weight: 700;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
  box-shadow: 0 4px 12px rgba(255, 203, 5, 0.4);
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.explore-btn:hover{
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(255, 203, 5, 0.6);
}

/* Stats Card */
.stats-card{
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 32px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  border: 3px solid #FFCB05;
}

.stat-item{
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon{
  font-size: 48px;
}

.stat-value{
  font-size: 32px;
  font-weight: 900;
  color: #222;
  line-height: 1;
}

.stat-label{
  font-size: 14px;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

.refresh-btn{
  padding: 12px 24px;
  background: linear-gradient(135deg, #3B4CCA 0%, #2A75BB 100%);
  color: white;
  border: none;
  border-radius: 20px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(59, 76, 202, 0.3);
}

.refresh-btn:hover{
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(59, 76, 202, 0.5);
}

/* Grid de Favoritos */
.favorites-grid{
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 28px;
  margin-bottom: 40px;
  justify-items: center;
}

/* Tarjeta de Pokémon Favorito */
.favorite-card{
  background: white;
  border-radius: 20px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 3px solid transparent;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 280px;
}

.favorite-card::before{
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 82, 82, 0.1) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.favorite-card:hover::before{
  opacity: 1;
}

.favorite-card:hover{
  transform: translateY(-8px) scale(1.02);
  border-color: #FF5252;
  box-shadow: 0 12px 28px rgba(255, 82, 82, 0.4), 0 0 0 4px rgba(255, 82, 82, 0.2);
}

.remove-btn{
  position: absolute;
  top: 12px;
  right: 12px;
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #FF1744 0%, #D32F2F 100%);
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 10;
  box-shadow: 0 3px 10px rgba(211, 47, 47, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-btn:hover:not(:disabled){
  transform: scale(1.1) rotate(90deg);
  box-shadow: 0 4px 15px rgba(211, 47, 47, 0.6);
}

.remove-btn:disabled{
  opacity: 0.5;
  cursor: not-allowed;
}

.card-content{
  cursor: pointer;
}

.card-number{
  position: absolute;
  top: 12px;
  left: 12px;
  background: linear-gradient(135deg, #3B4CCA 0%, #2A75BB 100%);
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 12px;
  box-shadow: 0 2px 8px rgba(59, 76, 202, 0.4);
  z-index: 2;
}

.card-image-container{
  position: relative;
  height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  margin-top: 20px;
}

.card-background{
  position: absolute;
  width: 140px;
  height: 140px;
  background: radial-gradient(circle, #fff3f3 0%, transparent 70%);
  border-radius: 50%;
}

.pokemon-image{
  width: 140px;
  height: 140px;
  object-fit: contain;
  position: relative;
  z-index: 1;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.2));
  transition: transform 0.3s ease;
}

.favorite-card:hover .pokemon-image{
  transform: scale(1.1);
}

.card-info{
  text-align: center;
}

.pokemon-name{
  font-size: 18px;
  font-weight: 700;
  color: #222;
  margin: 0 0 12px 0;
  text-transform: capitalize;
  letter-spacing: 0.5px;
}

.pokemon-types{
  display: flex;
  gap: 6px;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.type-badge{
  padding: 6px 14px;
  border-radius: 12px;
  color: white;
  font-weight: 700;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.favorite-badge{
  background: linear-gradient(135deg, #FFCB05 0%, #FFA000 100%);
  color: #222;
  padding: 8px 12px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 3px 10px rgba(255, 203, 5, 0.4);
}

/* Responsive */
@media (max-width: 768px){
  .header-title h1{
    font-size: 24px;
  }
  
  .heart-icon{
    font-size: 28px;
  }
  
  .stats-card{
    flex-direction: column;
    gap: 16px;
  }
  
  .refresh-btn{
    width: 100%;
    justify-content: center;
  }
  
  .favorites-grid{
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 16px;
  }
}
</style>
