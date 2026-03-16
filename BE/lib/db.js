const { Pool } = require('pg');

// Configuraci├│n de PostgreSQL
// Soporta tanto DATABASE_URL (producci├│n) como variables individuales (desarrollo)
const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false // Necesario para Render, Railway, etc.
        }
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'pokedex',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '123',
        max: 20, // M├íximo de conexiones en el pool
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      }
);

// Verificar conexi├│n (solo una vez al inicio)
let connected = false;
pool.on('connect', () => {
  if (!connected) {
    console.log('Ô£à Conectado a PostgreSQL');
    connected = true;
  }
});

pool.on('error', (err) => {
  console.error('ÔØî Error en PostgreSQL:', err);
  process.exit(-1);
});

// ============================================
// USUARIOS
// ============================================

async function getUserByEmail(email) {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0] || null;
}

async function getUserByCode(code) {
  console.log('­ƒöì Buscando usuario con c├│digo:', code);
  // Usar ILIKE para b├║squeda case-insensitive
  const result = await pool.query('SELECT * FROM users WHERE code ILIKE $1', [code]);
  console.log('­ƒôè Resultados encontrados:', result.rows.length);
  if (result.rows.length > 0) {
    console.log('Ô£à Usuario encontrado:', result.rows[0].email);
  }
  return result.rows[0] || null;
}

async function createUser(user) {
  const { email, password, name, code } = user;
  const result = await pool.query(
    'INSERT INTO users (email, password, name, code) VALUES ($1, $2, $3, $4) RETURNING *',
    [email, password, name, code]
  );
  return result.rows[0];
}

async function updateUser(email, patch) {
  const fields = Object.keys(patch);
  const values = Object.values(patch);
  const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
  
  const result = await pool.query(
    `UPDATE users SET ${setClause} WHERE email = $${fields.length + 1} RETURNING *`,
    [...values, email]
  );
  return result.rows[0] || null;
}

// ============================================
// FAVORITOS
// ============================================

let favoritesMetadataReady = false;
let favoritesMetadataInitPromise = null;

async function ensureFavoritesMetadataColumns() {
  if (favoritesMetadataReady) return;
  if (!favoritesMetadataInitPromise) {
    favoritesMetadataInitPromise = (async () => {
      await pool.query("ALTER TABLE favorites ADD COLUMN IF NOT EXISTS alias VARCHAR(60)");
      await pool.query("ALTER TABLE favorites ADD COLUMN IF NOT EXISTS note TEXT");
      favoritesMetadataReady = true;
    })().catch((error) => {
      favoritesMetadataInitPromise = null;
      throw error;
    });
  }
  await favoritesMetadataInitPromise;
}

