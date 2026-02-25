<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../api'

const router = useRouter()
const q = ref('')
const pokemons = ref([])
const allPokemons = ref([])
const loading = ref(false)
const selectedType = ref('')
const selectedRegion = ref('')

const regions = [
  { name: 'Todos', limit: 151, offset: 0 },
  { name: 'Kanto', limit: 151, offset: 0 },
  { name: 'Johto', limit: 100, offset: 151 },
  { name: 'Hoenn', limit: 135, offset: 251 },
  { name: 'Sinnoh', limit: 107, offset: 386 },
  { name: 'Unova', limit: 156, offset: 493 },
  { name: 'Kalos', limit: 72, offset: 649 },
  { name: 'Alola', limit: 88, offset: 721 },
  { name: 'Galar', limit: 89, offset: 809 }
]

const types = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice', 
  'fighting', 'poison', 'ground', 'flying', 'psychic', 
  'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'
]

const typeColors = {
  normal: '#A8A878', fire: '#F08030', water: '#6890F0', electric: '#F8D030',
  grass: '#78C850', ice: '#98D8D8', fighting: '#C03028', poison: '#A040A0',
  ground: '#E0C068', flying: '#A890F0', psychic: '#F85888', bug: '#A8B820',
  rock: '#B8A038', ghost: '#705898', dragon: '#7038F8', dark: '#705848',
  steel: '#B8B8D0', fairy: '#EE99AC'
}

async function load(){
  loading.value = true
  const region = regions.find(r => r.name === selectedRegion.value) || regions[0]
  
  try{
    const data = await api(`/api/pokemon?limit=${region.limit}&offset=${region.offset}`)
    const list = data.results || []
    
    // Cargar detalles en lotes para evitar sobrecarga
    const batchSize = 20
    const details = []
    for(let i = 0; i < list.length; i += batchSize){
      const batch = list.slice(i, i + batchSize)
      const batchDetails = await Promise.all(
        batch.map(r => 
          api(`/api/pokemon/${r.name}`).catch(()=>null)
        )
      )
      details.push(...batchDetails)
    }
    
    allPokemons.value = details.filter(Boolean)
    filterPokemons()
  }catch(e){
    console.error(e)
  }finally{
    loading.value = false
  }
}

function filterPokemons(){
  let filtered = [...allPokemons.value]
  
  // Filter by name
  if(q.value.trim()){
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(q.value.toLowerCase())
    )
  }
  
  // Filter by type
  if(selectedType.value){
    filtered = filtered.filter(p => 
      p.types?.some(t => t.type.name === selectedType.value)
    )
  }
  
  pokemons.value = filtered
}

function goTo(p){
  router.push(`/pokemon/${p.id}`)
}

function getTypeColor(type){
  return typeColors[type] || '#777'
}

onMounted(load)
</script>

<template>
  <div class="pokemon-explorer">
    <!-- Header con estilo Pokémon -->
    <div class="explorer-header">
      <div class="header-content">
        <div class="header-title">
          <span class="pokeball-icon">⚪</span>
          <h1>POKÉDEX NACIONAL</h1>
        </div>
        <p class="header-subtitle">¡Atrápalos a todos! Explora y colecciona</p>
      </div>
    </div>

    <!-- Panel de búsqueda y filtros -->
    <div class="search-panel">
      <div class="search-bar">
        <div class="search-input-wrapper">
          <span class="search-icon">🔍</span>
          <input 
            v-model="q" 
            class="pokemon-search-input"
            placeholder="Busca tu Pokémon favorito..." 
            @input="filterPokemons"
          />
        </div>
        <button class="search-button" @click="filterPokemons">
          Buscar
        </button>
      </div>

      <!-- Filtros de región y tipo -->
      <div class="filter-section">
        <div class="filter-card">
          <label class="filter-label">🗺️ Región</label>
          <select v-model="selectedRegion" @change="load" class="pokemon-select">
            <option value="">Todas las Regiones</option>
            <option v-for="region in regions.slice(1)" :key="region.name" :value="region.name">
              {{ region.name }}
            </option>
          </select>
        </div>

        <div class="filter-card">
          <label class="filter-label">⚡ Tipo</label>
          <select v-model="selectedType" @change="filterPokemons" class="pokemon-select">
            <option value="">Todos los Tipos</option>
            <option v-for="type in types" :key="type" :value="type">
              {{ type.toUpperCase() }}
            </option>
          </select>
        </div>

        <div class="results-badge">
          <span class="badge-icon">📊</span>
          <span class="badge-text">{{ pokemons.length }} Pokémon</span>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="pokemon-loading">
      <div class="loading-pokeball">
        <div class="pokeball-spin">⚪</div>
      </div>
      <p class="loading-text">Cargando Pokémon...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="pokemons.length === 0" class="empty-pokemon">
      <div class="empty-icon">🔍</div>
      <h3>No se encontraron Pokémon</h3>
      <p>Intenta buscar con otros filtros</p>
    </div>

    <!-- Grid de Pokémon -->
    <div v-else class="pokemon-grid">
      <div 
        v-for="p in pokemons" 
        :key="p.id" 
        class="pokemon-card" 
        @click="goTo(p)"
      >
        <div class="card-number">#{{ String(p.id).padStart(3, '0') }}</div>
        
        <div class="card-image-container">
          <div class="card-background"></div>
          <img 
            :src="p.sprites?.other?.['official-artwork']?.front_default || p.sprites?.front_default" 
            :alt="p.name"
            class="pokemon-image"
            loading="lazy"
          />
        </div>
        
        <div class="card-info">
          <h3 class="pokemon-name">{{ p.name }}</h3>
          
          <div class="pokemon-types">
            <span 
              v-for="type in p.types" 
              :key="type.type.name"
              class="type-badge"
              :style="{background: getTypeColor(type.type.name)}"
            >
              {{ type.type.name }}
            </span>
          </div>
        </div>

        <div class="card-shine"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Container principal */
