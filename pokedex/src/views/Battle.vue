<script setup>
import { ref, onMounted, computed, onUnmounted, defineAsyncComponent, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { io } from 'socket.io-client'
import { api, currentUser } from '../api'
const BattleArena = defineAsyncComponent(() => import('../components/BattleArena.vue'))
const HealthBar = defineAsyncComponent(() => import('../components/HealthBar.vue'))

const router = useRouter()
const route = useRoute()

// Socket.io
const socket = ref(null)
const socketConnected = ref(false)

// Estados
const myTeams = ref([])
const friends = ref([])
const selectedTeam = ref(null)
const selectedFriend = ref(null)
const challengeTeamSelections = ref({})
const loading = ref(false)
const challenges = ref([])
const activeBattle = ref(null)
const battleResult = ref(null)
const battleLog = ref([])
const battling = ref(false)
const pollingInterval = ref(null)
const previousChallengesCount = ref(0)
const notifications = ref([])
const notificationSound = ref(null)
const showBattleAnimation = ref(false)
const currentBattleLog = ref([])
const currentTurn = ref(0)
const currentActivePokemon1 = ref(null)
const currentActivePokemon2 = ref(null)
const previousAcceptedBattles = ref([])
const seenCompletedBattles = ref(new Set())
const seenActiveBattles = ref(new Set())
const autoStartedBattles = ref(new Set())
const activeBattlePolling = ref(false)
const battleAnimationInterval = ref(null)
let serviceWorkerMessageHandler = null
const highlightedIncomingChallengeId = ref(null)

// Estados de batalla en tiempo real
const realtimeBattle = ref(null)
const isInRealtimeBattle = ref(false)
const waitingForOpponent = ref(false)
const selectedMove = ref(null)
const availableMoves = ref([])
const isPlayerTurn = ref(false)
const turnResult = ref(null)

// Computed properties
const getHPPercentage = (pokemon) => {
  if (!pokemon || !pokemon.currentHP || !pokemon.maxHP) return 0
  return Math.max(0, Math.min(100, (pokemon.currentHP / pokemon.maxHP) * 100))
}

const buildPokemonMap = (logs) => {
  const map = new Map()
  logs.forEach((log) => {
    if (log.attacker && typeof log.attacker === 'object') {
      map.set(log.attacker.name, log.attacker)
    }
    if (log.defender && typeof log.defender === 'object') {
      map.set(log.defender.name, log.defender)
    }
  })
  return map
}

const resolvePokemon = (value, map) => {
  if (!value) return null
  if (typeof value === 'object') return value
  if (typeof value === 'string') return map.get(value) || null
  return null
}

const updateActivePokemon = (logs) => {
  // Buscar los últimos Pokémon activos en el log
  for (let i = logs.length - 1; i >= 0; i--) {
    const log = logs[i]
    if (log.attacker && !currentActivePokemon1.value) {
      currentActivePokemon1.value = log.attacker
    }
    if (log.defender && !currentActivePokemon2.value) {
      currentActivePokemon2.value = log.defender
    }
    if (currentActivePokemon1.value && currentActivePokemon2.value) {
      break
    }
  }
}


onMounted(async () => {
  if(!localStorage.token){
    router.push('/login')
    return
  }
  
  // Limpiar estado de batalla al montar
  showBattleAnimation.value = false
  currentBattleLog.value = []
  battleResult.value = null
  seenActiveBattles.value.clear()
  seenCompletedBattles.value.clear()
  autoStartedBattles.value.clear()
  
  // Inicializar Socket.io
  initializeSocket()

  if ('serviceWorker' in navigator) {
    serviceWorkerMessageHandler = async (event) => {
      const messageType = event.data?.type

      if (messageType === 'NOTIFICATION_CLICK') {
        const { battleId, action } = parseBattleRouteFromUrl(event.data?.url || '')
        if (battleId) {
          if (route.path !== '/battle') {
            await router.push({ path: '/battle', query: { id: String(battleId), action } })
          }
          await handleBattleDeepLink(battleId, action)
        }
        return
      }

      const notificationType = event.data?.notificationType || event.data?.data?.type

      if (!messageType || !notificationType) {
        return
      }

      const isBattlePush = notificationType === 'battle-challenge' || notificationType === 'battle-accepted'
      if (!isBattlePush) {
        return
      }

      console.log('🔔 Mensaje del Service Worker para batalla:', event.data)
      await loadChallenges()

      if (notificationType === 'battle-challenge') {
        playNotificationSound()
      }
    }

    navigator.serviceWorker.addEventListener('message', serviceWorkerMessageHandler)
  }
  
  await loadInitialData()
  await loadChallenges()

  if (route.query.id) {
    await handleBattleDeepLink(route.query.id, route.query.action || 'view')
  }
  
  const userInfo = getCurrentUserInfo()
  previousChallengesCount.value = challenges.value.filter(c => {
    if (c.status !== 'pending') return false
    return isCurrentUserOpponent(c, userInfo)
  }).length
  
  // console.log('🔢 Initial challenges count:', previousChallengesCount.value)
  
  // Polling más frecuente para detectar desafíos rápido
  pollingInterval.value = setInterval(async () => {
    const userInfo = getCurrentUserInfo()
    const oldCount = previousChallengesCount.value
    await loadChallenges()
    const newCount = challenges.value.filter(c => {
      if (c.status !== 'pending') return false
      return isCurrentUserOpponent(c, userInfo)
    }).length
    
    // Si hay nuevos desafíos, mostrar notificación
    if (newCount > oldCount) {
      const newChallenges = challenges.value.filter(c => {
        if (c.status !== 'pending') return false
        return isCurrentUserOpponent(c, userInfo)
      })
      // console.log('🎮 ¡Nuevo desafío detectado!', newChallenges[0])
      showNotification(`⚔️ ¡Nuevo desafío de batalla!`, `${newChallenges[0].challenger_name} te ha desafiado`)
      playNotificationSound()
    }
    previousChallengesCount.value = newCount
    
    // Detectar batallas activas
    await detectActiveBattles()
    
    // Cerrar overlay de batalla si está abierto y no hay batallas en progreso
    if (showBattleAnimation.value && challenges.value.length === 0) {
      // console.log('🚫 Cerrando overlay de batalla - no hay batallas activas')
      showBattleAnimation.value = false
      currentBattleLog.value = []
      battleResult.value = null
    }
  }, 1000) // Cada 1 segundo para detección más rápida
  
  // Solicitar permiso de notificaciones
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission()
  }
})

// ============================================
// SOCKET.IO - BATALLAS EN TIEMPO REAL
// ============================================

function initializeSocket() {
  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'
  socket.value = io(API_BASE, {
    transports: ['websocket', 'polling'],
    reconnection: true
  })
  
  socket.value.on('connect', () => {
    // console.log('🔌 Conectado al servidor de batallas')
    socketConnected.value = true
    
    // Registrar usuario para recibir notificaciones
    const user = currentUser()
    if (user && user.id) {
      socket.value.emit('register-user', {
        userId: user.id,
        userEmail: user.email
      })
      // console.log('👤 Usuario registrado en socket:', user.email)
    }
  })
  
  socket.value.on('registered', (data) => {
    // console.log('✅ Usuario registrado correctamente en el servidor')
  })
  
  socket.value.on('disconnect', () => {
    // console.log('❌ Desconectado del servidor')
    socketConnected.value = false
  })
  
  // Notificación de nuevo desafío
  socket.value.on('new-challenge', async (data) => {
    console.log('⚔️ ¡Nuevo desafío recibido!', data)
    showNotification('⚔️ Nuevo Desafío', data.message)
    playNotificationSound()
    
    // Recargar desafíos para mostrar el nuevo
    await loadChallenges()
  })
  
  // Notificación de desafío aceptado
  socket.value.on('challenge-accepted', async (data) => {
    console.log('✅ Desafío aceptado:', data)
    showNotification('✅ Desafío Aceptado', data.message)
    playNotificationSound()
    
    // Recargar desafíos
    await loadChallenges()
  })
  
  // Notificación de desafío rechazado
  socket.value.on('challenge-rejected', async (data) => {
    console.log('❌ Desafío rechazado:', data)
    showNotification('❌ Desafío Rechazado', data.message)
    
    // Recargar desafíos
    await loadChallenges()
  })
  
  socket.value.on('battle-state', (state) => {
    // console.log('📡 Estado de batalla recibido:', state)
    realtimeBattle.value = state
    isInRealtimeBattle.value = true
    
    // Cargar movimientos del Pokémon actual
    if (state.isPlayer1) {
      const currentPokemon = state.currentPokemon1
      availableMoves.value = currentPokemon?.moves || []
    } else {
      const currentPokemon = state.currentPokemon2
      availableMoves.value = currentPokemon?.moves || []
    }
  })
  
  socket.value.on('player-joined', (data) => {
    showNotification('👤 Jugador conectado', 'El oponente se ha unido a la batalla')
  })
  
  socket.value.on('action-received', (data) => {
    waitingForOpponent.value = data.player !== (realtimeBattle.value?.isPlayer1 ? 1 : 2)
    if (data.player === (realtimeBattle.value?.isPlayer1 ? 1 : 2)) {
      showNotification('✅ Movimiento enviado', 'Esperando al oponente...')
    } else {
      showNotification('⚔️ Oponente listo', 'El oponente ha elegido su movimiento')
    }
  })
  
  socket.value.on('turn-result', (data) => {
    // console.log('📊 Resultado del turno:', data)
    turnResult.value = data
    
    // Actualizar Pokémon activos
    currentActivePokemon1.value = data.currentPokemon1
    currentActivePokemon2.value = data.currentPokemon2
    
    // Animar resultados
    if (data.results && data.results.length > 0) {
      animateTurnResults(data.results)
    }
    
    // Verificar si terminó
    if (data.ended) {
      setTimeout(() => {
        showBattleEndNotification({
          winner: data.winnerName
        })
        isInRealtimeBattle.value = false
        leaveRealtimeBattle()
      }, 3000)
    } else {
      // Resetear para el siguiente turno
      selectedMove.value = null
      waitingForOpponent.value = false
      isPlayerTurn.value = true
    }
  })
  
  socket.value.on('battle-end', (data) => {
    showNotification('🏆 Batalla finalizada', `${data.winnerName} ha ganado!`)
  })
  
  socket.value.on('player-disconnected', () => {
    showNotification('⚠️ Jugador desconectado', 'El oponente se ha desconectado')
    isInRealtimeBattle.value = false
  })
  
  socket.value.on('error', (error) => {
    console.error('❌ Error del socket:', error)
    showNotification('❌ Error', error.message)
  })
}

function joinRealtimeBattle(battleId) {
  if (!socket.value) {
    console.error('Socket no inicializado')
    return
  }
  
  const userId = getUserIdFromToken()
  // console.log('🎮 Uniéndose a batalla en tiempo real:', battleId)
  
  socket.value.emit('join-battle', { battleId, userId })
  isInRealtimeBattle.value = true
  showBattleAnimation.value = true
  isPlayerTurn.value = true
}

function selectMove(move) {
  if (!isPlayerTurn.value || waitingForOpponent.value) return
  
  selectedMove.value = move
  // console.log('⚡ Movimiento seleccionado:', move.name)
}

function submitMove() {
  if (!selectedMove.value || !realtimeBattle.value) return
  
  const action = {
    type: 'attack',
    move: selectedMove.value
  }
  
  // console.log('📤 Enviando acción:', action)
  socket.value.emit('player-action', {
    battleId: realtimeBattle.value.battleId,
    action
  })
  
  isPlayerTurn.value = false
  waitingForOpponent.value = true
}

