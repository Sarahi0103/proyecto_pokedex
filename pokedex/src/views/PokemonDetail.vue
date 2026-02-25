<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../api'

const route = useRoute()
const router = useRouter()
const pokemon = ref(null)
const species = ref(null)
const evolution = ref(null)
const loading = ref(true)
const addingFav = ref(false)
const message = ref('')

const typeColors = {
  normal: '#A8A878', fire: '#F08030', water: '#6890F0', electric: '#F8D030',
  grass: '#78C850', ice: '#98D8D8', fighting: '#C03028', poison: '#A040A0',
  ground: '#E0C068', flying: '#A890F0', psychic: '#F85888', bug: '#A8B820',
  rock: '#B8A038', ghost: '#705898', dragon: '#7038F8', dark: '#705848',
  steel: '#B8B8D0', fairy: '#EE99AC'
}

onMounted(async ()=>{
  try{
    const id = route.params.id
    
    // Get pokemon data
    const data = await api(`/api/pokemon/${id}`)
    pokemon.value = data
    
    // Get species data
    try{
      const speciesData = await api(`/api/pokemon-species/${id}`)
      species.value = speciesData
      
      // Get evolution chain
      if(speciesData.evolution_chain?.url){
        const evolutionId = speciesData.evolution_chain.url.split('/').slice(-2)[0]
        const evolutionData = await api(`/api/pokemon-evolution/${evolutionId}`)
        evolution.value = evolutionData
      }
    }catch(e){
      console.error('Error loading species/evolution:', e)
    }
  }catch(e){
    console.error('Error loading pokemon:', e)
  }finally{
    loading.value = false
  }
})

async function addFavorite(){
  if(!localStorage.token){
    router.push('/login')
    return
  }
  
  addingFav.value = true
  try{
    await api('/api/favorites', { 
      method: 'POST', 
      headers:{'Content-Type':'application/json'}, 
      body: JSON.stringify({ 
        pokemon: { 
          id: pokemon.value.id, 
          name: pokemon.value.name,
          sprite: pokemon.value.sprites?.other?.['official-artwork']?.front_default || pokemon.value.sprites?.front_default
        }
      }) 
    })
    message.value = '✓ Agregado a favoritos'
    setTimeout(() => message.value = '', 3000)
  }catch(e){
    message.value = '✗ Error al agregar'
  }finally{
    addingFav.value = false
  }
}

function getTypeColor(type){
  return typeColors[type] || '#777'
}

function getStatColor(value){
  if(value >= 100) return '#06d6a0'
  if(value >= 70) return '#457b9d'
  if(value >= 40) return '#ffd60a'
  return '#e63946'
}

function getEvolutionChain(chain){
  const result = []
  let current = chain
  
  while(current){
    result.push(current.species.name)
    current = current.evolves_to?.[0]
  }
  
  return result
}
</script>

