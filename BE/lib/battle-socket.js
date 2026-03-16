const axios = require('axios');
const { getBattleById, getTeams } = require('./db');

// Estado de las batallas activas
const activeBattles = new Map();

// Mapa de usuarios conectados: userId -> socketId
const connectedUsers = new Map();

// Cache de datos de Pokémon de la PokéAPI
const pokemonCache = new Map();
const moveCache = new Map();

const TYPE_EFFECTIVENESS = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  ice: { fire: 0.5, water: 0.5, grass: 2, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
  poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
  rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 }
};

// Obtener datos de Pokémon de la PokéAPI con cache
async function getMoveData(moveRef) {
  if (!moveRef) return null;
  if (typeof moveRef === 'object' && moveRef.name && moveRef.type && moveRef.power !== undefined) {
    return {
      name: moveRef.name,
      type: moveRef.type,
      power: moveRef.power,
      accuracy: moveRef.accuracy ?? null,
      damageClass: moveRef.damageClass || moveRef.damage_class || 'physical',
      url: moveRef.url || null
    };
  }

  const nestedMove = typeof moveRef === 'object' ? moveRef.move : null;
  const moveCandidate = nestedMove && typeof nestedMove === 'object' ? nestedMove : moveRef;
  const moveName = typeof moveCandidate === 'string' ? moveCandidate : moveCandidate?.name;
  const moveUrl = typeof moveCandidate === 'object' ? moveCandidate.url : null;

  if (!moveName && !moveUrl) return null;

  const key = (moveName || moveUrl).toLowerCase();
  if (moveCache.has(key)) {
    return moveCache.get(key);
  }

  try {
    const response = await axios.get(moveUrl || `https://pokeapi.co/api/v2/move/${moveName}`);
    const moveData = response.data;
    const normalized = {
      name: moveData.name,
      type: moveData.type?.name || 'normal',
      power: moveData.power || 50,
      accuracy: moveData.accuracy,
      damageClass: moveData.damage_class?.name || 'physical',
      url: moveData.url || moveUrl || null
    };
    moveCache.set(key, normalized);
    return normalized;
  } catch (error) {
    const fallback = {
      name: moveName || 'tackle',
      type: 'normal',
      power: 50,
      accuracy: null,
      damageClass: 'physical',
      url: moveUrl || null
    };
    moveCache.set(key, fallback);
    return fallback;
  }
}

async function buildPokemonMoveset(pokemonApiMoves) {
  const sourceMoves = Array.isArray(pokemonApiMoves) ? pokemonApiMoves : [];
  if (sourceMoves.length === 0) {
    return [{ name: 'tackle', type: 'normal', power: 50, damageClass: 'physical' }];
  }

  const candidateRefs = sourceMoves
    .slice(0, 30)
    .map((entry) => entry?.move)
    .filter(Boolean);

  const analyzed = await Promise.all(candidateRefs.map((moveRef) => getMoveData(moveRef)));
  const attackMoves = analyzed.filter((move) => move && move.power > 0);

  const preferred = (attackMoves.length > 0 ? attackMoves : analyzed.filter(Boolean))
    .sort((a, b) => (b.power || 0) - (a.power || 0));

  const uniqueByName = [];
  const seen = new Set();
  for (const move of preferred) {
    if (!move || !move.name) continue;
    if (seen.has(move.name)) continue;
    seen.add(move.name);
    uniqueByName.push(move);
    if (uniqueByName.length >= 4) break;
  }

  if (uniqueByName.length === 0) {
    return [{ name: 'tackle', type: 'normal', power: 50, damageClass: 'physical' }];
  }

  return uniqueByName;
}

async function enrichTeamPokemonForBattle(teamPokemon) {
  const pokemonFromApi = await getPokemonData(teamPokemon?.id || teamPokemon?.name);
  if (!pokemonFromApi) return null;

  let moves = pokemonFromApi.moves;
  if (Array.isArray(teamPokemon?.moves) && teamPokemon.moves.length > 0) {
    const customMoves = await Promise.all(teamPokemon.moves.slice(0, 4).map((moveRef) => getMoveData(moveRef)));
    const validCustomMoves = customMoves.filter(Boolean);
    if (validCustomMoves.length > 0) {
      const dedupedCustomMoves = [];
      const seenCustomMoves = new Set();
      for (const move of validCustomMoves) {
        if (!move?.name || seenCustomMoves.has(move.name)) continue;
        seenCustomMoves.add(move.name);
        dedupedCustomMoves.push(move);
        if (dedupedCustomMoves.length >= 4) break;
      }
      moves = dedupedCustomMoves;
    }
  }

  return {
    ...pokemonFromApi,
    moves
  };
}