function leaveRealtimeBattle() {
  if (socket.value) {
    socket.value.disconnect()
    socket.value = null
  }
  isInRealtimeBattle.value = false
  showBattleAnimation.value = false
  realtimeBattle.value = null
}

function animateTurnResults(results) {
  results.forEach((result, index) => {
    setTimeout(() => {
      if (result.type === 'faint') {
        showNotification('💫 Pokémon debilitado', `${result.pokemon} se ha debilitado!`)
        playFaintSound()
      } else {
        const message = result.critical ? 
          `¡Golpe crítico! ${result.attacker} infligió ${result.damage} de daño` :
          `${result.attacker} infligió ${result.damage} de daño`
        
        showNotification('⚔️ Ataque', message)
        playAttackSound()
      }
    }, index * 1000)
  })
}

function getCurrentUserInfo() {
  try {
    const user = currentUser()
    if (user && user.email) {
      return { id: user.id || null, email: user.email }
    }
  } catch (e) {
    // Fallback to token parsing below
  }

  try {
    const token = localStorage.getItem('token')
    if (!token) return { id: null, email: null }
    const payload = JSON.parse(atob(token.split('.')[1]))
    return {
      id: payload.id || payload.userId || payload.user_id || payload.sub || null,
      email: payload.email || null
    }
  } catch (e) {
    return { id: null, email: null }
  }
}

function getUserIdFromToken() {
  return getCurrentUserInfo().id
}

function normalizeId(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function normalizeEmail(value) {
  if (!value || typeof value !== 'string') return null
  const email = value.trim().toLowerCase()
  return email || null
}

function asBoolean(value) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value === 1
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    return normalized === 'true' || normalized === 't' || normalized === '1'
  }
  return false
}

function isCurrentUserOpponent(challenge, userInfo) {
  if (challenge && challenge.is_opponent !== undefined && challenge.is_opponent !== null) {
    return asBoolean(challenge.is_opponent)
  }

  const userId = normalizeId(userInfo.id)
  if (userId !== null) {
    const opponentUserId = normalizeId(challenge.opponent_user_id)
    const opponentId = normalizeId(challenge.opponent_id)
    return opponentUserId === userId || opponentId === userId
  }
  return normalizeEmail(challenge.opponent_email) === normalizeEmail(userInfo.email)
}

function isCurrentUserChallenger(challenge, userInfo) {
  if (challenge && challenge.is_challenger !== undefined && challenge.is_challenger !== null) {
    return asBoolean(challenge.is_challenger)
  }

  const userId = normalizeId(userInfo.id)
  if (userId !== null) {
    const challengerUserId = normalizeId(challenge.challenger_user_id)
    const challengerId = normalizeId(challenge.challenger_id)
    return challengerUserId === userId || challengerId === userId
  }
  return normalizeEmail(challenge.challenger_email) === normalizeEmail(userInfo.email)
}

function isCurrentUserParticipant(challenge, userInfo) {
  return isCurrentUserOpponent(challenge, userInfo) || isCurrentUserChallenger(challenge, userInfo)
}

function parseBattleRouteFromUrl(url) {
  try {
    const parsedUrl = new URL(url, window.location.origin)
    const battleId = parsedUrl.searchParams.get('id')
    const action = parsedUrl.searchParams.get('action') || 'view'
    return { battleId, action }
  } catch (e) {
    return { battleId: null, action: 'view' }
  }
}

async function handleBattleDeepLink(battleId, action = 'view') {
  const normalizedBattleId = normalizeId(battleId)
  if (normalizedBattleId === null) return

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))
  const userInfo = getCurrentUserInfo()
  let targetChallenge = null

  // Reintentos: evita falsos negativos cuando llegas desde notificación y la API tarda en reflejar el reto
  for (let attempt = 0; attempt < 8; attempt++) {
    await loadChallenges()
    // La API /api/battles/challenges ya devuelve solo batallas del usuario autenticado
    targetChallenge = challenges.value.find(c => normalizeId(c.id) === normalizedBattleId)

    if (targetChallenge) break
    await sleep(700)
  }

  if (!targetChallenge) {
    targetChallenge = await hydrateChallengeFromBattleId(normalizedBattleId)
  }

  // Si venimos desde acción aceptar y no llegó por id, mostrar cualquier reto pendiente mío en interfaz
  if (!targetChallenge && action === 'accept') {
    const fallbackPending = challenges.value.find(c => c.status === 'pending' && isCurrentUserOpponent(c, userInfo))
    if (fallbackPending) {
      highlightedIncomingChallengeId.value = fallbackPending.id
      showNotification('✅ Desafío recibido', 'Ya aparece en la interfaz. Selecciona tu equipo y presiona "Aceptar" o "Eliminar"')
      return
    }

    // No mostrar error duro en este caso; solo aviso suave
    showNotification('⏳ Sincronizando desafío', 'Aún no aparece el reto en la lista. Espera unos segundos y vuelve a abrir notificación')
    return
  }

  // Si viene de acción aceptar, evitar mensaje de "no disponible" cuando todavía sincroniza
  if (!targetChallenge && action === 'accept') {
    return
  }

  if (!targetChallenge) {
    showNotification('⚠️ Batalla no disponible', 'No se encontró ese desafío o ya no está activo')
    return
  }

  if (targetChallenge.status === 'pending') {
    if (isCurrentUserOpponent(targetChallenge, userInfo)) {
      highlightedIncomingChallengeId.value = targetChallenge.id
      showNotification('✅ Desafío recibido', 'Selecciona tu equipo y presiona "Aceptar" o "Rechazar"')
      return
    }

    if (isCurrentUserChallenger(targetChallenge, userInfo)) {
      showNotification('📤 Desafío enviado', 'Tu rival aún no responde. Espera aceptación o rechazo.')
      return
    }
  }

  if (action === 'accept' && targetChallenge.status === 'pending' && isCurrentUserChallenger(targetChallenge, userInfo)) {
    showNotification('📤 Desafío enviado', 'Este reto lo enviaste tú. Espera a que tu rival lo acepte')
    return
  }

  if (action === 'accept' && targetChallenge.status === 'pending' && isCurrentUserOpponent(targetChallenge, userInfo)) {
    highlightedIncomingChallengeId.value = targetChallenge.id
    showNotification('✅ Desafío recibido', 'Ya aparece en la interfaz. Selecciona tu equipo y presiona "Aceptar" o "Eliminar"')
    return
  }

  if (targetChallenge.status === 'accepted' || targetChallenge.status === 'in_progress' || targetChallenge.status === 'completed') {
    await loadBattle(targetChallenge.id)
  }
}


function showNotification(title, body) {
  // Notificación del navegador
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body: body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-96.png',
      tag: 'battle-challenge'
    })
  }
  
  // Notificación en la app
  const id = Date.now()
  notifications.value.push({ id, title, body })
  
  // Auto-remover después de 5 segundos
  setTimeout(() => {
    notifications.value = notifications.value.filter(n => n.id !== id)
  }, 5000)
}

function playNotificationSound() {
  try {
    // Crear un sonido de notificación usando Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.value = 800
    oscillator.type = 'sine'
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
    
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.5)
  } catch (e) {
    console.log('No se pudo reproducir sonido')
  }
}

function removeNotification(id) {
  notifications.value = notifications.value.filter(n => n.id !== id)
}

onUnmounted(() => {
  if (pollingInterval.value) {
    clearInterval(pollingInterval.value)
  }
  // Limpiar cualquier polling frecuente activo
  activeBattlePolling.value = false
  
  // Desconectar Socket.io
  if (socket.value) {
    socket.value.disconnect()
  }

  if (serviceWorkerMessageHandler && 'serviceWorker' in navigator) {
    navigator.serviceWorker.removeEventListener('message', serviceWorkerMessageHandler)
  }
})

async function loadInitialData() {
  loading.value = true
  try{
    const [teamsData, friendsData] = await Promise.all([
      api('/api/teams'),
      api('/api/friends')
    ])
    myTeams.value = teamsData.teams || []
    friends.value = friendsData.friends || []
    
    const friendCode = route.query.friend
    if(friendCode){
      const friend = friends.value.find(f => f.code === friendCode)
      if(friend) selectedFriend.value = friend
    }
  }catch(e){
    console.error(e)
  }finally{
    loading.value = false
  }
}

function upsertChallenge(challenge) {
  if (!challenge || challenge.id === undefined || challenge.id === null) return
  const existingIndex = challenges.value.findIndex(c => normalizeId(c.id) === normalizeId(challenge.id))
  if (existingIndex >= 0) {
    challenges.value[existingIndex] = {
      ...challenges.value[existingIndex],
      ...challenge
    }
  } else {
    challenges.value.unshift(challenge)
  }
}

async function hydrateChallengeFromBattleId(battleId) {
  const normalizedBattleId = normalizeId(battleId)
  if (normalizedBattleId === null) return null

  try {
    const data = await api(`/api/battles/${normalizedBattleId}`)
    const battle = data?.battle
    if (!battle) return null

    const hydrated = {
      ...battle,
      id: battle.id,
      challenger_user_id: battle.challenger_user_id ?? battle.challenger_id,
      opponent_user_id: battle.opponent_user_id ?? battle.opponent_id,
      challenger_name: battle.challenger_name,
      opponent_name: battle.opponent_name,
      challenger_email: battle.challenger_email || null,
      opponent_email: battle.opponent_email || null,
      is_challenger: !!data?.isChallenger,
      is_opponent: !data?.isChallenger
    }

    upsertChallenge(hydrated)
    return hydrated
  } catch (e) {
    // Si no pertenece al usuario o no existe, seguimos sin bloquear la UI
    return null
  }
}

async function loadChallenges() {
  try {
    const data = await api('/api/battles/challenges')
    challenges.value = data.challenges || []

    const routeBattleId = normalizeId(route.query.id)
    if (routeBattleId !== null) {
      const hasRouteBattle = challenges.value.some(c => normalizeId(c.id) === routeBattleId)
      if (!hasRouteBattle) {
        await hydrateChallengeFromBattleId(routeBattleId)
      }
    }
    
    const userInfo = getCurrentUserInfo()
    // Logs comentados para evitar spam en consola
    // console.log('📋 Challenges cargados:', challenges.value.length)
    
    const pendingForUser = challenges.value.filter(c => c.status === 'pending' && isCurrentUserOpponent(c, userInfo))
    
  } catch (e) {
    console.error('Error loading challenges:', e)
  }
}

async function sendChallenge() {
  if (selectedTeam.value === null) {
    showNotification('⚠️ Equipo requerido', 'Por favor selecciona un equipo')
    return
  }
  
  if (!selectedFriend.value) {
    showNotification('⚠️ Rival requerido', 'Por favor selecciona un amigo para desafiar')
    return
  }
  
  console.log('📤 Enviando desafío:')
  console.log('  - Amigo seleccionado:', selectedFriend.value.name, '| Código:', selectedFriend.value.code)
  console.log('  - Equipo seleccionado:', selectedTeam.value)
  
  try {
    const response = await api('/api/battles/challenge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        opponentCode: selectedFriend.value.code,
        teamIndex: selectedTeam.value
      })
    })
    
    console.log('✅ Respuesta del servidor:', response)

    if (response?.action === 'incoming_pending' && response?.battle?.id) {
      highlightedIncomingChallengeId.value = response.battle.id
      await hydrateChallengeFromBattleId(response.battle.id)
    }

    if (response?.action === 'pending_already_sent' && response?.battle?.id) {
      await hydrateChallengeFromBattleId(response.battle.id)
    }

    if (response?.action === 'incoming_pending') {
      await loadChallenges()
      showNotification('⚔️ Desafío pendiente detectado', response?.message || 'Ya tienes un desafío recibido. Debes aceptarlo o rechazarlo primero.')
      return
    }
    
    const challengeMessage = response?.message || `Esperando respuesta de ${selectedFriend.value.name}`
    showNotification('⚔️ Estado del desafío', challengeMessage)
    selectedTeam.value = null
    selectedFriend.value = null
    await loadChallenges()
  } catch (e) {
    console.error('❌ Error enviando desafío:', e)
    showNotification('❌ Error', e.message || 'No se pudo enviar el desafío')
  }
}