async function getFavorites(userId) {
  await ensureFavoritesMetadataColumns();
  const result = await pool.query(
    'SELECT * FROM favorites WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  
  return result.rows.map(row => ({
    id: row.pokemon_id,
    name: row.pokemon_name,
    sprite: row.pokemon_sprite,
    types: row.pokemon_types ? JSON.parse(row.pokemon_types) : [],
    alias: row.alias || '',
    note: row.note || ''
  }));
}

async function addFavorite(userId, pokemon) {
  await ensureFavoritesMetadataColumns();
  const { id, name, sprite, types, alias, note } = pokemon;
  const typesJson = JSON.stringify(types || []);
  const cleanAlias = typeof alias === 'string' ? alias.trim().slice(0, 60) : '';
  const cleanNote = typeof note === 'string' ? note.trim().slice(0, 300) : '';
  
  const result = await pool.query(
    `INSERT INTO favorites (user_id, pokemon_id, pokemon_name, pokemon_sprite, pokemon_types, alias, note)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (user_id, pokemon_id)
     DO UPDATE SET alias = COALESCE(NULLIF(EXCLUDED.alias, ''), favorites.alias),
                   note = COALESCE(NULLIF(EXCLUDED.note, ''), favorites.note)
     RETURNING *`,
    [userId, id, name, sprite, typesJson, cleanAlias, cleanNote]
  );
  return result.rows[0];
}

async function updateFavoriteMetadata(userId, pokemonId, patch = {}) {
  await ensureFavoritesMetadataColumns();

  const alias = typeof patch.alias === 'string' ? patch.alias.trim().slice(0, 60) : '';
  const note = typeof patch.note === 'string' ? patch.note.trim().slice(0, 300) : '';

  const result = await pool.query(
    `UPDATE favorites
     SET alias = $1,
         note = $2
     WHERE user_id = $3 AND pokemon_id = $4
     RETURNING *`,
    [alias, note, userId, pokemonId]
  );

  return result.rows[0] || null;
}

async function removeFavorite(userId, pokemonId) {
  await pool.query(
    'DELETE FROM favorites WHERE user_id = $1 AND pokemon_id = $2',
    [userId, pokemonId]
  );
  return true;
}

// ============================================
// EQUIPOS
// ============================================

async function getTeams(userId) {
  const result = await pool.query(
    'SELECT * FROM teams WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  
  return result.rows.map(row => ({
    name: row.team_name,
    pokemons: JSON.parse(row.pokemons)
  }));
}

async function addTeam(userId, teamData) {
  const { name, pokemons } = teamData;
  const pokemonsJson = JSON.stringify(pokemons || []);
  
  const result = await pool.query(
    'INSERT INTO teams (user_id, team_name, pokemons) VALUES ($1, $2, $3) RETURNING *',
    [userId, name, pokemonsJson]
  );
  return result.rows[0];
}

async function updateTeam(userId, teamIndex, teamData) {
  const { name, pokemons } = teamData;
  const pokemonsJson = JSON.stringify(pokemons || []);
  
  // Obtener el ID del equipo basado en el ├¡ndice
  const teams = await pool.query(
    'SELECT id FROM teams WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1 OFFSET $2',
    [userId, teamIndex]
  );
  
  if (teams.rows.length === 0) return null;
  
  const result = await pool.query(
    'UPDATE teams SET team_name = $1, pokemons = $2 WHERE id = $3 RETURNING *',
    [name, pokemonsJson, teams.rows[0].id]
  );
  return result.rows[0];
}

async function deleteTeam(userId, teamIndex) {
  // Obtener el ID del equipo basado en el ├¡ndice
  const teams = await pool.query(
    'SELECT id FROM teams WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1 OFFSET $2',
    [userId, teamIndex]
  );
  
  if (teams.rows.length === 0) return false;
  
  await pool.query('DELETE FROM teams WHERE id = $1', [teams.rows[0].id]);
  return true;
}

// ============================================
// AMIGOS
// ============================================

async function getFriends(userId) {
  try {
    // Intentar con status (nueva versi├│n)
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.code 
       FROM friends f 
       JOIN users u ON f.friend_id = u.id 
       WHERE f.user_id = $1 AND f.status = 'accepted'
       ORDER BY f.created_at DESC`,
      [userId]
    );
    return result.rows;
  } catch (error) {
    // Si falla por columna inexistente, devolver todos los amigos (versi├│n antigua)
    if (error.message.includes('column "status"') || error.message.includes('does not exist')) {
      console.log('ÔÜá´©Å  Usando versi├│n antigua de friends (sin filtro de status)');
      const result = await pool.query(
        `SELECT u.id, u.name, u.email, u.code 
         FROM friends f 
         JOIN users u ON f.friend_id = u.id 
         WHERE f.user_id = $1
         ORDER BY f.created_at DESC`,
        [userId]
      );
      return result.rows;
    }
    throw error;
  }
}

async function areUsersFriends(userIdA, userIdB) {
  const normalizedA = Number(userIdA);
  const normalizedB = Number(userIdB);

  if (!Number.isInteger(normalizedA) || !Number.isInteger(normalizedB)) {
    return false;
  }

  if (normalizedA === normalizedB) {
    return false;
  }

  try {
    const result = await pool.query(
      `SELECT 1
       FROM friends
       WHERE ((user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1))
         AND status = 'accepted'
       LIMIT 1`,
      [normalizedA, normalizedB]
    );
    return result.rows.length > 0;
  } catch (error) {
    // Compatibilidad con esquemas antiguos donde no existe columna status
    if (error.message.includes('column "status"') || error.message.includes('does not exist')) {
      const fallback = await pool.query(
        `SELECT 1
         FROM friends
         WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)
         LIMIT 1`,
        [normalizedA, normalizedB]
      );
      return fallback.rows.length > 0;
    }
    throw error;
  }
}

async function addFriend(userId, friendId) {
  // Intentar con status (nueva versi├│n con migraci├│n)
  try {
    await pool.query(
      `INSERT INTO friends (user_id, friend_id, status) 
       VALUES ($1, $2, 'pending') 
       ON CONFLICT (user_id, friend_id) DO UPDATE SET status = 'pending'`,
      [userId, friendId]
    );
  } catch (error) {
    // Si falla por columna inexistente, usar version antigua (sin status)
    if (error.message.includes('column "status"') || error.message.includes('does not exist')) {
      console.log('ÔÜá´©Å  Usando versi├│n antigua de friends (sin columna status)');
      await pool.query(
        `INSERT INTO friends (user_id, friend_id) 
         VALUES ($1, $2) 
         ON CONFLICT (user_id, friend_id) DO NOTHING`,
        [userId, friendId]
      );
      // Agregar la relaci├│n bidireccional inmediatamente
      await pool.query(
        `INSERT INTO friends (user_id, friend_id) 
         VALUES ($1, $2) 
         ON CONFLICT (user_id, friend_id) DO NOTHING`,
        [friendId, userId]
      );
    } else {
      throw error;
    }
  }
  return true;
}

async function getPendingFriendRequests(userId) {
  // Intentar con status (nueva versi├│n con migraci├│n)
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.code, f.created_at, f.id as friendship_id
       FROM friends f 
       JOIN users u ON f.user_id = u.id 
       WHERE f.friend_id = $1 AND f.status = 'pending'
       ORDER BY f.created_at DESC`,
      [userId]
    );
    return result.rows;
  } catch (error) {
    // Si falla por columna inexistente, devolver array vac├¡o
    if (error.message.includes('column "status"') || error.message.includes('does not exist')) {
      console.log('ÔÜá´©Å  Columna status no existe, devolviendo array vac├¡o para pending requests');
      return [];
    }
    throw error;
  }
}