async function getPokemonData(pokemonId) {
  if (pokemonCache.has(pokemonId)) {
    return pokemonCache.get(pokemonId);
  }

  try {
    const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
    const data = response.data;
    const moveset = await buildPokemonMoveset(data.moves);
    
    const pokemonData = {
      id: data.id,
      name: data.name,
      sprite: data.sprites.front_default,
      stats: {
        hp: data.stats.find(s => s.stat.name === 'hp')?.base_stat || 100,
        attack: data.stats.find(s => s.stat.name === 'attack')?.base_stat || 50,
        defense: data.stats.find(s => s.stat.name === 'defense')?.base_stat || 50,
        spAttack: data.stats.find(s => s.stat.name === 'special-attack')?.base_stat || 50,
        spDefense: data.stats.find(s => s.stat.name === 'special-defense')?.base_stat || 50,
        speed: data.stats.find(s => s.stat.name === 'speed')?.base_stat || 50
      },
      moves: moveset,
      types: data.types.map(t => t.type.name)
    };
    
    pokemonCache.set(pokemonId, pokemonData);
    return pokemonData;
  } catch (error) {
    console.error('Error fetching pokemon data:', error);
    return null;
  }
}

// Fórmula de cálculo de daño de Pokémon
function calculateDamage(attacker, defender, move) {
  const level = 50; // Nivel estándar para batallas
  const power = move?.power || 50; // Poder del movimiento
  const attack = attacker.stats.attack;
  const defense = defender.stats.defense;
  const moveType = move?.type || attacker.types?.[0] || 'normal';
  
  // Fórmula oficial de Pokémon
  const baseDamage = ((2 * level / 5 + 2) * power * (attack / defense) / 50 + 2);
  
  // Modificadores
  const stab = attacker.types?.includes(moveType) ? 1.5 : 1; // Same Type Attack Bonus
  const typeChart = TYPE_EFFECTIVENESS[moveType] || {};
  const defenderTypes = Array.isArray(defender.types) ? defender.types : ['normal'];
  const typeEffectiveness = defenderTypes.reduce((acc, type) => acc * (typeChart[type] ?? 1), 1);
  const random = 0.85 + Math.random() * 0.15; // 0.85 - 1.0
  const critical = Math.random() < 0.0625 ? 2 : 1; // 6.25% chance
  
  const totalDamage = Math.floor(baseDamage * stab * typeEffectiveness * random * critical);
  
  return {
    damage: totalDamage,
    critical: critical === 2,
    effectiveness: typeEffectiveness
  };
}

// Inicializar batalla
function initializeBattle(battleId, team1Data, team2Data) {
  const battleState = {
    battleId,
    status: 'waiting', // waiting, selecting, calculating, animating
    turn: 0,
    currentTurnPlayer: 1,
    team1: team1Data.map(p => ({
      ...p,
      currentHP: p.stats.hp,
      maxHP: p.stats.hp,
      fainted: false
    })),
    team2: team2Data.map(p => ({
      ...p,
      currentHP: p.stats.hp,
      maxHP: p.stats.hp,
      fainted: false
    })),
    currentPokemon1Index: 0,
    currentPokemon2Index: 0,
    player1Action: null,
    player2Action: null,
    log: []
  };
  
  activeBattles.set(battleId, battleState);
  return battleState;
}