async function acceptChallenge(challenge) {
  const teamIndex = challengeTeamSelections.value[challenge.id]

  if (teamIndex === null || teamIndex === undefined || teamIndex === '') {
    showNotification('⚠️ Equipo requerido', 'Por favor selecciona un equipo para aceptar el desafío')
    return
  }
  
  console.log(`✅ Aceptando desafío ${challenge.id} con equipo index:`, teamIndex)
  
  try {
    // Aceptar el desafío
    const response = await api(`/api/battles/${challenge.id}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamIndex: Number(teamIndex) })
    })
    
    console.log('✅ Desafío aceptado:', response)
    
    // Mantener la batalla visible localmente para evitar UI vacía si la recarga tarda
    challenges.value = challenges.value.map(c => {
      if (c.id === challenge.id) {
        return {
          ...c,
          status: 'accepted',
          opponent_team_index: Number(teamIndex)
        }
      }
      return c
    })
    
    showNotification('✅ Desafío aceptado', 'La batalla aparecerá en "Batallas Listas". Haz clic en "Ejecutar Batalla" cuando estés listo.')
    playNotificationSound()
    
    delete challengeTeamSelections.value[challenge.id]

    if (route.query.id && normalizeId(route.query.id) === normalizeId(challenge.id)) {
      router.replace('/battle')
    }
    
    // Recargar desafíos para mostrar la batalla en "Batallas Listas"
    await loadChallenges()
    await loadBattle(challenge.id)
  } catch (e) {
    console.error('❌ Error aceptando desafío:', e)
    showNotification('❌ Error', e.message || 'No se pudo aceptar el desafío')
  }
}

async function rejectChallenge(challenge) {
  if (!confirm('¿Rechazar este desafío?')) return
  
  try {
    await api(`/api/battles/${challenge.id}/reject`, {
      method: 'POST'
    })
    
    // Remover de la lista inmediatamente
    challenges.value = challenges.value.filter(c => c.id !== challenge.id)
    delete challengeTeamSelections.value[challenge.id]

    if (route.query.id && normalizeId(route.query.id) === normalizeId(challenge.id)) {
      router.replace('/battle')
    }
    
    showNotification('❌ Desafío rechazado', `Rechazaste el desafío de ${challenge.challenger_name}`)
    
    await loadChallenges()
  } catch (e) {
    console.error(e)
    showNotification('❌ Error', e.message || 'No se pudo rechazar el desafío')
  }
}

async function cancelChallenge(challenge) {
  if (!confirm('¿Cancelar este desafío enviado?')) return
  
  try {
    await api(`/api/battles/${challenge.id}/cancel`, {
      method: 'POST'
    })
    
    challenges.value = challenges.value.filter(c => c.id !== challenge.id)
    showNotification('🗑️ Desafío cancelado', `Cancelaste el desafío a ${challenge.opponent_name}`)
    
    await loadChallenges()
  } catch (e) {
    console.error(e)
    showNotification('❌ Error', e.message || 'No se pudo cancelar el desafío')
  }
}

async function loadBattle(battleId) {
  try {
    // console.log(`🔍 Cargando batalla ${battleId}...`)
    const data = await api(`/api/battles/${battleId}`)
    // console.log('📦 Datos de batalla recibidos:', data)
    // console.log('  - Challenger Team:', data.challengerTeam)
    // console.log('  - Opponent Team:', data.opponentTeam)
    
    if (!data.challengerTeam || !data.challengerTeam.pokemons) {
      console.warn('⚠️ Equipo del retador no tiene pokémons')
    }
    if (!data.opponentTeam || !data.opponentTeam.pokemons) {
      console.warn('⚠️ Equipo del oponente no tiene pokémons')
    }
    
    activeBattle.value = data
  } catch (e) {
    console.error('❌ Error cargando batalla:', e)
    showNotification('❌ Error', 'No se pudo cargar la batalla')
  }
}

// Polling más frecuente para batallas activas
function startActiveBattlePolling() {
  if (activeBattlePolling.value) return
  
  activeBattlePolling.value = true
  // console.log('⚡ Iniciando polling frecuente cada 2 segundos')
  
  const frequentInterval = setInterval(async () => {
    await loadChallenges()
    await detectCompletedBattles()
    
    const userEmail = getUserEmailFromToken()
    const myActiveBattles = challenges.value.filter(c => 
      (c.challenger_email === userEmail || c.opponent_email === userEmail) &&
      (c.status === 'accepted' || c.status === 'in_progress')
    )
    
    // Si no hay batallas activas, detener polling frecuente
    if (myActiveBattles.length === 0) {
      // console.log('⏹️ Deteniendo polling frecuente')
      clearInterval(frequentInterval)
      activeBattlePolling.value = false
    }
  }, 2000) // Cada 2 segundos
}

// Detectar batallas activas y mostrar overlay mientras se espera el resultado
async function detectActiveBattles() {
  const userInfo = getCurrentUserInfo()
  const activeBattles = challenges.value.filter(c => 
    c.status === 'accepted' &&
    isCurrentUserParticipant(c, userInfo)
  )
  
  // Notificar y abrir automáticamente la primera batalla aceptada nueva
  for (const battle of activeBattles) {
    if (!seenActiveBattles.value.has(battle.id)) {
      seenActiveBattles.value.add(battle.id)
      const opponentName = isCurrentUserChallenger(battle, userInfo) ? battle.opponent_name : battle.challenger_name
      showNotification('⚔️ Batalla Lista', `Tu batalla contra ${opponentName} está lista. Iniciando interfaz...`)
      playNotificationSound()

      if (!autoStartedBattles.value.has(battle.id) && !battling.value) {
        autoStartedBattles.value.add(battle.id)
        await loadBattle(battle.id)
        await executeBattle(battle.id)
      }

      break
    }
  }
}

function showBattleLoadingOverlay(battleId) {
  showBattleAnimation.value = true
  currentBattleLog.value = []
  currentTurn.value = 0
  currentActivePokemon1.value = null
  currentActivePokemon2.value = null
  battleResult.value = null
  console.log('⏳ Mostrando overlay de batalla en espera:', battleId)
}

// Detectar batallas completadas - DESHABILITADO
// Las batallas completadas ya no se cargan en challenges.value
async function detectCompletedBattles() {
  // Esta función ya no es necesaria porque filtramos las batallas completadas
  // al cargar los challenges
  return
}

// Nueva función para mostrar animación de batalla sin ejecutarla
async function displayBattleAnimation(battleId) {
  try {
    // console.log('🎬 Cargando animación de batalla:', battleId)
    
    const result = await api(`/api/battles/${battleId}/result`)
    
    if (result.status !== 'completed' || !result.battle_result) {
      console.log('❌ Batalla no completada aún')
      return
    }
    
    // Preparar animación
    showBattleAnimation.value = true
    currentBattleLog.value = []
    currentTurn.value = 0
    currentActivePokemon1.value = null
    currentActivePokemon2.value = null
    battleResult.value = {
      battle_result: result.battle_result,
      winner_id: result.winner_id
    }
    
    const logs = result.battle_result.battle_log || []
    const pokemonMap = buildPokemonMap(logs)
    // console.log('📜 Logs para animación:', logs.length)
    
    // Inicializar Pokémon activos
    const firstAttackLog = logs.find(log => log.type === 'attack' && log.attacker && log.defender)
    if (firstAttackLog) {
      currentActivePokemon1.value = resolvePokemon(firstAttackLog.attacker, pokemonMap)
      currentActivePokemon2.value = resolvePokemon(firstAttackLog.defender, pokemonMap)
    }
    
    // Animar batalla
    for (let i = 0; i < logs.length; i++) {
      currentBattleLog.value.push(logs[i])
      currentTurn.value = i + 1
      
      const attacker = resolvePokemon(logs[i].attacker, pokemonMap)
      const defender = resolvePokemon(logs[i].defender, pokemonMap)
      if (attacker) currentActivePokemon1.value = attacker
      if (defender) currentActivePokemon2.value = defender
      
      if (logs[i].type === 'attack') playAttackSound()
      else if (logs[i].type === 'faint') playFaintSound()
      else if (logs[i].type === 'end') playVictorySound()
      
      await new Promise(resolve => setTimeout(resolve, 600))
    }
    
    battleLog.value = logs
    showBattleEndNotification(battleResult.value)
    
    setTimeout(() => {
      showBattleAnimation.value = false
      loadChallenges()
    }, 8000)
  } catch (e) {
    console.error('Error mostrando animación:', e)
    showBattleAnimation.value = false
  }
}

async function executeBattle(battleId) {
  // Prevenir ejecución múltiple
  if (battling.value) {
    showNotification('⚠️ Batalla en progreso', 'Ya hay una batalla ejecutándose')
    return
  }
  
  battling.value = true
  battleLog.value = []
  battleResult.value = null
  showBattleAnimation.value = true
  currentBattleLog.value = []
  currentTurn.value = 0
  currentActivePokemon1.value = null
  currentActivePokemon2.value = null
  
  // console.log('🎬 Iniciando animación de batalla')
  // console.log('  - showBattleAnimation:', showBattleAnimation.value)
  
  try {
    // console.log('🎮 Ejecutando batalla...', battleId)
    
    // Intentar ejecutar batalla (solo el primero lo hará)
    const result = await api(`/api/battles/${battleId}/execute`, {
      method: 'POST'
    })
    
    // console.log('📦 Resultado recibido:', result)
    
    // Si la batalla está en progreso (sin logs), esperar resultado
    if (result.status === 'in_progress' && !result.battle_result) {
      // console.log('⏳ Batalla en progreso, esperando resultado...')
      await pollBattleResult(battleId)
      return
    }
    
    // Si la batalla está completada y tiene logs, procesarlos directamente
    const logs = result.battle_result?.battle_log || result.logs || []
    // console.log(`📜 Logs de batalla encontrados: ${logs.length}`)
    // console.log('Logs completos:', JSON.stringify(logs, null, 2))
    
    // Si no hay logs pero está completada, usar polling
    if (result.status === 'completed' && logs.length === 0) {
      // console.log('⏳ Batalla completada pero sin logs, sincronizando...')
      await pollBattleResult(battleId)
      return
    }
    
    battleResult.value = result
    
    // Construir mapa de Pokémon para resolver referencias
    const pokemonMap = buildPokemonMap(logs)
    
    // Inicializar con los primeros Pokémon si no hay información específica
    if (logs.length > 0) {
      // Buscar el primer log de attack para obtener los Pokémon iniciales
      const firstAttackLog = logs.find(log => log.type === 'attack' && log.attacker && log.defender)
      if (firstAttackLog) {
        // console.log('🎯 Encontrado primer log de attack:', firstAttackLog)
        if (!currentActivePokemon1.value) {
          currentActivePokemon1.value = resolvePokemon(firstAttackLog.attacker, pokemonMap)
          // console.log('✅ Pokemon 1 inicial:', currentActivePokemon1.value?.name)
        }
        if (!currentActivePokemon2.value) {
          currentActivePokemon2.value = resolvePokemon(firstAttackLog.defender, pokemonMap)
          // console.log('✅ Pokemon 2 inicial:', currentActivePokemon2.value?.name)
        }
      }
    }
    
    // Animar batalla turno por turno
    for (let i = 0; i < logs.length; i++) {
      currentBattleLog.value.push(logs[i])
      currentTurn.value = i + 1
      
      // Logs comentados para evitar spam (se ejecutan por cada turno)
      // console.log(`📊 Log ${i}:`, logs[i])
      // console.log(`  - Attacker:`, logs[i].attacker)
      // console.log(`  - Defender:`, logs[i].defender)
      
      // Actualizar Pokémon activos usando resolución
      const attacker = resolvePokemon(logs[i].attacker, pokemonMap)
      const defender = resolvePokemon(logs[i].defender, pokemonMap)
      
      if (attacker) {
        // console.log('✅ Actualizando Pokemon 1:', attacker.name)
        currentActivePokemon1.value = attacker
      }
      if (defender) {
        // console.log('✅ Actualizando Pokemon 2:', defender.name)
        currentActivePokemon2.value = defender
      }
      
      // console.log('📊 Estado actual:')
      // console.log('  - currentActivePokemon1:', currentActivePokemon1.value?.name || 'NO')
      // console.log('  - currentActivePokemon2:', currentActivePokemon2.value?.name || 'NO')
      
      // Reproducir sonido según el tipo de evento
      if (logs[i].type === 'attack') {
        playAttackSound()
      } else if (logs[i].type === 'faint') {
        playFaintSound()
      } else if (logs[i].type === 'end') {
        playVictorySound()
      }
      
      // Pausa entre turnos para animación
      await new Promise(resolve => setTimeout(resolve, 800))
    }
    
    battleLog.value = logs
    
    // Mostrar notificación del resultado
    showBattleEndNotification(result)
    
    // Marcar como vista para no repetir
    previousAcceptedBattles.value.push(battleId)
    seenCompletedBattles.value.add(battleId)
    
    // Mantener resultado visible
    setTimeout(() => {
      showBattleAnimation.value = false
      loadChallenges()
    }, 8000)
  } catch (e) {
    console.error(e)
    
    // Si falla, intentar obtener resultado por polling (el otro jugador puede haberla ejecutado)
    if (e.message && e.message.includes('400')) {
      await pollBattleResult(battleId)
    } else {
      showBattleAnimation.value = false
      showNotification('❌ Error', 'Error al ejecutar batalla: ' + (e.message || 'Error desconocido'))
    }
  } finally {
    battling.value = false
  }
}

// Polling para sincronizar resultado de batalla entre jugadores
async function pollBattleResult(battleId) {
  showNotification('🔄 Sincronizando', 'Esperando resultado de batalla...')
  if (!showBattleAnimation.value) {
    showBattleLoadingOverlay(battleId)
  }
  
  const maxAttempts = 60 // 60 intentos = 30 segundos
  let attempts = 0
  
  const poll = async () => {
    try {
      const result = await api(`/api/battles/${battleId}/result`)
      
      if (result.status === 'completed' && result.battle_result) {
        // Batalla completada, animar resultado
        const logs = result.battle_result?.battle_log || []
        const pokemonMap = buildPokemonMap(logs)
        battleResult.value = { 
          battle_result: result.battle_result, 
          winner_id: result.winner_id 
        }
        
        // Inicializar Pokémon activos si no están establecidos
        if (logs.length > 0) {
          const firstAttackLog = logs.find(log => log.type === 'attack' && log.attacker && log.defender)
          if (firstAttackLog) {
            if (!currentActivePokemon1.value) {
              currentActivePokemon1.value = resolvePokemon(firstAttackLog.attacker, pokemonMap)
            }
            if (!currentActivePokemon2.value) {
              currentActivePokemon2.value = resolvePokemon(firstAttackLog.defender, pokemonMap)
            }
          }
        }
        
        // Animar batalla turno por turno
        for (let i = 0; i < logs.length; i++) {
          currentBattleLog.value.push(logs[i])
          currentTurn.value = i + 1
          
          // Actualizar Pokémon activos si hay información de attacker/defender
          const attacker = resolvePokemon(logs[i].attacker, pokemonMap)
          const defender = resolvePokemon(logs[i].defender, pokemonMap)
          if (attacker) currentActivePokemon1.value = attacker
          if (defender) currentActivePokemon2.value = defender
          
          // Reproducir sonido según el tipo de evento
          if (logs[i].type === 'attack') {
            playAttackSound()
          } else if (logs[i].type === 'faint') {
            playFaintSound()
          } else if (logs[i].type === 'end') {
            playVictorySound()
          }
          
          // Pausa entre turnos para animación
          await new Promise(resolve => setTimeout(resolve, 800))
        }
        
        battleLog.value = logs
        
        // Mostrar notificación del resultado
        showBattleEndNotification(battleResult.value)
        
        // Mantener resultado visible
        setTimeout(() => {
          showBattleAnimation.value = false
          loadChallenges()
        }, 8000)
        
        return true
      } else if (attempts >= maxAttempts) {
        showNotification('⏱️ Tiempo agotado', 'No se pudo obtener el resultado')
        showBattleAnimation.value = false
        return true
      } else {
        // Continuar polling
        attempts++
        setTimeout(poll, 500)
      }
    } catch (e) {
      console.error('Error en polling:', e)
      if (attempts >= maxAttempts) {
        showNotification('❌ Error', 'No se pudo sincronizar la batalla')
        showBattleAnimation.value = false
        return true
      }
      attempts++
      setTimeout(poll, 500)
    }
  }
  
  await poll()
}

function showBattleEndNotification(result) {
  const me = currentUser()
  const winnerId = result?.winner_id || result?.battle_result?.winner_id
  const loserName = result?.battle_result?.loser_name || 'el oponente'
  const winnerName = result?.battle_result?.winner_name || 'Ganador'
  const turns = result?.battle_result?.turns || 0

  const isWinner = !!(me?.id && winnerId && Number(me.id) === Number(winnerId))

  if (isWinner) {
    showNotification('🎉 ¡Victoria!', `Has derrotado a ${loserName} en ${turns} turnos`)
    playVictorySound()
  } else {
    showNotification('💪 Derrota', `${winnerName} ganó en ${turns} turnos`)
  }
}


function playAttackSound() {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.setValueAtTime(200, audioContext.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.1)
    oscillator.type = 'sawtooth'
    
    gainNode.gain.setValueAtTime(0.15, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
    
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.1)
  } catch (e) {
    // Silenciar errores de audio
  }
}

function playFaintSound() {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.setValueAtTime(400, audioContext.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.5)
    oscillator.type = 'sine'
    
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
    
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.5)
  } catch (e) {
    // Silenciar errores de audio
  }
}

function playVictorySound() {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    
    // Secuencia de notas de victoria
    const notes = [523.25, 659.25, 783.99, 1046.50] // Do, Mi, Sol, Do alto
    let time = audioContext.currentTime
    
    notes.forEach((freq, i) => {
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = freq
      oscillator.type = 'square'
      
      gainNode.gain.setValueAtTime(0.2, time)
      gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.2)
      
      oscillator.start(time)
      oscillator.stop(time + 0.2)
      
      time += 0.15
    })
  } catch (e) {
    console.log('No se pudo reproducir sonido de victoria')
  }
}

const myPendingChallenges = computed(() => {
  const userInfo = getCurrentUserInfo()
  return challenges.value.filter(c => {
    // Desafíos donde soy el oponente (opponent) y están pendientes
    if (c.status !== 'pending') return false
    return isCurrentUserOpponent(c, userInfo)
  })
})

const mySentChallenges = computed(() => {
  const userInfo = getCurrentUserInfo()
  return challenges.value.filter(c => {
    // Desafíos que yo envié (soy el challenger) y están pendientes
    if (c.status !== 'pending') return false
    return isCurrentUserChallenger(c, userInfo)
  })
})

const acceptedBattles = computed(() => {
  const userInfo = getCurrentUserInfo()
  return challenges.value.filter(c => {
    if (c.status !== 'accepted') return false
    // Solo mostrar batallas donde soy participante
    return isCurrentUserParticipant(c, userInfo)
  })
})

const battleCounters = computed(() => ({
  received: myPendingChallenges.value.length,
  sent: mySentChallenges.value.length,
  ready: acceptedBattles.value.length,
  total: challenges.value.length
}))

watch(
  () => [route.query.id, route.query.action],
  async ([battleId, action]) => {
    if (battleId) {
      await handleBattleDeepLink(battleId, action || 'view')
    }
  }
)

function getUserEmailFromToken() {
  return getCurrentUserInfo().email
}

function debugBattleSystem() {
  console.log('🐛 === DEBUG SISTEMA DE BATALLAS ===')
  const token = localStorage.getItem('token')
  console.log('Token JWT:', token ? 'Existe' : 'No existe')
  
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      console.log('Payload del token:', payload)
    } catch (e) {
      console.error('Error parseando token:', e)
    }
  }
  
  console.log('Mi email:', getUserEmailFromToken())
  console.log('Mi ID (debería ser null):', getUserIdFromToken())
  console.log('Total desafíos:', challenges.value.length)
  console.log('Mis desafíos pendientes:', myPendingChallenges.value.length)
  console.log('Mis desafíos enviados:', mySentChallenges.value.length)
  console.log('Batallas aceptadas:', acceptedBattles.value.length)
  
  console.log('\n📋 Todos los desafíos:')
  challenges.value.forEach((c, i) => {
    console.log(`  ${i}: ID=${c.id} | Status=${c.status} | ${c.challenger_email} -> ${c.opponent_email}`)
  })
  
  console.log('\n🎯 Mis desafíos pendientes detalle:')
  myPendingChallenges.value.forEach((c, i) => {
    console.log(`  ${i}: ID=${c.id} | De=${c.challenger_email} | Para=${c.opponent_email}`)
  })
  
  console.log('\n🔍 Filtro de challenges pendientes:')
  const userEmail = getUserEmailFromToken()
  challenges.value.forEach(c => {
    const isMyChallenge = c.status === 'pending' && c.opponent_email === userEmail
    console.log(`  Challenge ${c.id}: opponent_email='${c.opponent_email}', userEmail='${userEmail}', isMatch=${isMyChallenge}`)
  })
  
  alert('Debug info enviado a consola. Presiona F12 para ver los logs.')
}
</script>

<template>
  <div class="battle-page">
    <!-- Batalla en Tiempo Real con Socket.io -->
    <div v-if="isInRealtimeBattle && realtimeBattle" class="realtime-battle-overlay">
      <div class="realtime-battle-container">
        <div class="realtime-battle-header">
          <h2>⚔️ BATALLA EN TIEMPO REAL ⚔️</h2>
          <div class="connection-status" :class="{ connected: socketConnected }">
            {{ socketConnected ? '🟢 Conectado' : '🔴 Desconectado' }}
          </div>
          <button @click="leaveRealtimeBattle" class="leave-battle-btn">
            ✕ Abandonar Batalla
          </button>
        </div>
        
        <!-- Arena de Batalla -->
        <BattleArena
          :playerPokemon="realtimeBattle.isPlayer1 ? realtimeBattle.currentPokemon1 : realtimeBattle.currentPokemon2"
          :opponentPokemon="realtimeBattle.isPlayer1 ? realtimeBattle.currentPokemon2 : realtimeBattle.currentPokemon1"
          :isPlayerTurn="isPlayerTurn"
          :battleResult="turnResult"
        />
        
        <!-- Selección de Movimientos -->
        <div v-if="isPlayerTurn && !waitingForOpponent" class="moves-panel">
          <h3>Selecciona tu movimiento:</h3>
          <div class="moves-grid">
            <button
              v-for="(move, index) in availableMoves"
              :key="index"
              class="move-btn"
              :class="{ selected: selectedMove?.name === move.name }"
              @click="selectMove(move)"
            >
              <span class="move-name">{{ move.name }}</span>
              <span class="move-type">{{ move.type || 'Normal' }}</span>
            </button>
          </div>
          <button
            v-if="selectedMove"
            @click="submitMove"
            class="submit-move-btn"
          >
            ✓ Confirmar {{ selectedMove.name }}
          </button>
        </div>
        
        <!-- Esperando al oponente -->
        <div v-if="waitingForOpponent" class="waiting-panel">
          <div class="waiting-spinner">⏳</div>
          <p>Esperando al oponente...</p>
        </div>
        
        <!-- Log de turnos -->
        <div v-if="realtimeBattle.log && realtimeBattle.log.length > 0" class="battle-log-panel">
          <h4>Registro de Batalla:</h4>
          <div class="log-entries">
            <div v-for="(log, i) in realtimeBattle.log.slice(-5)" :key="i" class="log-entry">
              <span class="log-turn">Turno {{ log.turn }}:</span>
              <span>{{ log.type === 'attack' ? `${log.attacker} atacó a ${log.defender} con ${log.damage} de daño` : log.message }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Animación de Batalla (Sistema existente) -->
    <div v-if="showBattleAnimation && !isInRealtimeBattle" class="battle-animation-overlay">
      <div class="battle-animation-container">
        <button 
          @click="showBattleAnimation = false" 
          class="battle-close-btn"
        >
          ✕
        </button>
        
        <div class="battle-header-animation">
          <div class="turn-display">
            <div class="turn-label">TURNO</div>
            <div class="turn-number">{{ currentTurn }}</div>
          </div>
        </div>
        
        <!-- Mensaje si no hay logs -->
        <div v-if="currentBattleLog.length === 0" style="text-align: center; padding: 40px; color: #FFCB05; font-size: 18px;">
          ⏳ Cargando batalla...
        </div>
        
        <!-- Mensaje si no hay Pokémon activos aún -->
        <div v-if="currentBattleLog.length > 0 && (!currentActivePokemon1 || !currentActivePokemon2)" style="text-align: center; padding: 40px; color: #FFCB05; font-size: 18px;">
          ⏳ Esperando Pokémon activos...
        </div>
        
        <!-- Campo de Batalla Mejorado -->
        <div v-if="currentActivePokemon1 && currentActivePokemon2" class="battle-field">
          <!-- Pokémon del Oponente (Arriba) -->
          <div class="pokemon-container opponent">
            <div class="pokemon-info-box">
              <div class="pokemon-name-tag">{{ currentActivePokemon2?.name || 'Cargando...' }}</div>
              <div class="pokemon-level">Lv.{{ currentActivePokemon2?.level || 50 }}</div>
              <div class="hp-display">
                <div class="hp-label">HP</div>
                <div class="hp-bar-modern">
                  <div class="hp-bar-bg">
                    <div class="hp-bar-fill" :style="{ 
                      width: getHPPercentage(currentActivePokemon2) + '%'
                    }" :class="{
                      'hp-high': getHPPercentage(currentActivePokemon2) > 50,
                      'hp-medium': getHPPercentage(currentActivePokemon2) > 20 && getHPPercentage(currentActivePokemon2) <= 50,
                      'hp-low': getHPPercentage(currentActivePokemon2) <= 20
                    }"></div>
                  </div>
                </div>
                <div class="hp-numbers">{{ currentActivePokemon2?.currentHP || 0 }}/{{ currentActivePokemon2?.maxHP || 0 }}</div>
              </div>
            </div>
            <div class="pokemon-sprite-container opponent-sprite">
              <img v-if="currentActivePokemon2" 
                   :src="currentActivePokemon2.sprite || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${currentActivePokemon2.id}.png`" 
                   :alt="currentActivePokemon2.name"
                   class="pokemon-sprite-img"
                   @error="$event.target.src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png'">
            </div>
          </div>
          
          <!-- Pokémon del Jugador (Abajo) -->
          <div class="pokemon-container player">
            <div class="pokemon-sprite-container player-sprite">
              <img v-if="currentActivePokemon1" 
                   :src="currentActivePokemon1.sprite || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${currentActivePokemon1.id}.png`" 
                   :alt="currentActivePokemon1.name"
                   class="pokemon-sprite-img"
                   @error="$event.target.src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png'">
            </div>
            <div class="pokemon-info-box player-info">
              <div class="pokemon-name-tag">{{ currentActivePokemon1?.name || 'Cargando...' }}</div>
              <div class="pokemon-level">Lv.{{ currentActivePokemon1?.level || 50 }}</div>
              <div class="hp-display">
                <div class="hp-label">HP</div>
                <div class="hp-bar-modern">
                  <div class="hp-bar-bg">
                    <div class="hp-bar-fill" :style="{ 
                      width: getHPPercentage(currentActivePokemon1) + '%'
                    }" :class="{
                      'hp-high': getHPPercentage(currentActivePokemon1) > 50,
                      'hp-medium': getHPPercentage(currentActivePokemon1) > 20 && getHPPercentage(currentActivePokemon1) <= 50,
                      'hp-low': getHPPercentage(currentActivePokemon1) <= 20
                    }"></div>
                  </div>
                </div>
                <div class="hp-numbers">{{ currentActivePokemon1?.currentHP || 0 }}/{{ currentActivePokemon1?.maxHP || 0 }}</div>
              </div>
              <div class="pokemon-stats-mini">
                <span>⚔️{{ currentActivePokemon1?.attack || 0 }}</span>
                <span>🛡️{{ currentActivePokemon1?.defense || 0 }}</span>
                <span>⚡{{ currentActivePokemon1?.speed || 0 }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Mensaje si no hay Pokémon aún -->
        <div v-if="currentBattleLog.length > 0 && (!currentActivePokemon1 || !currentActivePokemon2)" class="loading-pokemon-message">
          ⏳ Esperando Pokémon activos...
        </div>
        
        <!-- Log de Batalla Mejorado -->
        <div class="battle-log-animation">
          <div 
            v-for="(log, index) in currentBattleLog" 
            :key="index"
            class="battle-log-entry"
            :class="log.type"
          >
            <div class="log-icon">
              <span v-if="log.type === 'start'">🎮</span>
              <span v-else-if="log.type === 'attack'">⚡</span>
              <span v-else-if="log.type === 'faint'">💫</span>
              <span v-else-if="log.type === 'switch'">🔄</span>
              <span v-else-if="log.type === 'end'">🏆</span>
            </div>
            <div class="log-message">
              {{ log.message }}
              <div v-if="log.damage" class="damage-indicator">
                -{{ log.damage }} HP
              </div>
            </div>
          </div>
        </div>
        
        <div class="battle-progress">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: (currentTurn / (battleLog.length || 1) * 100) + '%' }"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Notificaciones flotantes -->
    <div class="notifications-container">
      <div 
        v-for="notification in notifications" 
        :key="notification.id"
        class="notification-toast"
        @click="removeNotification(notification.id)"
      >
        <div class="notification-icon">⚔️</div>
        <div class="notification-content">
          <div class="notification-title">{{ notification.title }}</div>
          <div class="notification-body">{{ notification.body }}</div>
        </div>
        <button class="notification-close" @click.stop="removeNotification(notification.id)">×</button>
      </div>
    </div>

    <div class="battle-header">
      <div class="header-content">
        <div class="header-title">
          <span class="battle-icon">⚔️</span>
          <h1>BATALLAS EN LÍNEA</h1>
        </div>
        <p class="header-subtitle">¡Desafía a tus amigos a batallas épicas!</p>
      </div>
    </div>

    <div v-if="loading" class="pokemon-loading">
      <div class="loading-pokeball">
        <div class="pokeball-spin">⚪</div>
      </div>
      <p class="loading-text">Cargando arena de batalla...</p>
    </div>

    <!-- Batalla Activa -->
    <div v-if="activeBattle" class="active-battle-section">
      <div class="battle-info-card">
        <h2>⚔️ Batalla en Curso</h2>
        <div class="battle-matchup">
          <div class="trainer">
            <div class="trainer-name">{{ activeBattle.battle.challenger_name }}</div>
            <div class="team-preview">
              <div v-for="(pokemon, i) in activeBattle.challengerTeam?.pokemons || []" :key="i" class="mini-pokemon">
                <img :src="pokemon.sprite || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`" :alt="pokemon.name">
              </div>
            </div>
          </div>
          
          <div class="vs-badge">VS</div>
          
          <div class="trainer">
            <div class="trainer-name">{{ activeBattle.battle.opponent_name }}</div>
            <div class="team-preview">
              <div v-for="(pokemon, i) in activeBattle.opponentTeam?.pokemons || []" :key="i" class="mini-pokemon">
                <img :src="pokemon.sprite || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`" :alt="pokemon.name">
              </div>
            </div>
          </div>
        </div>
        
        <div class="battle-actions">
          <button 
            v-if="activeBattle.battle.status === 'accepted'"
            class="btn btn-accent btn-lg" 
            @click="executeBattle(activeBattle.battle.id)"
            :disabled="battling"
          >
            {{ battling ? '⚡ Ejecutando Batalla...' : '🎮 Ejecutar Batalla' }}
          </button>
          <button class="btn btn-outline" @click="activeBattle = null">
            ← Volver
          </button>
        </div>
      </div>

      <!-- Resultado de Batalla -->
      <div v-if="battleResult" class="battle-result">
        <div class="result-content">
          <div class="result-icon">🏆</div>
          <h2>{{ battleResult.battle_result?.winner_name || 'Ganador' }} GANA!</h2>
          <p class="result-subtitle" v-if="battleResult.battle_result?.loser_name">
            {{ battleResult.battle_result.winner_name }} derrotó a {{ battleResult.battle_result.loser_name }}
          </p>
          <div class="result-stats">
            <div class="stat-box">
              <div class="stat-label">Turnos</div>
              <div class="stat-value">{{ battleResult.battle_result?.turns || 0 }}</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Pokémon restantes</div>
              <div class="stat-value">{{ battleResult.battle_result?.team1_remaining ?? 0 }} - {{ battleResult.battle_result?.team2_remaining ?? 0 }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Log de Batalla -->
      <div v-if="battleLog.length > 0" class="battle-log">
        <h3>📜 Registro de Batalla</h3>
        <div class="log-entries">
          <div v-for="(log, index) in battleLog" :key="index" class="log-entry">
            {{ log }}
          </div>
        </div>
      </div>
    </div>

    <!-- Interfaz Principal -->
    <div v-else class="battle-container">
      <!-- Selección de Equipo -->
      <div class="selection-section">
        <h3>🛡️ Selecciona tu Equipo</h3>
        <div v-if="myTeams.length === 0" class="empty-state">
          <p>No tienes equipos. Crea uno primero.</p>
          <button class="btn btn-primary" @click="router.push('/teams')">
            Crear Equipo
          </button>
        </div>
        <div v-else class="team-selector">
          <select v-model="selectedTeam">
            <option :value="null">-- Selecciona un equipo --</option>
            <option v-for="(team, index) in myTeams" :key="index" :value="index">
              {{ team.name || `Equipo ${index + 1}` }} ({{ (team.pokemons || []).length }} Pokémon)
            </option>
          </select>
          
          <!-- Preview del equipo seleccionado -->
          <div v-if="selectedTeam !== null" class="team-preview-section">
            <h4>Tu Equipo:</h4>
            <div class="team-preview">
              <div v-for="(pokemon, i) in myTeams[selectedTeam]?.pokemons || []" :key="i" class="preview-pokemon">
                <img :src="pokemon.sprite || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`" :alt="pokemon.name">
                <span>{{ pokemon.name }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Selección de Amigo -->
      <div class="selection-section">
        <h3>👥 Selecciona un Rival</h3>
        <div v-if="friends.length === 0" class="empty-state">
          <p>No tienes amigos agregados.</p>
          <button class="btn btn-primary" @click="router.push('/friends')">
            Agregar Amigos
          </button>
        </div>
        <div v-else class="friends-selector">
          <div class="friends-grid">
            <div 
              v-for="friend in friends" 
              :key="friend.code"
              class="friend-select-card"
              :class="{ selected: selectedFriend?.code === friend.code }"
              @click="selectedFriend = friend"
            >
              <div class="friend-avatar">
                {{ (friend.name || 'A')[0].toUpperCase() }}
              </div>
              <div class="friend-name">{{ friend.name }}</div>
              <div class="friend-code">{{ friend.code }}</div>
              <div v-if="selectedFriend?.code === friend.code" class="selected-badge">✓</div>
            </div>
          </div>
        </div>

        <div v-if="selectedTeam !== null && selectedFriend" class="challenge-action">
          <button class="btn btn-accent btn-lg" @click="sendChallenge">
            ⚔️ Enviar Desafío a {{ selectedFriend.name }}
          </button>
        </div>

        <div class="battle-counters">
          <div class="counter-card">
            <div class="counter-label">Desafíos Recibidos</div>
            <div class="counter-value">{{ battleCounters.received }}</div>
          </div>
          <div class="counter-card">
            <div class="counter-label">Desafíos Enviados</div>
            <div class="counter-value">{{ battleCounters.sent }}</div>
          </div>
          <div class="counter-card">
            <div class="counter-label">Batallas Listas</div>
            <div class="counter-value">{{ battleCounters.ready }}</div>
          </div>
        </div>
      </div>

      <!-- Desafíos Recibidos -->
        <div class="challenges-section">
        <h3>📨 Desafíos Recibidos ({{ myPendingChallenges.length }})</h3>
          <div v-if="myPendingChallenges.length === 0" class="empty-inline-state">
            No tienes desafíos recibidos pendientes por ahora.
          </div>
          <div v-else class="challenges-grid">
          <div
            v-for="challenge in myPendingChallenges"
            :key="challenge.id"
            class="challenge-card"
            :class="{ 'challenge-card-highlight': normalizeId(challenge.id) === normalizeId(highlightedIncomingChallengeId) }"
          >
            <div class="challenge-header">
              <span class="challenge-from">De: <strong>{{ challenge.challenger_name }}</strong></span>
              <span class="challenge-status pending">Pendiente</span>
            </div>
            <div class="challenge-time">
              {{ new Date(challenge.created_at).toLocaleString() }}
            </div>
            <div class="challenge-team-picker">
              <label class="challenge-team-label">Elige tu equipo para esta batalla</label>
              <select v-model="challengeTeamSelections[challenge.id]" class="challenge-team-select">
                <option :value="undefined">-- Selecciona tu equipo --</option>
                <option v-for="(team, index) in myTeams" :key="`${challenge.id}-${index}`" :value="index">
                  {{ team.name || `Equipo ${index + 1}` }} ({{ (team.pokemons || []).length }} Pokémon)
                </option>
              </select>
            </div>
            <div class="challenge-actions">
              <button class="btn btn-success" @click="acceptChallenge(challenge)">
                ✓ Aceptar
              </button>
              <button class="btn btn-danger" @click="rejectChallenge(challenge)">
                ✗ Rechazar
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Desafíos Enviados -->
      <div class="challenges-section">
        <h3>📤 Desafíos Enviados ({{ mySentChallenges.length }})</h3>
        <div v-if="mySentChallenges.length === 0" class="empty-inline-state">
          No has enviado desafíos pendientes.
        </div>
        <div v-else class="challenges-grid">
          <div v-for="challenge in mySentChallenges" :key="challenge.id" class="challenge-card">
            <div class="challenge-header">
              <span class="challenge-from">Para: <strong>{{ challenge.opponent_name }}</strong></span>
              <span class="challenge-status waiting">Esperando...</span>
            </div>
            <div class="challenge-time">
              {{ new Date(challenge.created_at).toLocaleString() }}
            </div>
            <div class="challenge-actions">
              <button class="btn btn-outline" @click="cancelChallenge(challenge)">
                🗑️ Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Batallas Aceptadas -->
      <div class="challenges-section">
        <h3>⚔️ Batallas Listas ({{ acceptedBattles.length }})</h3>
        <p class="section-description">Ambos jugadores han seleccionado sus equipos. Se iniciará automáticamente cuando aparezca y también puedes iniciarla manualmente.</p>
        <div v-if="acceptedBattles.length === 0" class="empty-inline-state">
          Aún no hay batallas aceptadas.
        </div>
        <div v-else class="challenges-grid">
          <div v-for="battle in acceptedBattles" :key="battle.id" class="challenge-card ready">
            <div class="challenge-header">
              <span class="challenge-from">
                ⚔️ {{ battle.challenger_name }} VS {{ battle.opponent_name }}
              </span>
              <span class="challenge-status ready">¡Ambos listos!</span>
            </div>
            <div class="battle-ready-info">
              <div class="ready-check">✓ Equipos seleccionados</div>
              <div class="ready-check">✓ Esperando ejecución</div>
            </div>
            <div class="challenge-actions">
              <button class="btn btn-accent" @click="loadBattle(battle.id)">
                🎮 Ejecutar Batalla
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Estado Vacío -->
      <div v-if="challenges.length === 0 && myTeams.length > 0 && friends.length > 0" class="empty-battle-state">
        <div class="empty-icon">⚔️</div>
        <h3>No hay batallas activas</h3>
        <p>Selecciona un equipo y desafía a un amigo para comenzar</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Animación de Batalla */
.battle-animation-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, #87CEEB 0%, #E0F6FF 50%, #90EE90 100%);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.battle-animation-container {
  position: relative;
  background: linear-gradient(to bottom, #87CEEB 0%, #E0F6FF 30%, #90EE90 70%, #228B22 100%);
  border-radius: 20px;
  padding: 20px;
  max-width: 900px;
  width: 95%;
  max-height: 95vh;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8), inset 0 2px 20px rgba(255, 255, 255, 0.2);
  border: 6px solid #333;
}

.battle-close-btn {
  position: absolute;
  top: 15px;
  right: 15px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: 2px solid #fff;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 18px;
  font-weight: bold;
  z-index: 100;
  transition: all 0.2s;
}

.battle-close-btn:hover {
  background: #ff4444;
  transform: scale(1.1);
}

.battle-header-animation {
  text-align: center;
  margin-bottom: 20px;
}

.turn-display {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: rgba(0, 0, 0, 0.6);
  padding: 8px 24px;
  border-radius: 25px;
  border: 3px solid #fff;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
}

.turn-label {
  color: #FFCB05;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 1px;
}

.turn-number {
  color: #fff;
  font-size: 24px;
  font-weight: 900;
  min-width: 40px;
  text-align: center;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.15);
  }
}

/* Campo de Batalla Estilo Pokémon */
.battle-field {
  position: relative;
  min-height: 450px;
  margin-bottom: 20px;
  background: linear-gradient(to bottom, 
    transparent 0%, 
    transparent 40%,
    rgba(101, 67, 33, 0.3) 40%,
    rgba(101, 67, 33, 0.5) 100%
  );
  padding: 20px;
  border-radius: 12px;
}

.pokemon-container {
  position: absolute;
  display: flex;
  align-items: flex-start;
  gap: 15px;
}

.pokemon-container.opponent {
  top: 20px;
  right: 60px;
  flex-direction: row-reverse;
}

.pokemon-container.player {
  bottom: 30px;
  left: 60px;
}

.pokemon-info-box {
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.75) 100%);
  border: 3px solid #fff;
  border-radius: 12px;
  padding: 12px 16px;
  min-width: 220px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  animation: slideIn 0.5s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.pokemon-name-tag {
  font-size: 18px;
  font-weight: 900;
  color: #fff;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 4px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
}

