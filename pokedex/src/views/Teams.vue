<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../api'

const router = useRouter()
const teams = ref([])
const favorites = ref([])
const loading = ref(true)
const showCreateModal = ref(false)
const editingTeam = ref(null)
const newTeamName = ref('')
const selectedPokemons = ref([])
const searchQuery = ref('')

const typeColors = {
  normal: '#A8A878', fire: '#F08030', water: '#6890F0', electric: '#F8D030',
  grass: '#78C850', ice: '#98D8D8', fighting: '#C03028', poison: '#A040A0',
  ground: '#E0C068', flying: '#A890F0', psychic: '#F85888', bug: '#A8B820',
  rock: '#B8A038', ghost: '#705898', dragon: '#7038F8', dark: '#705848',
  steel: '#B8B8D0', fairy: '#EE99AC'
}

async function loadData(){
  if(!localStorage.token){
    router.push('/login')
    return
  }
  
  loading.value = true
  try{
    const [teamsData, favData] = await Promise.all([
      api('/api/teams'),
      api('/api/favorites')
    ])
    teams.value = teamsData.teams || []
    favorites.value = favData.favorites || []
  }catch(e){
    console.error(e)
  }finally{
    loading.value = false
  }
}

function openCreateModal(){
  editingTeam.value = null
  newTeamName.value = ''
  selectedPokemons.value = []
  showCreateModal.value = true
}

function openEditModal(team, index){
  editingTeam.value = index
  newTeamName.value = team.name || `Equipo ${index + 1}`
  selectedPokemons.value = [...(team.pokemons || [])]
  showCreateModal.value = true
}

function togglePokemon(pokemon){
  const index = selectedPokemons.value.findIndex(p => p.id === pokemon.id)
  if(index >= 0){
    selectedPokemons.value.splice(index, 1)
  } else {
    if(selectedPokemons.value.length < 6){
      selectedPokemons.value.push(pokemon)
    }
  }
}

function isPokemonSelected(pokemon){
  return selectedPokemons.value.some(p => p.id === pokemon.id)
}