.pokemon-explorer{
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
  min-height: 100vh;
}

.pokemon-explorer::before {
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

.pokemon-explorer > * {
  position: relative;
  z-index: 1;
}

/* Header estilo Pokémon */
.explorer-header{
  background: linear-gradient(135deg, #CC0000 0%, #FF0000 50%, #CC0000 100%);
  border-radius: 20px;
  padding: 32px;
  margin-bottom: 24px;
  box-shadow: 0 8px 24px rgba(204, 0, 0, 0.4);
  border: 4px solid #FFCB05;
  position: relative;
  overflow: hidden;
}

.explorer-header::before{
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

.pokeball-icon{
  font-size: 36px;
  animation: rotate 3s linear infinite;
}

@keyframes rotate{
  from{ transform: rotate(0deg); }
  to{ transform: rotate(360deg); }
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

/* Panel de búsqueda */
.search-panel{
  background: white;
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 32px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  border: 3px solid #FFCB05;
}

.search-bar{
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.search-input-wrapper{
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon{
  position: absolute;
  left: 16px;
  font-size: 20px;
  pointer-events: none;
}

.pokemon-search-input{
  width: 100%;
  padding: 14px 16px 14px 48px;
  border: 3px solid #3B4CCA;
  border-radius: 25px;
  font-size: 16px;
  font-weight: 600;
  outline: none;
  transition: all 0.3s ease;
  background: #f8f9fa;
}

.pokemon-search-input:focus{
  border-color: #FFCB05;
  background: white;
  box-shadow: 0 4px 12px rgba(255, 203, 5, 0.3);
  transform: translateY(-2px);
}

.search-button{
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
}

.search-button:hover{
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(255, 203, 5, 0.6);
}

.search-button:active{
  transform: translateY(-1px);
}

/* Filtros */
.filter-section{
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  align-items: end;
}

.filter-card{
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-label{
  font-weight: 700;
  font-size: 14px;
  color: #222;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.pokemon-select{
  padding: 12px 16px;
  border: 3px solid #3B4CCA;
  border-radius: 15px;
  font-size: 14px;
  font-weight: 600;
  background: white;
  cursor: pointer;
  outline: none;
  transition: all 0.3s ease;
}

.pokemon-select:hover{
  border-color: #FFCB05;
}

.pokemon-select:focus{
  border-color: #FFCB05;
  box-shadow: 0 4px 12px rgba(255, 203, 5, 0.3);
}

.results-badge{
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: linear-gradient(135deg, #3B4CCA 0%, #2A75BB 100%);
  color: white;
  border-radius: 15px;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(59, 76, 202, 0.3);
  justify-content: center;
}

.badge-icon{
  font-size: 20px;
}

.badge-text{
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
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
.empty-pokemon{
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 20px;
  border: 3px dashed #FFCB05;
}

.empty-icon{
  font-size: 80px;
  margin-bottom: 16px;
}

.empty-pokemon h3{
  color: #222;
  margin-bottom: 8px;
}

.empty-pokemon p{
  color: #666;
}

/* Grid de Pokémon */
.pokemon-grid{
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 28px;
  margin-bottom: 40px;
  justify-items: center;
}

/* Tarjeta de Pokémon */
.pokemon-card{
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

.pokemon-card::before{
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 203, 5, 0.1) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.pokemon-card:hover::before{
  opacity: 1;
}

.pokemon-card:hover{
  transform: translateY(-8px) scale(1.02);
  border-color: #FFCB05;
  box-shadow: 0 12px 28px rgba(255, 203, 5, 0.4), 0 0 0 4px rgba(255, 203, 5, 0.2);
}

.card-number{
  position: absolute;
  top: 12px;
  right: 12px;
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
}

.card-background{
  position: absolute;
  width: 140px;
  height: 140px;
  background: radial-gradient(circle, #f8f9fa 0%, transparent 70%);
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

.pokemon-card:hover .pokemon-image{
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

.card-shine{
  position: absolute;
  top: 0;
  left: -100%;
  width: 50%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s ease;
  pointer-events: none;
}

.pokemon-card:hover .card-shine{
  left: 100%;
}

/* Responsive */
@media (max-width: 768px){
  .header-title h1{
    font-size: 24px;
  }
  
  .pokeball-icon{
    font-size: 28px;
  }
  
  .search-bar{
    flex-direction: column;
  }
  
  .search-button{
    width: 100%;
  }
  
  .filter-section{
    grid-template-columns: 1fr;
  }
  
  .pokemon-grid{
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 16px;
  }
  
  .pokemon-card{
    padding: 16px;
  }
  
  .card-image-container{
    height: 140px;
  }
  
  .pokemon-image{
    width: 110px;
    height: 110px;
  }
}
</style>