<template>
  <div v-if="loading" class="loading">
    <div style="font-size:2rem">⚡</div>
    Cargando detalles del Pokémon...
  </div>

  <div v-else-if="pokemon" class="detail-container">
    <!-- Back button -->
    <button class="btn btn-outline btn-sm" @click="router.push('/')" style="margin-bottom:20px">
      ← Volver
    </button>

    <!-- Main Info Card -->
    <div class="card main-info">
      <div class="pokemon-image">
        <img 
          :src="pokemon.sprites?.other?.['official-artwork']?.front_default || pokemon.sprites?.front_default" 
          :alt="pokemon.name"
        />
      </div>
      
      <div class="pokemon-info">
        <div class="pokemon-header">
          <h1 style="text-transform:capitalize; margin-bottom:8px">
            {{ pokemon.name }}
          </h1>
          <span class="pokemon-id">#{{ String(pokemon.id).padStart(3, '0') }}</span>
        </div>

        <div class="types-container">
          <span 
            v-for="type in pokemon.types" 
            :key="type.type.name"
            class="badge badge-type"
            :style="{background: getTypeColor(type.type.name), fontSize:'1rem', padding:'8px 16px'}"
          >
            {{ type.type.name }}
          </span>
        </div>

        <div class="pokemon-measurements">
          <div class="measurement">
            <div class="muted small">Altura</div>
            <div style="font-weight:700; font-size:1.2rem">{{ (pokemon.height / 10).toFixed(1) }}m</div>
          </div>
          <div class="measurement">
            <div class="muted small">Peso</div>
            <div style="font-weight:700; font-size:1.2rem">{{ (pokemon.weight / 10).toFixed(1) }}kg</div>
          </div>
        </div>

        <div class="action-buttons">
          <button class="btn btn-accent" @click="addFavorite" :disabled="addingFav">
            {{ addingFav ? 'Agregando...' : '❤️ Agregar a Favoritos' }}
          </button>
          <div v-if="message" class="success">{{ message }}</div>
        </div>
      </div>
    </div>

    <!-- Stats Card -->
    <div class="card">
      <h2>📊 Estadísticas Base</h2>
      <div class="stats-list">
        <div v-for="s in pokemon.stats" :key="s.stat.name" class="stat-item">
          <div class="stat-header">
            <span class="stat-name">{{ s.stat.name.replace('-', ' ') }}</span>
            <span class="stat-value" :style="{color: getStatColor(s.base_stat)}">
              {{ s.base_stat }}
            </span>
          </div>
          <div class="stat-bar">
            <div 
              class="stat-fill" 
              :style="{width: Math.min(100, (s.base_stat / 255) * 100) + '%', background: getStatColor(s.base_stat)}"
            ></div>
          </div>
        </div>
      </div>
      
      <div class="total-stats">
        <strong>Total:</strong> 
        {{ pokemon.stats.reduce((sum, s) => sum + s.base_stat, 0) }}
      </div>
    </div>

    <!-- Abilities Card -->
    <div class="card">
      <h2>⚡ Habilidades</h2>
      <div class="abilities-list">
        <div 
          v-for="ability in pokemon.abilities" 
          :key="ability.ability.name"
          class="ability-badge"
        >
          <span style="text-transform:capitalize">{{ ability.ability.name.replace('-', ' ') }}</span>
          <span v-if="ability.is_hidden" class="badge" style="background:var(--warning); color:var(--black); font-size:0.7rem; margin-left:8px">
            Oculta
          </span>
        </div>
      </div>
    </div>

    <!-- Species Info Card -->
    <div v-if="species" class="card">
      <h2>📖 Información de Especie</h2>
      <div class="species-info">
        <div class="info-item">
          <strong>Género:</strong>
          <span v-if="species.gender_rate === -1">Sin género</span>
          <span v-else>
            ♂ {{ (100 - (species.gender_rate / 8) * 100).toFixed(1) }}% / 
            ♀ {{ ((species.gender_rate / 8) * 100).toFixed(1) }}%
          </span>
        </div>
        <div class="info-item">
          <strong>Ratio de captura:</strong> {{ species.capture_rate }}
        </div>
        <div class="info-item">
          <strong>Felicidad base:</strong> {{ species.base_happiness }}
        </div>
        <div class="info-item">
          <strong>Grupo huevo:</strong>
          {{ species.egg_groups?.map(g => g.name).join(', ') }}
        </div>
      </div>
    </div>

    <!-- Evolution Chain Card -->
    <div v-if="evolution" class="card">
      <h2>🔄 Cadena Evolutiva</h2>
      <div class="evolution-chain">
        <div 
          v-for="(evo, index) in getEvolutionChain(evolution.chain)" 
          :key="evo"
          class="evolution-item"
        >
          <div class="evolution-name">{{ evo }}</div>
          <div v-if="index < getEvolutionChain(evolution.chain).length - 1" class="evolution-arrow">
            →
          </div>
        </div>
      </div>
    </div>

    <!-- Moves Card (showing first 12) -->
    <div class="card">
      <h2>⚔️ Movimientos (primeros 12)</h2>
      <div class="moves-grid">
        <div 
          v-for="move in pokemon.moves.slice(0, 12)" 
          :key="move.move.name"
          class="move-badge"
        >
          {{ move.move.name.replace('-', ' ') }}
        </div>
      </div>
    </div>
  </div>

  <div v-else class="empty-state">
    <h3>Pokémon no encontrado</h3>
    <button class="btn btn-primary" @click="router.push('/')">Volver al inicio</button>
  </div>