.pokemon-level {
  font-size: 14px;
  color: #FFCB05;
  font-weight: 700;
  margin-bottom: 8px;
}

.hp-display {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.hp-label {
  font-size: 14px;
  font-weight: 900;
  color: #FFCB05;
  letter-spacing: 1px;
}

.hp-bar-modern {
  flex: 1;
  position: relative;
}

.hp-bar-bg {
  width: 100%;
  height: 16px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid rgba(0, 0, 0, 0.4);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
}

.hp-bar-fill {
  height: 100%;
  border-radius: 6px;
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s ease;
  box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.4);
  position: relative;
  overflow: hidden;
}

.hp-bar-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, 
    transparent 0%, 
    rgba(255, 255, 255, 0.4) 50%, 
    transparent 100%
  );
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}

.hp-bar-fill.hp-high {
  background: linear-gradient(90deg, #4ade80 0%, #22c55e 100%);
}

.hp-bar-fill.hp-medium {
  background: linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%);
  animation: warningPulse 1s infinite;
}

.hp-bar-fill.hp-low {
  background: linear-gradient(90deg, #ef4444 0%, #dc2626 100%);
  animation: dangerPulse 0.6s infinite;
}

@keyframes warningPulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

@keyframes dangerPulse {
  0%, 100% {
    opacity: 1;
    box-shadow: 0 0 8px rgba(239, 68, 68, 0.8);
  }
  50% {
    opacity: 0.6;
    box-shadow: 0 0 16px rgba(239, 68, 68, 1);
  }
}

.hp-numbers {
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  min-width: 70px;
  text-align: right;
  font-family: 'Courier New', monospace;
}

.pokemon-stats-mini {
  display: flex;
  justify-content: space-around;
  gap: 8px;
  font-size: 12px;
  color: #fff;
  font-weight: 600;
  padding-top: 6px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.pokemon-stats-mini span {
  display: flex;
  align-items: center;
  gap: 2px;
}

.pokemon-sprite-container {
  position: relative;
  width: 180px;
  height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pokemon-sprite-container.opponent-sprite {
  animation: floatOpponent 3s ease-in-out infinite, slideInFromRight 0.6s ease-out;
}

.pokemon-sprite-container.player-sprite {
  animation: floatPlayer 3s ease-in-out infinite 0.5s, slideInFromLeft 0.6s ease-out;
}

@keyframes slideInFromRight {
  from {
    opacity: 0;
    transform: translateX(100px) scale(0.5);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

@keyframes slideInFromLeft {
  from {
    opacity: 0;
    transform: translateX(-100px) scale(0.5);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

@keyframes floatOpponent {
  0%, 100% { 
    transform: translateY(0px) translateX(0px); 
  }
  33% {
    transform: translateY(-8px) translateX(3px);
  }
  66% {
    transform: translateY(-4px) translateX(-3px);
  }
}

@keyframes floatPlayer {
  0%, 100% { 
    transform: translateY(0px) translateX(0px); 
  }
  33% {
    transform: translateY(-6px) translateX(-2px);
  }
  66% {
    transform: translateY(-3px) translateX(2px);
  }
}

.pokemon-sprite-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.5));
}

.player-info {
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
  border-color: #3b82f6;
}

.opponent .pokemon-info-box {
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
  border-color: #ef4444;
}

/* Visualización de Pokémon Activos */
.active-pokemon-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30px;
  margin-bottom: 20px;
  background: linear-gradient(135deg, rgba(59, 76, 202, 0.2) 0%, rgba(42, 117, 187, 0.2) 100%);
  border-radius: 16px;
  border: 2px solid rgba(255, 203, 5, 0.3);
}

.pokemon-info {
  display: flex;
  align-items: center;
  gap: 20px;
  flex: 1;
}

.pokemon-info.left {
  justify-content: flex-start;
}

.pokemon-info.right {
  justify-content: flex-end;
}

.pokemon-sprite {
  width: 120px;
  height: 120px;
  background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
}

.pokemon-sprite img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.4));
  animation: pokemonFloat 3s ease-in-out infinite;
}