// Obtener solicitudes que YO envi├® (esperando respuesta)
async function getSentFriendRequests(userId) {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.code, f.created_at, f.id as friendship_id
       FROM friends f 
       JOIN users u ON f.friend_id = u.id 
       WHERE f.user_id = $1 AND f.status = 'pending'
       ORDER BY f.created_at DESC`,
      [userId]
    );
    return result.rows;
  } catch (error) {
    if (error.message.includes('column "status"') || error.message.includes('does not exist')) {
      console.log('ÔÜá´©Å  Columna status no existe, devolviendo array vac├¡o para sent requests');
      return [];
    }
    throw error;
  }
}

async function acceptFriendRequest(userId, friendId) {
  try {
    // Actualizar la solicitud a 'accepted'
    await pool.query(
      `UPDATE friends 
       SET status = 'accepted' 
       WHERE user_id = $1 AND friend_id = $2`,
      [friendId, userId]
    );
    
    // Crear la relaci├│n bidireccional (el otro lado)
    await pool.query(
      `INSERT INTO friends (user_id, friend_id, status) 
       VALUES ($1, $2, 'accepted') 
       ON CONFLICT (user_id, friend_id) DO UPDATE SET status = 'accepted'`,
      [userId, friendId]
    );
  } catch (error) {
    // Si falla por columna inexistente, la relaci├│n ya existe (versi├│n antigua)
    if (error.message.includes('column "status"') || error.message.includes('does not exist')) {
      console.log('ÔÜá´©Å  Columna status no existe, la relaci├│n ya es bidireccional');
      return true;
    }
    throw error;
  }
  
  return true;
}

async function rejectFriendRequest(userId, friendId) {
  // Eliminar la solicitud rechazada (funciona con y sin status)
  await pool.query(
    'DELETE FROM friends WHERE user_id = $1 AND friend_id = $2',
    [friendId, userId]
  );
  return true;
}

async function removeFriend(userId, friendId) {
  // Eliminar amistad bidireccional
  await pool.query(
    'DELETE FROM friends WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)',
    [userId, friendId]
  );
  return true;
}

// ============================================
// PUSH SUBSCRIPTIONS
// ============================================

async function savePushSubscription(userId, subscription) {
  try {
    console.log('\n­ƒÆ¥ ============ GUARDANDO SUSCRIPCI├ôN PUSH ============');
    console.log('   User ID:', userId);
    console.log('   Endpoint:', subscription.endpoint.substring(0, 60) + '...');
    console.log('   Keys:', {
      p256dh: subscription.keys.p256dh.substring(0, 20) + '...',
      auth: subscription.keys.auth.substring(0, 20) + '...'
    });
    
    console.log('   Ejecutando INSERT/UPDATE...');
    const result = await pool.query(
      `INSERT INTO push_subscriptions (user_id, endpoint, keys_p256dh, keys_auth) 
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, endpoint) 
       DO UPDATE SET keys_p256dh = $3, keys_auth = $4, updated_at = NOW()
       RETURNING *`,
      [userId, subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth]
    );
    
    console.log('Ô£à Query ejecutado exitosamente');
    console.log('   Registro guardado:', {
      id: result.rows[0].id,
      user_id: result.rows[0].user_id,
      created_at: result.rows[0].created_at
    });
    console.log('========================================================\n');
    return true;
  } catch (error) {
    console.error('\nÔØî ============ ERROR GUARDANDO SUSCRIPCI├ôN ============');
    console.error('   Error message:', error.message);
    console.error('   Error code:', error.code);
    console.error('   Error detail:', error.detail);
    console.error('   Stack:', error.stack);
    console.error('========================================================\n');
    
    // Si la tabla no existe, solo registrar en consola pero no fallar
    if (error.message.includes('relation "push_subscriptions"') || error.message.includes('does not exist')) {
      console.log('ÔÜá´©Å  Tabla push_subscriptions no existe. Ejecuta la migraci├│n para habilitar notificaciones push.');
      return false;
    }
    throw error;
  }
}

async function getPushSubscriptions(userId) {
  try {
    console.log(`­ƒô▒ Buscando suscripciones para userId: ${userId}`);
    
    const result = await pool.query(
      'SELECT endpoint, keys_p256dh, keys_auth FROM push_subscriptions WHERE user_id = $1',
      [userId]
    );
    
    console.log(`­ƒôè Encontradas ${result.rows.length} suscripci├│n(es)`);
    
    return result.rows.map(row => ({
      endpoint: row.endpoint,
      keys: {
        p256dh: row.keys_p256dh,
        auth: row.keys_auth
      }
    }));
  } catch (error) {
    // Si la tabla no existe, devolver array vac├¡o
    if (error.message.includes('relation "push_subscriptions"') || error.message.includes('does not exist')) {
      console.log('ÔÜá´©Å  Tabla push_subscriptions no existe, devolviendo array vac├¡o');
      return [];
    }
    console.error('ÔØî Error obteniendo suscripciones:', error);
    throw error;
  }
}

async function removePushSubscription(userId, endpoint) {
  try {
    await pool.query(
      'DELETE FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2',
      [userId, endpoint]
    );
    return true;
  } catch (error) {
    // Si la tabla no existe, no hacer nada
    if (error.message.includes('relation "push_subscriptions"') || error.message.includes('does not exist')) {
      console.log('ÔÜá´©Å  Tabla push_subscriptions no existe');
      return false;
    }
    throw error;
  }
}

// ============================================
// BATALLAS EN L├ìNEA
// ============================================

async function createBattleChallenge(challengerId, opponentId, teamIndex) {
  // Evitar desafios duplicados pendientes entre los mismos usuarios
  const existing = await pool.query(
    `SELECT * FROM battle_challenges 
     WHERE challenger_id = $1 AND opponent_id = $2 AND status = 'pending'
     ORDER BY created_at DESC
     LIMIT 1`,
    [challengerId, opponentId]
  );

  if (existing.rows[0]) {
    return existing.rows[0];
  }

  const result = await pool.query(
    `INSERT INTO battle_challenges (challenger_id, opponent_id, challenger_team_index, status) 
     VALUES ($1, $2, $3, 'pending') RETURNING *`,
    [challengerId, opponentId, teamIndex]
  );
  return result.rows[0];
}

async function getPendingChallenges(userId) {
  const result = await pool.query(
    `SELECT bc.*, 
            u1.id as challenger_user_id, u1.name as challenger_name, u1.code as challenger_code, u1.email as challenger_email,
            u2.id as opponent_user_id, u2.name as opponent_name, u2.code as opponent_code, u2.email as opponent_email,
            (bc.challenger_id = $1) as is_challenger,
            (bc.opponent_id = $1) as is_opponent
     FROM battle_challenges bc
     JOIN users u1 ON bc.challenger_id = u1.id
     JOIN users u2 ON bc.opponent_id = u2.id
     WHERE (bc.challenger_id = $1 OR bc.opponent_id = $1) 
     AND bc.status IN ('pending', 'accepted', 'in_progress', 'completed')
     ORDER BY
       CASE bc.status
         WHEN 'pending' THEN 0
         WHEN 'accepted' THEN 1
         WHEN 'in_progress' THEN 2
         WHEN 'completed' THEN 3
         ELSE 4
       END,
       bc.created_at DESC`,
    [userId]
  );
  
  // Parsear battle_result si existe
  return result.rows.map(row => {
    if (row.battle_result && typeof row.battle_result === 'string') {
      try {
        row.battle_result = JSON.parse(row.battle_result);
      } catch (error) {
        // Evita romper toda la lista por un registro historico corrupto
        row.battle_result = null;
      }
    }
    return row;
  });
}

async function acceptBattleChallenge(battleId, opponentId, opponentTeamIndex) {
  console.log(`Guardando en BD - Battle ID: ${battleId}, Opponent ID: ${opponentId}, Opponent Team Index: ${opponentTeamIndex}`);

  const result = await pool.query(
    `UPDATE battle_challenges
     SET status = 'accepted', opponent_team_index = $1, accepted_at = NOW(), updated_at = NOW()
     WHERE id = $2 AND opponent_id = $3 AND status = 'pending'
     RETURNING *`,
    [opponentTeamIndex, battleId, opponentId]
  );

  const updated = result.rows[0] || null;
  if (updated) {
    console.log(`Batalla actualizada - Status: ${updated.status}, Opponent Team Index: ${updated.opponent_team_index}`);
  }

  return updated;
}

async function rejectBattleChallenge(battleId) {
  const result = await pool.query(
    `UPDATE battle_challenges 
     SET status = 'rejected'
     WHERE id = $1 RETURNING *`,
    [battleId]
  );
  return result.rows[0];
}

async function getBattleById(battleId) {
  const result = await pool.query(
    `SELECT bc.*, 
            u1.name as challenger_name, u1.id as challenger_user_id,
            u2.name as opponent_name, u2.id as opponent_user_id
     FROM battle_challenges bc
     JOIN users u1 ON bc.challenger_id = u1.id
     JOIN users u2 ON bc.opponent_id = u2.id
     WHERE bc.id = $1`,
    [battleId]
  );
  
  const battle = result.rows[0];
  if (battle && battle.battle_result) {
    // Asegurar que battle_result est├® parseado como objeto
    if (typeof battle.battle_result === 'string') {
      try {
        battle.battle_result = JSON.parse(battle.battle_result);
      } catch (error) {
        battle.battle_result = null;
      }
    }
  }
  return battle;
}

async function updateBattleState(battleId, stateData) {
  const { currentTurn, turnCount, logs, status } = stateData;
  const result = await pool.query(
    `UPDATE battle_challenges 
     SET current_turn = $1, turn_count = $2, battle_logs = $3, status = $4, updated_at = NOW()
     WHERE id = $5 RETURNING *`,
    [currentTurn, turnCount, JSON.stringify(logs), status, battleId]
  );
  return result.rows[0];
}

async function updateBattleStatus(battleId, status, requiredCurrentStatus = null) {
  let query = `UPDATE battle_challenges 
     SET status = $1, updated_at = NOW()
     WHERE id = $2`;
  let params = [status, battleId];
  
  if (requiredCurrentStatus) {
    query += ` AND status = $3`;
    params.push(requiredCurrentStatus);
  }
  
  query += ` RETURNING *`;
  
  const result = await pool.query(query, params);
  return result.rows[0]; // null si no se actualiz├│ (lock fall├│)
}

async function submitBattleAction(battleId, userId, action) {
  const result = await pool.query(
    `INSERT INTO battle_actions (battle_id, user_id, action_type, action_data, turn_number)
     SELECT $1, $2, $3, $4, COALESCE(turn_count, 0) + 1
     FROM battle_challenges WHERE id = $1
     RETURNING *`,
    [battleId, userId, action.type, JSON.stringify(action.data)]
  );
  return result.rows[0];
}

async function getBattleActions(battleId, turnNumber) {
  const result = await pool.query(
    `SELECT ba.*, u.name as user_name
     FROM battle_actions ba
     JOIN users u ON ba.user_id = u.id
     WHERE ba.battle_id = $1 AND ba.turn_number = $2
     ORDER BY ba.created_at ASC`,
    [battleId, turnNumber]
  );
  return result.rows;
}

async function finalizeBattle(battleId, winnerId, battleResult) {
  const result = await pool.query(
    `UPDATE battle_challenges 
     SET status = 'completed', winner_id = $1, battle_result = $2, completed_at = NOW()
     WHERE id = $3 RETURNING *`,
    [winnerId, JSON.stringify(battleResult), battleId]
  );
  return result.rows[0];
}

async function getUserBattleHistory(userId) {
  const result = await pool.query(
    `SELECT bc.*, 
            u1.name as challenger_name,
            u2.name as opponent_name,
            uw.name as winner_name
     FROM battle_challenges bc
     JOIN users u1 ON bc.challenger_id = u1.id
     JOIN users u2 ON bc.opponent_id = u2.id
     LEFT JOIN users uw ON bc.winner_id = uw.id
     WHERE (bc.challenger_id = $1 OR bc.opponent_id = $1) 
     AND bc.status = 'completed'
     ORDER BY bc.completed_at DESC
     LIMIT 20`,
    [userId]
  );
  return result.rows;
}

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

function readStat(stats, statName, fallback = 50) {
  if (Array.isArray(stats)) {
    const found = stats.find((s) => (s?.stat?.name || s?.name) === statName);
    const value = found?.base_stat ?? found?.baseStat ?? found?.value;
    return Number.isFinite(value) ? value : fallback;
  }

  if (stats && typeof stats === 'object') {
    const direct = stats[statName] ?? stats[statName.replace('-', '_')];
    if (Number.isFinite(direct)) return direct;
    if (direct && typeof direct === 'object') {
      const nested = direct.base_stat ?? direct.baseStat ?? direct.value;
      if (Number.isFinite(nested)) return nested;
    }
  }

  return fallback;
}

function getPokemonTypes(pokemon) {
  if (!pokemon?.types || !Array.isArray(pokemon.types)) {
    return ['normal'];
  }

  const types = pokemon.types
    .map((t) => t?.type?.name || t?.name || (typeof t === 'string' ? t : null))
    .filter(Boolean);

  return types.length > 0 ? types : ['normal'];
}

function normalizePokemonForBattle(pokemon, trainerName) {
  const hp = readStat(pokemon?.stats, 'hp', 100);

  return {
    ...pokemon,
    name: pokemon?.name || `pokemon-${pokemon?.id || Math.floor(Math.random() * 10000)}`,
    id: pokemon?.id || null,
    sprite: pokemon?.sprite || pokemon?.sprites?.front_default || pokemon?.sprites?.other?.['official-artwork']?.front_default || null,
    types: getPokemonTypes(pokemon),
    maxHP: Math.max(1, hp),
    currentHP: Math.max(1, hp),
    attack: readStat(pokemon?.stats, 'attack', 50),
    defense: readStat(pokemon?.stats, 'defense', 50),
    spAttack: readStat(pokemon?.stats, 'special-attack', 50),
    spDefense: readStat(pokemon?.stats, 'special-defense', 50),
    speed: readStat(pokemon?.stats, 'speed', 50),
    trainer: trainerName,
    fainted: false,
    totalDamageDone: 0,
    totalDamageTaken: 0,
    knocks: 0
  };
}

function getTypeMultiplier(moveType, defenderTypes) {
  const chart = TYPE_EFFECTIVENESS[moveType] || {};
  return defenderTypes.reduce((acc, type) => acc * (chart[type] ?? 1), 1);
}

function chooseAttackType(attacker, defender) {
  const attackerTypes = attacker.types || ['normal'];
  const defenderTypes = defender.types || ['normal'];

  let bestType = attackerTypes[0] || 'normal';
  let bestMultiplier = -1;

  for (const type of attackerTypes) {
    const multiplier = getTypeMultiplier(type, defenderTypes);
    if (multiplier > bestMultiplier) {
      bestMultiplier = multiplier;
      bestType = type;
    }
  }

  return {
    moveType: bestType,
    typeMultiplier: bestMultiplier <= 0 ? 1 : bestMultiplier
  };
}

function calculateDamage(attacker, defender) {
  const level = 50;
  const isSpecial = attacker.spAttack >= attacker.attack;
  const offensive = isSpecial ? attacker.spAttack : attacker.attack;
  const defensive = Math.max(1, isSpecial ? defender.spDefense : defender.defense);
  const power = (isSpecial ? 75 : 70) + Math.min(25, Math.floor(attacker.speed / 8)) + Math.floor(Math.random() * 11);

  const { moveType, typeMultiplier } = chooseAttackType(attacker, defender);
  const stab = attacker.types.includes(moveType) ? 1.2 : 1;
  const critChance = Math.min(0.12, 0.04 + (attacker.speed / 5000));
  const isCritical = Math.random() < critChance;
  const critical = isCritical ? 1.5 : 1;
  const random = 0.9 + Math.random() * 0.1;

  const rawDamage = Math.floor(
    (((((2 * level) / 5 + 2) * power * offensive) / defensive) / 50 + 2) *
      stab * typeMultiplier * critical * random
  );

  return {
    damage: Math.max(1, rawDamage),
    details: {
      category: isSpecial ? 'special' : 'physical',
      moveType,
      typeMultiplier,
      critical: isCritical,
      power
    }
  };
}

function serializePokemonCombatData(p) {
  return {
    name: p.name,
    id: p.id,
    sprite: p.sprite,
    types: p.types,
    currentHP: Math.max(0, p.currentHP),
    maxHP: p.maxHP,
    attack: p.attack,
    defense: p.defense,
    spAttack: p.spAttack,
    spDefense: p.spDefense,
    speed: p.speed
  };
}

function determineWinnerFromState(battle, team1, team2, damageByTeam1, damageByTeam2) {
  const team1Alive = team1.filter((p) => !p.fainted).length;
  const team2Alive = team2.filter((p) => !p.fainted).length;
  const team1RemainingHP = team1.reduce((sum, p) => sum + Math.max(0, p.currentHP), 0);
  const team2RemainingHP = team2.reduce((sum, p) => sum + Math.max(0, p.currentHP), 0);

  if (team1Alive > team2Alive) {
    return { winnerId: battle.challenger_id, winnerName: battle.challenger_name, loserId: battle.opponent_id, loserName: battle.opponent_name, reason: 'more_pokemon_alive' };
  }

  if (team2Alive > team1Alive) {
    return { winnerId: battle.opponent_id, winnerName: battle.opponent_name, loserId: battle.challenger_id, loserName: battle.challenger_name, reason: 'more_pokemon_alive' };
  }

  if (team1RemainingHP > team2RemainingHP) {
    return { winnerId: battle.challenger_id, winnerName: battle.challenger_name, loserId: battle.opponent_id, loserName: battle.opponent_name, reason: 'higher_remaining_hp' };
  }

  if (team2RemainingHP > team1RemainingHP) {
    return { winnerId: battle.opponent_id, winnerName: battle.opponent_name, loserId: battle.challenger_id, loserName: battle.challenger_name, reason: 'higher_remaining_hp' };
  }

  if (damageByTeam1 > damageByTeam2) {
    return { winnerId: battle.challenger_id, winnerName: battle.challenger_name, loserId: battle.opponent_id, loserName: battle.opponent_name, reason: 'higher_total_damage' };
  }

  if (damageByTeam2 > damageByTeam1) {
    return { winnerId: battle.opponent_id, winnerName: battle.opponent_name, loserId: battle.challenger_id, loserName: battle.challenger_name, reason: 'higher_total_damage' };
  }

  return { winnerId: battle.challenger_id, winnerName: battle.challenger_name, loserId: battle.opponent_id, loserName: battle.opponent_name, reason: 'sudden_death_tiebreaker' };
}

async function executeBattle(battleId) {
  const battle = await getBattleById(battleId);
  if (!battle) {
    throw new Error('Batalla no encontrada');
  }

  if (battle.status !== 'accepted' && battle.status !== 'in_progress') {
    throw new Error(`La batalla debe estar en estado "accepted" o "in_progress", estado actual: ${battle.status}`);
  }

  if (battle.challenger_team_index === null || battle.challenger_team_index === undefined) {
    throw new Error('El retador no ha seleccionado un equipo');
  }
  if (battle.opponent_team_index === null || battle.opponent_team_index === undefined) {
    throw new Error('El oponente no ha seleccionado un equipo');
  }

  const challengerTeams = await getTeams(battle.challenger_id);
  const opponentTeams = await getTeams(battle.opponent_id);
  const team1 = challengerTeams[battle.challenger_team_index];
  const team2 = opponentTeams[battle.opponent_team_index];

  if (!team1) throw new Error(`Equipo del retador no encontrado (indice: ${battle.challenger_team_index})`);
  if (!team2) throw new Error(`Equipo del oponente no encontrado (indice: ${battle.opponent_team_index})`);

  const team1Raw = Array.isArray(team1.pokemons) ? team1.pokemons : [];
  const team2Raw = Array.isArray(team2.pokemons) ? team2.pokemons : [];

  if (team1Raw.length === 0) throw new Error('El equipo del retador esta vacio');
  if (team2Raw.length === 0) throw new Error('El equipo del oponente esta vacio');

  const team1Pokemon = team1Raw.map((pokemon) => normalizePokemonForBattle(pokemon, battle.challenger_name));
  const team2Pokemon = team2Raw.map((pokemon) => normalizePokemonForBattle(pokemon, battle.opponent_name));

  const battleLog = [
    {
      type: 'start',
      message: `Batalla entre ${battle.challenger_name} y ${battle.opponent_name}`,
      teams: {
        challenger: team1Pokemon.map((p) => p.name),
        opponent: team2Pokemon.map((p) => p.name)
      },
      timestamp: Date.now()
    }
  ];
  const turns = [];

  let team1Index = 0;
  let team2Index = 0;
  let turnNumber = 0;
  const MAX_TURNS = 220;
  let team1TotalDamage = 0;
  let team2TotalDamage = 0;

  const performAttack = (attacker, defender, isTeam1Attacker) => {
    const { damage, details } = calculateDamage(attacker, defender);
    const appliedDamage = Math.min(defender.currentHP, damage);

    defender.currentHP = Math.max(0, defender.currentHP - damage);
    defender.totalDamageTaken += appliedDamage;
    attacker.totalDamageDone += appliedDamage;

    if (isTeam1Attacker) team1TotalDamage += appliedDamage;
    else team2TotalDamage += appliedDamage;

    const fainted = defender.currentHP <= 0;
    if (fainted) {
      defender.fainted = true;
      attacker.knocks += 1;
    }

    const effectiveness = details.typeMultiplier > 1
      ? 'super efectivo'
      : (details.typeMultiplier < 1 ? 'poco efectivo' : 'efectividad neutra');

    battleLog.push({
      type: 'attack',
      turn: turnNumber,
      message: `${attacker.name} uso un ataque ${details.category} (${details.moveType}) e hizo ${appliedDamage} de dano (${effectiveness})`,
      attacker: serializePokemonCombatData(attacker),
      defender: serializePokemonCombatData(defender),
      damage: appliedDamage,
      attack_meta: details,
      timestamp: Date.now()
    });

    turns.push({
      turn: turnNumber,
      attacker: attacker.name,
      defender: defender.name,
      damage: appliedDamage,
      remainingHP: defender.currentHP,
      moveType: details.moveType,
      category: details.category,
      typeMultiplier: details.typeMultiplier,
      critical: details.critical
    });

    if (fainted) {
      battleLog.push({
        type: 'faint',
        turn: turnNumber,
        message: `${defender.name} ha sido debilitado`,
        pokemon: defender.name,
        timestamp: Date.now()
      });
    }

    return fainted;
  };

  while (team1Index < team1Pokemon.length && team2Index < team2Pokemon.length && turnNumber < MAX_TURNS) {
    turnNumber += 1;
    const active1 = team1Pokemon[team1Index];
    const active2 = team2Pokemon[team2Index];

    const team1First = active1.speed === active2.speed
      ? Math.random() >= 0.5
      : active1.speed > active2.speed;

    const first = team1First
      ? { attacker: active1, defender: active2, isTeam1: true }
      : { attacker: active2, defender: active1, isTeam1: false };

    const second = team1First
      ? { attacker: active2, defender: active1, isTeam1: false }
      : { attacker: active1, defender: active2, isTeam1: true };

    const firstFainted = performAttack(first.attacker, first.defender, first.isTeam1);
    if (firstFainted) {
      if (first.isTeam1) {
        team2Index += 1;
        if (team2Index < team2Pokemon.length) {
          battleLog.push({
            type: 'switch',
            turn: turnNumber,
            message: `${battle.opponent_name} envia a ${team2Pokemon[team2Index].name}`,
            pokemon: team2Pokemon[team2Index].name,
            timestamp: Date.now()
          });
        }
      } else {
        team1Index += 1;
        if (team1Index < team1Pokemon.length) {
          battleLog.push({
            type: 'switch',
            turn: turnNumber,
            message: `${battle.challenger_name} envia a ${team1Pokemon[team1Index].name}`,
            pokemon: team1Pokemon[team1Index].name,
            timestamp: Date.now()
          });
        }
      }
      continue;
    }

    const secondFainted = performAttack(second.attacker, second.defender, second.isTeam1);
    if (secondFainted) {
      if (second.isTeam1) {
        team2Index += 1;
        if (team2Index < team2Pokemon.length) {
          battleLog.push({
            type: 'switch',
            turn: turnNumber,
            message: `${battle.opponent_name} envia a ${team2Pokemon[team2Index].name}`,
            pokemon: team2Pokemon[team2Index].name,
            timestamp: Date.now()
          });
        }
      } else {
        team1Index += 1;
        if (team1Index < team1Pokemon.length) {
          battleLog.push({
            type: 'switch',
            turn: turnNumber,
            message: `${battle.challenger_name} envia a ${team1Pokemon[team1Index].name}`,
            pokemon: team1Pokemon[team1Index].name,
            timestamp: Date.now()
          });
        }
      }
    }
  }

  const winner = determineWinnerFromState(battle, team1Pokemon, team2Pokemon, team1TotalDamage, team2TotalDamage);

  battleLog.push({
    type: 'end',
    message: `${winner.winnerName} gana la batalla`,
    winner: winner.winnerName,
    loser: winner.loserName,
    reason: winner.reason,
    timestamp: Date.now()
  });

  const battleResult = {
    winner_id: winner.winnerId,
    winner_name: winner.winnerName,
    loser_id: winner.loserId,
    loser_name: winner.loserName,
    win_reason: winner.reason,
    turns: turnNumber,
    team1_name: battle.challenger_name,
    team2_name: battle.opponent_name,
    team1_pokemon: team1Pokemon.map((p) => p.name),
    team2_pokemon: team2Pokemon.map((p) => p.name),
    team1_remaining: team1Pokemon.filter((p) => !p.fainted).length,
    team2_remaining: team2Pokemon.filter((p) => !p.fainted).length,
    team1_remaining_hp: team1Pokemon.reduce((sum, p) => sum + Math.max(0, p.currentHP), 0),
    team2_remaining_hp: team2Pokemon.reduce((sum, p) => sum + Math.max(0, p.currentHP), 0),
    team1_damage_done: team1TotalDamage,
    team2_damage_done: team2TotalDamage,
    battle_log: battleLog,
    detailed_turns: turns,
    pokemon_summary: {
      challenger: team1Pokemon.map((p) => ({
        name: p.name,
        fainted: p.fainted,
        remaining_hp: p.currentHP,
        max_hp: p.maxHP,
        damage_done: p.totalDamageDone,
        damage_taken: p.totalDamageTaken,
        knocks: p.knocks
      })),
      opponent: team2Pokemon.map((p) => ({
        name: p.name,
        fainted: p.fainted,
        remaining_hp: p.currentHP,
        max_hp: p.maxHP,
        damage_done: p.totalDamageDone,
        damage_taken: p.totalDamageTaken,
        knocks: p.knocks
      }))
    }
  };

  const result = await finalizeBattle(battleId, winner.winnerId, battleResult);
  return {
    ...result,
    battle_result: battleResult
  };
}

module.exports = {
  pool,
  getUserByEmail,
  getUserByCode,
  createUser,
  updateUser,
  getFavorites,
  addFavorite,
  updateFavoriteMetadata,
  removeFavorite,
  getTeams,
  addTeam,
  updateTeam,
  deleteTeam,
  getFriends,
  areUsersFriends,
  addFriend,
  getPendingFriendRequests,
  getSentFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  // Push Subscriptions
  savePushSubscription,
  getPushSubscriptions,
  removePushSubscription,
  // Batallas
  createBattleChallenge,
  getPendingChallenges,
  acceptBattleChallenge,
  rejectBattleChallenge,
  getBattleById,
  updateBattleState,
  updateBattleStatus,
  submitBattleAction,
  getBattleActions,
  finalizeBattle,
  executeBattle,
  getUserBattleHistory
};