// Procesar turno
function processTurn(battleState) {
  const p1 = battleState.team1[battleState.currentPokemon1Index];
  const p2 = battleState.team2[battleState.currentPokemon2Index];
  
  if (!p1 || !p2 || p1.fainted || p2.fainted) {
    return null;
  }
  
  const isPlayer1Turn = battleState.currentTurnPlayer === 1;
  const action = isPlayer1Turn ? battleState.player1Action : battleState.player2Action;

  if (!action || action.type !== 'attack') {
    return [];
  }

  const currentAttacker = isPlayer1Turn ? p1 : p2;
  const attackerMoves = Array.isArray(currentAttacker?.moves) ? currentAttacker.moves : [];
  const selectedMoveName = action.move?.name;
  const selectedMove = attackerMoves.find((move) => move.name === selectedMoveName) || attackerMoves[0] || action.move;

  const attacks = [{
    attacker: currentAttacker,
    defender: isPlayer1Turn ? p2 : p1,
    move: selectedMove,
    isPlayer1: isPlayer1Turn
  }];
  
  const results = [];
  
  for (const attack of attacks) {
    if (attack.attacker.fainted || attack.defender.fainted) continue;
    
    const damageResult = calculateDamage(attack.attacker, attack.defender, attack.move);
    attack.defender.currentHP = Math.max(0, attack.defender.currentHP - damageResult.damage);
    
    results.push({
      attacker: attack.attacker.name,
      defender: attack.defender.name,
      move: attack.move.name,
      damage: damageResult.damage,
      critical: damageResult.critical,
      newHP: attack.defender.currentHP,
      maxHP: attack.defender.maxHP,
      isPlayer1: attack.isPlayer1
    });
    
    battleState.log.push({
      turn: battleState.turn,
      type: 'attack',
      ...results[results.length - 1],
      timestamp: Date.now()
    });
    
    // Verificar si el defensor se debilitó
    if (attack.defender.currentHP <= 0) {
      attack.defender.fainted = true;
      
      results.push({
        type: 'faint',
        pokemon: attack.defender.name,
        isPlayer1: !attack.isPlayer1
      });
      
      battleState.log.push({
        turn: battleState.turn,
        type: 'faint',
        pokemon: attack.defender.name,
        isPlayer1: !attack.isPlayer1,
        timestamp: Date.now()
      });
      
      // Avanzar al siguiente Pokémon
      if (attack.isPlayer1) {
        battleState.currentPokemon2Index++;
      } else {
        battleState.currentPokemon1Index++;
      }
    }
  }
  
  battleState.turn++;
  battleState.currentTurnPlayer = battleState.currentTurnPlayer === 1 ? 2 : 1;
  battleState.player1Action = null;
  battleState.player2Action = null;
  
  return results;
}

// Verificar si la batalla terminó
function checkBattleEnd(battleState) {
  const team1Alive = battleState.team1.some(p => !p.fainted);
  const team2Alive = battleState.team2.some(p => !p.fainted);
  
  if (!team1Alive) {
    return { ended: true, winner: 'player2' };
  }
  if (!team2Alive) {
    return { ended: true, winner: 'player1' };
  }
  
  return { ended: false };
}