@keyframes pokemonFloat {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

.pokemon-details {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 300px;
}

.pokemon-name {
  font-size: 24px;
  font-weight: 900;
  color: #FFCB05;
  text-transform: capitalize;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
}

.pokemon-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: rgba(0,0,0,0.3);
  padding: 12px;
  border-radius: 8px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: white;
  font-weight: 600;
}

.stat-label {
  color: #FFCB05;
  font-weight: 700;
  min-width: 30px;
}

.stat-icon {
  font-size: 16px;
}

.hp-bar {
  flex: 1;
  height: 12px;
  background: rgba(0,0,0,0.5);
  border-radius: 6px;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.3);
}

.hp-fill {
  height: 100%;
  background: linear-gradient(90deg, #4ade80 0%, #22c55e 100%);
  transition: width 0.5s ease, background 0.3s ease;
  border-radius: 6px;
}

.hp-fill[style*="width: 0%"], .hp-fill[style*="width: 1%"], .hp-fill[style*="width: 2%"] {
  background: linear-gradient(90deg, #ef4444 0%, #dc2626 100%);
}

.hp-text {
  min-width: 80px;
  text-align: right;
  color: #FFCB05;
  font-weight: 700;
  font-size: 13px;
}

.vs-indicator {
  font-size: 48px;
  font-weight: 900;
  color: #FFCB05;
  text-shadow: 0 0 20px rgba(255, 203, 5, 0.8),
               2px 2px 4px rgba(0,0,0,0.5);
  animation: vs-pulse 2s ease-in-out infinite;
}

@keyframes vs-pulse {
  0%, 100% { transform: scale(1) rotate(0deg); }
  50% { transform: scale(1.2) rotate(5deg); }
}


.battle-log-animation {
  min-height: 150px;
  max-height: 200px;
  overflow-y: auto;
  padding: 16px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 12px;
  margin-bottom: 16px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.5);
}

.battle-log-animation::-webkit-scrollbar {
  width: 8px;
}

.battle-log-animation::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
}