</template>

<style scoped>
.detail-container{
  max-width:900px;
  margin:0 auto;
  position: relative;
  min-height: 100vh;
}

.detail-container::before {
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

.detail-container > * {
  position: relative;
  z-index: 1;
}

.main-info{
  display:grid;
  grid-template-columns:300px 1fr;
  gap:32px;
  align-items:start;
}

.pokemon-image{
  text-align:center;
  background:linear-gradient(135deg, var(--bg) 0%, white 100%);
  border-radius:12px;
  padding:20px;
}

.pokemon-image img{
  width:100%;
  max-width:280px;
  height:auto;
}

.pokemon-header{
  display:flex;
  align-items:center;
  gap:16px;
  margin-bottom:20px;
}

.pokemon-id{
  font-size:1.5rem;
  font-weight:700;
  color:var(--text-muted);
}

.types-container{
  display:flex;
  gap:8px;
  margin-bottom:20px;
}

.pokemon-measurements{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:16px;
  padding:20px;
  background:var(--bg);
  border-radius:8px;
  margin-bottom:20px;
}

.measurement{
  text-align:center;
}

.action-buttons{
  display:flex;
  flex-direction:column;
  gap:12px;
}

.stats-list{
  display:flex;
  flex-direction:column;
  gap:16px;
  margin-top:20px;
}

.stat-item{
  display:flex;
  flex-direction:column;
  gap:8px;
}

.stat-header{
  display:flex;
  justify-content:space-between;
  align-items:center;
}

.stat-name{
  text-transform:capitalize;
  font-weight:600;
  color:var(--black);
}

.stat-value{
  font-weight:700;
  font-size:1.1rem;
}

.total-stats{
  margin-top:20px;
  padding-top:20px;
  border-top:2px solid var(--border);
  text-align:right;
  font-size:1.2rem;
  color:var(--blue);
}

.abilities-list{
  display:flex;
  flex-wrap:wrap;
  gap:12px;
  margin-top:16px;
}

.ability-badge{
  padding:12px 20px;
  background:var(--blue-light);
  color:white;
  border-radius:8px;
  font-weight:600;
  display:flex;
  align-items:center;
}

.species-info{
  display:grid;
  grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));
  gap:16px;
  margin-top:16px;
}

.info-item{
  padding:12px;
  background:var(--bg);
  border-radius:8px;
}

.info-item strong{
  display:block;
  margin-bottom:4px;
  color:var(--blue);
}

.evolution-chain{
  display:flex;
  align-items:center;
  justify-content:center;
  gap:16px;
  margin-top:20px;
  flex-wrap:wrap;
}

.evolution-item{
  display:flex;
  align-items:center;
  gap:16px;
}

.evolution-name{
  padding:12px 24px;
  background:var(--blue);
  color:white;
  border-radius:8px;
  font-weight:700;
  text-transform:capitalize;
  font-size:1.1rem;
}

.evolution-arrow{
  font-size:2rem;
  color:var(--text-muted);
  font-weight:700;
}

.moves-grid{
  display:grid;
  grid-template-columns:repeat(auto-fill, minmax(150px, 1fr));
  gap:8px;
  margin-top:16px;
}

.move-badge{
  padding:8px 12px;
  background:var(--bg);
  border:1px solid var(--border);
  border-radius:6px;
  text-align:center;
  text-transform:capitalize;
  font-size:0.9rem;
}

@media (max-width: 768px){
  .main-info{
    grid-template-columns:1fr;
  }
  
  .pokemon-measurements{
    grid-template-columns:1fr;
  }
}</style>