// Configurar Socket.io para batallas
function setupBattleSocket(io) {
  io.on('connection', (socket) => {
    console.log('🔌 Cliente conectado:', socket.id);
    
    // Registrar usuario cuando se identifica
    socket.on('register-user', (data) => {
      const { userId, userEmail } = data;
      console.log(`👤 Usuario registrado: ${userEmail} (ID: ${userId}) -> Socket: ${socket.id}`);
      
      socket.userId = userId;
      socket.userEmail = userEmail;
      
      // Actualizar mapa de usuarios conectados
      connectedUsers.set(userId, socket.id);
      
      socket.emit('registered', { success: true });
    });
    
    // Unirse a una batalla
    socket.on('join-battle', async (data) => {
      const { battleId, userId } = data;
      console.log(`👤 Usuario ${userId} uniéndose a batalla ${battleId}`);
      
      socket.join(`battle-${battleId}`);
      socket.battleId = battleId;
      socket.userId = userId;
      
      // Verificar si la batalla ya está inicializada
      let battleState = activeBattles.get(battleId);
      
      if (!battleState) {
        // Cargar datos de batalla de la BD
        try {
          const battle = await getBattleById(battleId);
          if (!battle) {
            socket.emit('error', { message: 'Batalla no encontrada' });
            return;
          }
          
          // Cargar equipos
          const team1Data = await getTeams(battle.challenger_id);
          const team2Data = await getTeams(battle.opponent_id);
          
          const team1Pokemon = team1Data[battle.challenger_team_index].pokemons;
          const team2Pokemon = team2Data[battle.opponent_team_index].pokemons;
          
          // Obtener datos completos de la PokéAPI y preservar movimientos personalizados por Pokémon
          const team1FullRaw = await Promise.all(
            team1Pokemon.map((p) => enrichTeamPokemonForBattle(p))
          );
          const team2FullRaw = await Promise.all(
            team2Pokemon.map((p) => enrichTeamPokemonForBattle(p))
          );

          const team1Full = team1FullRaw.filter(Boolean);
          const team2Full = team2FullRaw.filter(Boolean);

          if (team1Full.length === 0 || team2Full.length === 0) {
            socket.emit('error', { message: 'No se pudieron preparar los Pokémon para la batalla' });
            return;
          }
          
          battleState = initializeBattle(battleId, team1Full, team2Full);
          
          battleState.player1Id = battle.challenger_id;
          battleState.player2Id = battle.opponent_id;
          battleState.player1Name = battle.challenger_name;
          battleState.player2Name = battle.opponent_name;
        } catch (error) {
          console.error('Error loading battle:', error);
          socket.emit('error', { message: 'Error al cargar batalla' });
          return;
        }
      }
      
      // Enviar estado inicial
      const isPlayer1 = battleState.player1Id === userId;
      socket.emit('battle-state', {
        ...battleState,
        isPlayer1,
        isPlayerTurn: battleState.currentTurnPlayer === (isPlayer1 ? 1 : 2),
        currentPokemon1: battleState.team1[battleState.currentPokemon1Index],
        currentPokemon2: battleState.team2[battleState.currentPokemon2Index]
      });
      
      // Notificar a la sala que un jugador se unió
      io.to(`battle-${battleId}`).emit('player-joined', {
        userId,
        playersReady: true
      });
    });
    
    // Recibir acción del jugador
    socket.on('player-action', (data) => {
      const { battleId, action } = data;
      const battleState = activeBattles.get(battleId);
      
      if (!battleState) {
        socket.emit('error', { message: 'Estado de batalla no encontrado' });
        return;
      }
      
      const isPlayer1 = battleState.player1Id === socket.userId;
      
      const actingPlayer = isPlayer1 ? 1 : 2;

      if (battleState.currentTurnPlayer !== actingPlayer) {
        socket.emit('error', { message: 'No es tu turno todavía' });
        return;
      }

      if (!action || action.type !== 'attack' || !action.move || !action.move.name) {
        socket.emit('error', { message: 'Acción inválida' });
        return;
      }

      if (isPlayer1) {
        battleState.player1Action = action;
      } else {
        battleState.player2Action = action;
      }
      
      // Notificar que el jugador eligió su acción
      io.to(`battle-${battleId}`).emit('action-received', {
        player: actingPlayer,
        ready: true,
        resolving: true
      });

      battleState.status = 'calculating';

      setTimeout(() => {
        const results = processTurn(battleState);
        const endCheck = checkBattleEnd(battleState);

        io.to(`battle-${battleId}`).emit('turn-result', {
          results,
          turn: battleState.turn,
          currentTurnPlayer: battleState.currentTurnPlayer,
          currentPokemon1: battleState.team1[battleState.currentPokemon1Index],
          currentPokemon2: battleState.team2[battleState.currentPokemon2Index],
          battleLog: battleState.log,
          ended: endCheck.ended,
          winner: endCheck.winner,
          winnerName: endCheck.winner === 'player1' ? battleState.player1Name : battleState.player2Name
        });

        if (endCheck.ended) {
          battleState.status = 'completed';
          io.to(`battle-${battleId}`).emit('battle-end', {
            winner: endCheck.winner,
            winnerName: endCheck.winner === 'player1' ? battleState.player1Name : battleState.player2Name
          });

          setTimeout(() => {
            activeBattles.delete(battleId);
          }, 30000);
        } else {
          battleState.status = 'waiting';
        }
      }, 700);
    });

    socket.on('leave-battle', (data) => {
      const { battleId } = data || {};
      if (!battleId) return;
      socket.leave(`battle-${battleId}`);
    });
    
    // Desconexión
    socket.on('disconnect', () => {
      console.log('❌ Cliente desconectado:', socket.id);
      
      // Limpiar del mapa de usuarios conectados
      if (socket.userId) {
        console.log(`👤 Usuario desconectado: ${socket.userEmail} (ID: ${socket.userId})`);
        connectedUsers.delete(socket.userId);
      }
      
      if (socket.battleId) {
        io.to(`battle-${socket.battleId}`).emit('player-disconnected', {
          userId: socket.userId
        });
      }
    });
  });
}

module.exports = {
  setupBattleSocket,
  activeBattles,
  getPokemonData,
  connectedUsers,
  
  // Función para enviar notificación a un usuario específico
  notifyUser: (io, userId, eventName, data) => {
    const socketId = connectedUsers.get(userId);
    if (socketId) {
      console.log(`📨 Enviando notificación '${eventName}' a usuario ${userId} (socket: ${socketId})`);
      io.to(socketId).emit(eventName, data);
      return true;
    } else {
      console.log(`⚠️ Usuario ${userId} no está conectado, no se puede enviar notificación`);
      return false;
    }
  }
};