.battle-log-animation::-webkit-scrollbar-thumb {
  background: rgba(255, 203, 5, 0.6);
  border-radius: 4px;
}

.battle-log-animation::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 203, 5, 0.9);
}

.battle-log-entry {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 12px;
  margin-bottom: 8px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  border-left: 4px solid #FFCB05;
  animation: slideInLeft 0.3s ease-out;
  backdrop-filter: blur(4px);
}

@keyframes slideInLeft {
  from {
    transform: translateX(-30px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.loading-pokemon-message {
  color: #fff;
  text-align: center;
  padding: 40px;
  font-size: 18px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 12px;
  margin-bottom: 20px;
}

.battle-log-entry.attack {
  border-left-color: #ef4444;
  background: linear-gradient(90deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%);
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.2);
}

.battle-log-entry.faint {
  border-left-color: #a855f7;
  background: linear-gradient(90deg, rgba(168, 85, 247, 0.15) 0%, rgba(168, 85, 247, 0.05) 100%);
  box-shadow: 0 2px 8px rgba(168, 85, 247, 0.2);
}

.battle-log-entry.switch {
  border-left-color: #3b82f6;
  background: linear-gradient(90deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.05) 100%);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
}

.battle-log-entry.start {
  border-left-color: #22c55e;
  background: linear-gradient(90deg, rgba(34, 197, 94, 0.15) 0%, rgba(34, 197, 94, 0.05) 100%);
  box-shadow: 0 2px 8px rgba(34, 197, 94, 0.2);
}

.battle-log-entry.end {
  border-left-color: #fbbf24;
  background: linear-gradient(90deg, rgba(251, 191, 36, 0.25) 0%, rgba(251, 191, 36, 0.1) 100%);
  animation: slideInLeft 0.3s ease-out, celebrationPulse 1.5s ease-in-out infinite;
  box-shadow: 0 4px 16px rgba(251, 191, 36, 0.4);
  border: 2px solid rgba(251, 191, 36, 0.5);
}

@keyframes celebrationPulse {
  0%, 100% {
    box-shadow: 0 4px 16px rgba(251, 191, 36, 0.4);
    transform: scale(1);
  }
  50% {
    box-shadow: 0 6px 24px rgba(251, 191, 36, 0.8);
    transform: scale(1.02);
  }
}

/* Efectos de ataque en sprites */
.pokemon-sprite-img.attacking {
  animation: attackShake 0.5s ease-in-out;
}

@keyframes attackShake {
  0%, 100% {
    transform: translateX(0) rotate(0deg);
  }
  25% {
    transform: translateX(-10px) rotate(-5deg);
  }
  50% {
    transform: translateX(10px) rotate(5deg);
  }
  75% {
    transform: translateX(-5px) rotate(-2deg);
  }
}

.pokemon-sprite-img.hit {
  animation: hitFlash 0.6s ease-out;
}

@keyframes hitFlash {
  0%, 100% {
    filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.5));
  }
  10%, 30%, 50% {
    filter: drop-shadow(0 8px 16px rgba(255, 0, 0, 0.8)) brightness(1.5);
  }
  20%, 40% {
    filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.5));
  }
}