async function saveTeam(){
  if(!newTeamName.value.trim()){
    alert('Por favor ingresa un nombre para el equipo')
    return
  }
  
  if(selectedPokemons.value.length === 0){
    alert('Selecciona al menos un Pokémon')
    return
  }
  
  const team = {
    name: newTeamName.value,
    pokemons: selectedPokemons.value
  }
  
  try{
    if(editingTeam.value !== null){
      await api(`/api/teams/${editingTeam.value}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ team })
      })
    } else {
      await api('/api/teams', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ team })
      })
    }
    
    showCreateModal.value = false
    await loadData()
  }catch(e){
    console.error(e)
    alert('Error al guardar equipo')
  }
}

async function deleteTeam(index){
  if(!confirm('¿Seguro que quieres eliminar este equipo?')) return
  
  try{
    await api(`/api/teams/${index}`, { method: 'DELETE' })
    await loadData()
  }catch(e){
    console.error(e)
  }
}

function getTypeColor(type){
  return typeColors[type] || '#777'
}

const filteredFavorites = computed(() => {
  if(!searchQuery.value) return favorites.value
  return favorites.value.filter(p => 
    p.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

onMounted(loadData)
</script>

<template>
  <div class="teams-page">
    <!-- Header estilo Pokémon -->
    <div class="teams-header">
      <div class="header-content">
        <div class="header-top">
          <div class="header-title">
            <span class="shield-icon">🛡️</span>
            <h1>MIS EQUIPOS</h1>
          </div>
          <button class="create-team-btn" @click="openCreateModal">
            <span>➕</span> Crear Equipo
          </button>
        </div>
        <p class="header-subtitle">Crea y administra tus equipos de Pokémon (máximo 6 por equipo)</p>
      </div>
    </div>

    <div v-if="loading" class="pokemon-loading">
      <div class="loading-pokeball">
        <div class="pokeball-spin">⚪</div>
      </div>
      <p class="loading-text">Cargando equipos...</p>
    </div>

    <div v-else-if="teams.length === 0" class="empty-teams">
      <div class="empty-icon">🎯</div>
      <h3>No tienes equipos aún</h3>
      <p>Crea tu primer equipo de Pokémon</p>
      <button class="create-btn" @click="openCreateModal">
        <span>➕</span> Crear Equipo
      </button>
    </div>

    <div v-else class="teams-grid">
      <div v-for="(team, index) in teams" :key="index" class="card team-card">
        <div class="team-header">
          <h3>{{ team.name || `Equipo ${index + 1}` }}</h3>
          <div class="team-actions">
            <button class="btn btn-outline btn-sm" @click="openEditModal(team, index)">
              ✏️ Editar
            </button>
            <button class="btn btn-danger btn-sm" @click="deleteTeam(index)">
              🗑️
            </button>
          </div>
        </div>

        <div class="team-pokemons">
          <div 
            v-for="pokemon in (team.pokemons || [])" 
            :key="pokemon.id"
            class="team-pokemon"
            @click="router.push(`/pokemon/${pokemon.id}`)"
          >
            <img 
              :src="pokemon.sprite || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`" 
              :alt="pokemon.name"
            />
            <div class="pokemon-name">{{ pokemon.name }}</div>
          </div>
        </div>

        <div class="team-footer">
          <span class="badge" style="background:var(--blue); color:white">
            {{ (team.pokemons || []).length }}/6 Pokémon
          </span>
        </div>
      </div>
    </div>

    <!-- Create/Edit Team Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="modal-content card">
        <div class="modal-header">
          <h2>{{ editingTeam !== null ? 'Editar Equipo' : 'Crear Nuevo Equipo' }}</h2>
          <button class="btn-close" @click="showCreateModal = false">✕</button>
        </div>

        <div class="form-group">
          <label>Nombre del Equipo</label>
          <input 
            v-model="newTeamName" 
            placeholder="Ej: Equipo de Fuego"
            maxlength="30"
          />
        </div>

        <div class="selected-pokemon-section">
          <h3>Pokémon Seleccionados ({{ selectedPokemons.length }}/6)</h3>
          <div class="selected-pokemon-grid">
            <div 
              v-for="pokemon in selectedPokemons" 
              :key="pokemon.id"
              class="selected-pokemon-item"
            >
              <img 
                :src="pokemon.sprite || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`" 
                :alt="pokemon.name"
              />
              <button class="remove-selected-btn" @click="togglePokemon(pokemon)">✕</button>
              <div class="small">{{ pokemon.name }}</div>
            </div>
            <div v-if="selectedPokemons.length === 0" class="empty-selection">
              <p class="muted">Selecciona Pokémon de tu lista de favoritos</p>
            </div>
          </div>
        </div>

        <div class="pokemon-selector">
          <div class="flex items-center justify-between mb-4">
            <h3>Seleccionar de Favoritos</h3>
            <input 
              v-model="searchQuery" 
              placeholder="Buscar..."
              style="width:200px"
            />
          </div>

          <div v-if="favorites.length === 0" class="empty-state" style="padding:20px">
            <p class="muted">No tienes favoritos. Agrega Pokémon a favoritos primero.</p>
            <button class="btn btn-primary btn-sm" @click="router.push('/')">
              Explorar Pokémon
            </button>
          </div>

          <div v-else class="favorites-grid">
            <div 
              v-for="pokemon in filteredFavorites" 
              :key="pokemon.id"
              class="selectable-pokemon"
              :class="{ selected: isPokemonSelected(pokemon) }"
              @click="togglePokemon(pokemon)"
            >
              <img 
                :src="pokemon.sprite || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`" 
                :alt="pokemon.name"
              />
              <div class="pokemon-name">{{ pokemon.name }}</div>
              <div v-if="isPokemonSelected(pokemon)" class="check-mark">✓</div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-outline" @click="showCreateModal = false">
            Cancelar
          </button>
          <button class="btn btn-accent" @click="saveTeam">
            {{ editingTeam !== null ? 'Guardar Cambios' : 'Crear Equipo' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.teams-page{
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
  min-height: 100vh;
}

.teams-page::before {
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

.teams-page > * {
  position: relative;
  z-index: 1;
}

/* Header estilo Pokémon */
.teams-header{
  background: linear-gradient(135deg, #3B4CCA 0%, #2A75BB 50%, #3B4CCA 100%);
  border-radius: 20px;
  padding: 32px;
  margin-bottom: 24px;
  box-shadow: 0 8px 24px rgba(59, 76, 202, 0.4);
  border: 4px solid #FFCB05;
  position: relative;
  overflow: hidden;
}

.teams-header::before{
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
}

.header-top{
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.header-title{
  display: flex;
  align-items: center;
  gap: 16px;
}

.shield-icon{
  font-size: 36px;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
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

.create-team-btn{
  padding: 12px 24px;
  background: linear-gradient(135deg, #FFCB05 0%, #FFA000 100%);
  color: #222;
  border: none;
  border-radius: 20px;
  font-weight: 700;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(255, 203, 5, 0.4);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.create-team-btn:hover{
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(255, 203, 5, 0.6);
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
.empty-teams{
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 20px;
  border: 3px dashed #3B4CCA;
}

.empty-icon{
  font-size: 80px;
  margin-bottom: 16px;
}

.empty-teams h3{
  color: #222;
  margin-bottom: 8px;
  font-size: 24px;
}

.empty-teams p{
  color: #666;
  margin-bottom: 24px;
}

.create-btn{
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

.create-btn:hover{
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(255, 203, 5, 0.6);
}

.teams-grid{
  display:grid;
  grid-template-columns:repeat(auto-fill, minmax(350px, 1fr));
  gap:24px;
}

.team-card{
  background: white;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 3px solid #FFCB05;
  transition: all 0.3s ease;
}

.team-card:hover{
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(255, 203, 5, 0.3);
}

.team-header{
  display:flex;
  justify-content:space-between;
  align-items:center;
  padding-bottom:16px;
  margin-bottom: 16px;
  border-bottom:3px solid #FFCB05;
}

.team-header h3{
  margin:0;
  color:#3B4CCA;
  font-size: 20px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.team-actions{
  display:flex;
  gap:8px;
}

.team-pokemons{
  display:grid;
  grid-template-columns:repeat(3, 1fr);
  gap:12px;
  min-height:180px;
}

.team-pokemon{
  display:flex;
  flex-direction:column;
  align-items:center;
  padding:12px;
  background:#f8f9fa;
  border-radius:15px;
  cursor:pointer;
  transition:all 0.3s ease;
  border: 2px solid transparent;
}

.team-pokemon:hover{
  transform:scale(1.05);
  background:#3B4CCA;
  color: white;
  border-color: #FFCB05;
}

.team-pokemon img{
  width:70px;
  height:70px;
  object-fit:contain;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.2));
}

.pokemon-name{
  font-size:0.9rem;
  font-weight:700;
  text-transform:capitalize;
  text-align:center;
  margin-top:8px;
  letter-spacing: 0.3px;
}

.team-footer{
  padding-top:16px;
  margin-top: 16px;
  border-top:2px solid #eee;
  display:flex;
  justify-content:center;
}

.modal-overlay{
  position:fixed;
  top:0;
  left:0;
  right:0;
  bottom:0;
  background:rgba(0,0,0,0.8);
  display:flex;
  align-items:center;
  justify-content:center;
  z-index:1000;
  padding:20px;
  overflow-y:auto;
}

.modal-content{
  max-width:900px;
  width:100%;
  max-height:90vh;
  overflow-y:auto;
  position:relative;
  background: white;
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
  border: 4px solid #FFCB05;
}

.modal-header{
  display:flex;
  justify-content:space-between;
  align-items:center;
  margin-bottom:24px;
  padding-bottom:20px;
  border-bottom:3px solid #FFCB05;
}

.modal-header h2{
  color: #3B4CCA;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 0;
}

.btn-close{
  background: #FF1744;
  border: none;
  font-size:1.5rem;
  cursor:pointer;
  color: white;
  width:40px;
  height:40px;
  display:flex;
  align-items:center;
  justify-content:center;
  border-radius:50%;
  transition: all 0.3s ease;
  box-shadow: 0 3px 10px rgba(255, 23, 68, 0.4);
}

.btn-close:hover{
  transform: scale(1.1) rotate(90deg);
  box-shadow: 0 4px 15px rgba(255, 23, 68, 0.6);
}

.selected-pokemon-section{
  margin-bottom:24px;
  padding:20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius:15px;
  border: 3px solid #FFCB05;
}

.selected-pokemon-section h3{
  color: #3B4CCA;
  font-weight: 800;
  margin-bottom: 16px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.selected-pokemon-grid{
  display:grid;
  grid-template-columns:repeat(6, 1fr);
  gap:12px;
  margin-top:12px;
  min-height:120px;
}

.selected-pokemon-item{
  position:relative;
  display:flex;
  flex-direction:column;
  align-items:center;
  padding:12px;
  background:white;
  border-radius:12px;
  border:3px solid #3B4CCA;
  box-shadow: 0 3px 10px rgba(59, 76, 202, 0.2);
}

.selected-pokemon-item img{
  width:60px;
  height:60px;
  object-fit:contain;
}

.remove-selected-btn{
  position:absolute;
  top:-8px;
  right:-8px;
  width:24px;
  height:24px;
  border-radius:50%;
  background:#FF1744;
  color:white;
  border:2px solid white;
  cursor:pointer;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:0.9rem;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(255, 23, 68, 0.4);
  transition: all 0.3s ease;
}

.remove-selected-btn:hover{
  transform: scale(1.2);
}

.empty-selection{
  grid-column:1/-1;
  display:flex;
  align-items:center;
  justify-content:center;
  padding:30px;
  color: #666;
}

.pokemon-selector{
  margin-bottom:24px;
}

.pokemon-selector h3{
  color: #3B4CCA;
  font-weight: 800;
  margin-bottom: 16px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.favorites-grid{
  display:grid;
  grid-template-columns:repeat(auto-fill, minmax(100px, 1fr));
  gap:12px;
  max-height:350px;
  overflow-y:auto;
  padding:16px;
  background:#f8f9fa;
  border-radius:12px;
  border: 2px solid #eee;
}

.selectable-pokemon{
  position:relative;
  display:flex;
  flex-direction:column;
  align-items:center;
  padding:12px;
  background:white;
  border-radius:12px;
  border:3px solid #eee;
  cursor:pointer;
  transition:all 0.3s ease;
}

.selectable-pokemon:hover{
  border-color:#FFCB05;
  transform:translateY(-3px);
  box-shadow: 0 4px 12px rgba(255, 203, 5, 0.3);
}

.selectable-pokemon.selected{
  border-color:#3B4CCA;
  background: linear-gradient(135deg, #3B4CCA 0%, #2A75BB 100%);
  color:white;
  box-shadow: 0 4px 12px rgba(59, 76, 202, 0.4);
}

.selectable-pokemon img{
  width:70px;
  height:70px;
  object-fit:contain;
}

.check-mark{
  position:absolute;
  top:6px;
  right:6px;
  width:28px;
  height:28px;
  background:#06d6a0;
  color:white;
  border-radius:50%;
  display:flex;
  align-items:center;
  justify-content:center;
  font-weight:700;
  box-shadow: 0 2px 8px rgba(6, 214, 160, 0.4);
}

.modal-footer{
  display:flex;
  justify-content:flex-end;
  gap:12px;
  padding-top:24px;
  margin-top: 24px;
  border-top:3px solid #FFCB05;
}

@media (max-width: 968px){
  .header-top{
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .create-team-btn{
    width: 100%;
    justify-content: center;
  }
  
  .teams-grid{
    grid-template-columns:1fr;
  }
  
  .selected-pokemon-grid{
    grid-template-columns:repeat(3, 1fr);
  }
}

@media (max-width: 640px){
  .header-title h1{
    font-size: 24px;
  }
  
  .shield-icon{
    font-size: 28px;
  }
}
</style>