.log-icon {
  font-size: 22px;
  flex-shrink: 0;
  animation: iconPop 0.4s ease-out;
}

@keyframes iconPop {
  0% {
    transform: scale(0) rotate(-180deg);
  }
  60% {
    transform: scale(1.2) rotate(10deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
  }
}

.log-message {
  flex: 1;
  color: #fff;
  font-size: 15px;
  line-height: 1.4;
  font-weight: 500;
}

.damage-indicator {
  display: inline-block;
  margin-left: 8px;
  padding: 3px 10px;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  border-radius: 12px;
  font-weight: 900;
  font-size: 13px;
  animation: damageShake 0.3s ease-out, damagePulse 0.5s ease-out;
  box-shadow: 0 2px 6px rgba(239, 68, 68, 0.6);
  letter-spacing: 0.5px;
}

@keyframes damageShake {
  0%, 100% {
    transform: translateX(0) rotate(0deg);
  }
  25% {
    transform: translateX(-4px) rotate(-2deg);
  }
  75% {
    transform: translateX(4px) rotate(2deg);
  }
}

@keyframes damagePulse {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.battle-progress {
  margin-top: 12px;
}

.progress-bar {
  width: 100%;
  height: 10px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 10px;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #FFCB05 0%, #FFA000 50%, #FFCB05 100%);
  background-size: 200% 100%;
  border-radius: 8px;
  transition: width 0.3s ease-out;
  box-shadow: 0 0 10px rgba(255, 203, 5, 0.7);
  animation: progressShine 2s linear infinite;
}

@keyframes progressShine {
  0% {
    background-position: 0% 50%;
  }
  100% {
    background-position: 200% 50%;
  }
}

.battle-page{
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
  min-height: 100vh;
  padding-bottom: 40px;
}

.battle-page::before {
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

.battle-page > * {
  position: relative;
  z-index: 1;
}

.battle-header{
  background: linear-gradient(135deg, #FF6B6B 0%, #FF5252 50%, #FF6B6B 100%);
  border-radius: 20px;
  padding: 32px;
  margin-bottom: 24px;
  box-shadow: 0 8px 24px rgba(255, 107, 107, 0.4);
  border: 4px solid #FFCB05;
  position: relative;
  overflow: hidden;
}

.battle-header::before{
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

.battle-icon{
  font-size: 36px;
  animation: battle-pulse 2s ease-in-out infinite;
}

@keyframes battle-pulse{
  0%, 100%{ transform: scale(1) rotate(-5deg); }
  50%{ transform: scale(1.1) rotate(5deg); }
}

.header-title h1{
  color: #FFCB05;
  font-size: 36px;
  font-weight: 900;
  text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.5);
  letter-spacing: 2px;
  margin: 0;
}

.header-subtitle{
  color: white;
  font-size: 16px;
  font-weight: 600;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  margin: 0;
}

.battle-counters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}

.counter-card {
  background: rgba(255, 255, 255, 0.95);
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 12px;
  text-align: center;
}

.counter-label {
  font-size: 12px;
  color: #4b5563;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.counter-value {
  font-size: 28px;
  line-height: 1.1;
  font-weight: 900;
  color: #1f2937;
  margin-top: 4px;
}

.empty-inline-state {
  background: #f9fafb;
  color: #6b7280;
  border: 1px dashed #d1d5db;
  border-radius: 10px;
  padding: 12px;
  font-size: 14px;
}

.pokemon-loading{
  text-align: center;
  padding: 60px 20px;
}

.loading-pokeball{
  font-size: 48px;
  margin-bottom: 16px;
}

.pokeball-spin{
  animation: spin 2s linear infinite;
}

@keyframes spin{
  from{ transform: rotate(0deg); }
  to{ transform: rotate(360deg); }
}

.loading-text{
  color: #666;
  font-size: 18px;
}

.battle-container{
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.selection-section{
  background: white;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  border: 3px solid #3B4CCA;
}

.selection-section h3{
  color: #3B4CCA;
  margin: 0 0 16px 0;
  font-size: 20px;
  font-weight: 800;
}

.team-selector select{
  width: 100%;
  padding: 14px 16px;
  border: 2px solid #ddd;
  border-radius: 12px;
  font-size: 16px;
  background: white;
  cursor: pointer;
  font-weight: 600;
}

.team-preview-section{
  margin-top: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
}

.team-preview-section h4{
  margin: 0 0 12px 0;
  color: #333;
  font-size: 16px;
}

.team-preview{
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;
}

.preview-pokemon{
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  background: white;
  border-radius: 8px;
  border: 2px solid #ddd;
}

.preview-pokemon img{
  width: 60px;
  height: 60px;
  object-fit: contain;
}

.preview-pokemon span{
  font-size: 12px;
  font-weight: 600;
  text-transform: capitalize;
  margin-top: 4px;
}

.friends-selector{
  margin-top: 16px;
}

.friends-grid{
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
}

.friend-select-card{
  background: white;
  border: 3px solid #ddd;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.friend-select-card:hover{
  transform: translateY(-4px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.15);
  border-color: #3B4CCA;
}

.friend-select-card.selected{
  border-color: #3B4CCA;
  background: linear-gradient(135deg, rgba(59, 76, 202, 0.1) 0%, rgba(42, 117, 187, 0.1) 100%);
  box-shadow: 0 4px 12px rgba(59, 76, 202, 0.3);
}

.friend-avatar{
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3B4CCA 0%, #2A75BB 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 900;
  margin: 0 auto 12px;
  box-shadow: 0 4px 12px rgba(59, 76, 202, 0.3);
}

.friend-name{
  font-weight: 700;
  font-size: 16px;
  color: #222;
  margin-bottom: 4px;
}

.friend-code{
  font-size: 12px;
  color: #666;
  font-family: monospace;
}

.selected-badge{
  position: absolute;
  top: 8px;
  right: 8px;
  background: #3B4CCA;
  color: white;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  font-size: 18px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}

.challenge-action{
  margin-top: 20px;
  text-align: center;
}


.challenge-team-picker {
  margin-top: 12px;
}

.challenge-team-label {
  display: block;
  font-size: 13px;
  font-weight: 700;
  color: #444;
  margin-bottom: 6px;
}

.challenge-team-select {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid #d9d9d9;
  border-radius: 10px;
  font-size: 14px;
  background: #fff;
}
.challenges-section{
  background: white;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  border: 3px solid #06d6a0;
}

.challenges-section h3{
  color: #06d6a0;
  margin: 0 0 16px 0;
  font-size: 20px;
  font-weight: 800;
}

.challenges-grid{
  display: grid;
  gap: 12px;
}

.challenge-card{
  background: #f8f9fa;
  border: 3px solid #ddd;
  border-radius: 12px;
  padding: 16px;
  transition: all 0.3s ease;
}

.challenge-card-highlight {
  border-color: #ffcb05;
  box-shadow: 0 0 0 3px rgba(255, 203, 5, 0.25);
  animation: challengePulse 1s ease-in-out 2;
}

@keyframes challengePulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.01); }
  100% { transform: scale(1); }
}

.challenge-card.ready{
  border-color: #06d6a0;
  background: linear-gradient(135deg, rgba(6, 214, 160, 0.1) 0%, rgba(0, 184, 148, 0.1) 100%);
}

.challenge-header{
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.challenge-from{
  font-size: 16px;
  color: #333;
}

.challenge-status{
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
}

.challenge-status.pending{
  background: #FFE5B4;
  color: #FF8C00;
}

.challenge-status.waiting{
  background: #E0E7FF;
  color: #4F46E5;
}

.challenge-status.ready{
  background: #D1FAE5;
  color: #059669;
}

.challenge-time{
  font-size: 12px;
  color: #666;
  margin-bottom: 12px;
}

.section-description{
  text-align: center;
  color: #666;
  font-size: 14px;
  margin-top: -10px;
  margin-bottom: 20px;
  font-style: italic;
}

.battle-ready-info{
  margin-bottom: 12px;
  padding: 8px;
  background: rgba(6, 214, 160, 0.1);
  border-radius: 6px;
}

.ready-check{
  font-size: 13px;
  color: #059669;
  margin: 4px 0;
  font-weight: 600;
}

.challenge-actions{
  display: flex;
  gap: 8px;
}

.btn{
  padding: 10px 20px;
  border: none;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
}

.btn-success{
  background: #06d6a0;
  color: white;
}

.btn-success:hover{
  background: #00b894;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(6, 214, 160, 0.4);
}

.btn-danger{
  background: #FF6B6B;
  color: white;
}

.btn-danger:hover{
  background: #FF5252;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.4);
}

.btn-accent{
  background: linear-gradient(135deg, #3B4CCA 0%, #2A75BB 100%);
  color: white;
  border: 3px solid #FFCB05;
}

.btn-accent:hover{
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(59, 76, 202, 0.4);
}

.btn-accent:disabled{
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-lg{
  padding: 16px 32px;
  font-size: 18px;
}

.btn-outline{
  background: white;
  color: #3B4CCA;
  border: 2px solid #3B4CCA;
}

.btn-outline:hover{
  background: #3B4CCA;
  color: white;
}

.btn-primary{
  background: #3B4CCA;
  color: white;
}

.empty-state{
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.empty-battle-state{
  text-align: center;
  padding: 80px 20px;
  color: #666;
}

.empty-icon{
  font-size: 80px;
  margin-bottom: 20px;
  opacity: 0.5;
}

/* Batalla Activa */
.active-battle-section{
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.battle-info-card{
  background: white;
  padding: 32px;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  border: 4px solid #FFCB05;
}

.battle-info-card h2{
  text-align: center;
  color: #FF6B6B;
  margin: 0 0 24px 0;
  font-size: 28px;
}

.battle-matchup{
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 24px;
  align-items: center;
  margin-bottom: 24px;
}

.trainer{
  text-align: center;
}

.trainer-name{
  font-size: 20px;
  font-weight: 800;
  color: #222;
  margin-bottom: 12px;
}

.team-preview{
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
}

.mini-pokemon{
  width: 60px;
  height: 60px;
  border: 2px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  background: white;
}

.mini-pokemon img{
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.vs-badge{
  font-size: 48px;
  font-weight: 900;
  color: #FF6B6B;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
  animation: vs-pulse 2s ease-in-out infinite;
}

@keyframes vs-pulse{
  0%, 100%{ transform: scale(1); }
  50%{ transform: scale(1.1); }
}

.battle-actions{
  display: flex;
  justify-content: center;
  gap: 16px;
}

.battle-result{
  background: linear-gradient(135deg, #3B4CCA 0%, #2A75BB 100%);
  color: white;
  padding: 32px;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(59, 76, 202, 0.4);
  border: 4px solid #FFCB05;
  text-align: center;
}

.result-content{
  padding: 20px;
}

.result-icon{
  font-size: 80px;
  margin-bottom: 16px;
  animation: result-bounce 1s ease-in-out;
}

@keyframes result-bounce{
  0%, 100%{ transform: scale(1); }
  50%{ transform: scale(1.2); }
}

.result-content h2{
  color: white;
  margin: 0 0 16px 0;
  font-size: 36px;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

.result-stats{
  margin-top: 20px;
}

.stat-box{
  background: rgba(255,255,255,0.15);
  padding: 20px;
  border-radius: 12px;
}

.stat-label{
  font-size: 16px;
  margin-bottom: 8px;
  opacity: 0.9;
}

.stat-value{
  font-size: 32px;
  font-weight: 900;
}

.battle-log{
  background: #222;
  color: white;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  border: 3px solid #FFCB05;
}

.battle-log h3{
  color: #FFCB05;
  margin: 0 0 16px 0;
  font-size: 20px;
}

.log-entries{
  max-height: 400px;
  overflow-y: auto;
  font-family: monospace;
  font-size: 14px;
}

.log-entry{
  padding: 8px 12px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

@media (max-width: 768px){
  .battle-matchup{
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .vs-badge{
    font-size: 32px;
  }
  
  .friends-grid{
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }
  
  .team-preview{
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  }
}

/* Notificaciones */
.notifications-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 400px;
}

.notification-toast {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.3);
  color: white;
  cursor: pointer;
  animation: slideInRight 0.3s ease-out;
  transition: transform 0.2s, box-shadow 0.2s;
}

.notification-toast:hover {
  transform: translateX(-5px);
  box-shadow: 0 12px 32px rgba(0,0,0,0.4);
}

@keyframes slideInRight {
  from {
    transform: translateX(400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.notification-icon {
  font-size: 32px;
  flex-shrink: 0;
  animation: bounce 1s infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

.notification-content {
  flex: 1;
}

.notification-title {
  font-weight: 700;
  font-size: 16px;
  margin-bottom: 4px;
}

.notification-body {
  font-size: 14px;
  opacity: 0.9;
}

.notification-close {
  background: rgba(255,255,255,0.2);
  border: none;
  color: white;
  font-size: 24px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  flex-shrink: 0;
}

.notification-close:hover {
  background: rgba(255,255,255,0.3);
}

@media (max-width: 768px) {
  .notifications-container {
    top: 10px;
    right: 10px;
    left: 10px;
    max-width: none;
  }
  
  .notification-toast {
    padding: 12px;
  }
  
  .notification-icon {
    font-size: 24px;
  }
  
  .notification-title {
    font-size: 14px;
  }
  
  .notification-body {
    font-size: 12px;
  }
}

/* ============================================ */
/* BATALLA EN TIEMPO REAL - SOCKET.IO */
/* ============================================ */

.realtime-battle-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow-y: auto;
}

.realtime-battle-container {
  width: 100%;
  max-width: 1200px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.realtime-battle-header {
  background: linear-gradient(135deg, #3B4CCA 0%, #2A75BB 100%);
  padding: 20px;
  border-radius: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 20px rgba(59, 76, 202, 0.4);
}

.realtime-battle-header h2 {
  color: #FFCB05;
  margin: 0;
  font-size: 28px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.connection-status {
  padding: 8px 16px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.1);
  color: #ff4444;
  font-weight: bold;
  transition: all 0.3s;
}

.connection-status.connected {
  background: rgba(76, 175, 80, 0.2);
  color: #4caf50;
}

.leave-battle-btn {
  background: #ff4444;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  transition: all 0.3s;
}

.leave-battle-btn:hover {
  background: #ff0000;
  transform: scale(1.05);
}

.moves-panel {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.moves-panel h3 {
  color: #FFCB05;
  margin: 0 0 16px 0;
  font-size: 20px;
  text-align: center;
}

.moves-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.move-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 16px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: all 0.3s;
}

.move-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: #FFCB05;
  transform: translateY(-2px);
}

.move-btn.selected {
  background: #FFCB05;
  border-color: #FFCB05;
  color: #333;
}

.move-name {
  font-weight: bold;
  font-size: 16px;
  text-transform: capitalize;
}

.move-type {
  font-size: 12px;
  opacity: 0.8;
  text-transform: uppercase;
}

.submit-move-btn {
  width: 100%;
  background: #4caf50;
  color: white;
  border: none;
  padding: 16px;
  border-radius: 8px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}

.submit-move-btn:hover {
  background: #45a049;
  transform: scale(1.02);
}

.waiting-panel {
  background: rgba(255, 203, 5, 0.1);
  padding: 40px;
  border-radius: 12px;
  text-align: center;
  color: #FFCB05;
  border: 2px solid #FFCB05;
}

.waiting-spinner {
  font-size: 48px;
  margin-bottom: 16px;
  animation: spin 2s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.waiting-panel p {
  font-size: 18px;
  margin: 0;
}

.battle-log-panel {
  background: #222;
  padding: 16px;
  border-radius: 8px;
  color: white;
  max-height: 200px;
  overflow-y: auto;
}

.battle-log-panel h4 {
  color: #FFCB05;
  margin: 0 0 12px 0;
  font-size: 16px;
}

.battle-log-panel .log-entry {
  padding: 6px 8px;
  margin-bottom: 4px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  font-size: 13px;
  font-family: monospace;
}

.log-turn {
  color: #FFCB05;
  font-weight: bold;
  margin-right: 8px;
}

@media (max-width: 768px) {
  .realtime-battle-header {
    flex-direction: column;
    gap: 12px;
  }
  
  .realtime-battle-header h2 {
    font-size: 20px;
  }
  
  .moves-grid {
    grid-template-columns: 1fr;
  }
}
</style>
