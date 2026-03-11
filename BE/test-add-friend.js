// Test manual: agregar solicitud de amistad y verificar status
require('dotenv').config();
const { pool, addFriend, getUserByCode, getUserByEmail } = require('./lib/db');

async function testAddFriend() {
  console.log('\n🧪 ===== PRUEBA: AGREGAR SOLICITUD DE AMISTAD =====\n');
  
  try {
    // Obtener dos usuarios para la prueba
    const users = await pool.query('SELECT id, name, email, code FROM users LIMIT 2');
    
    if (users.rows.length < 2) {
      console.log('❌ Necesitas al menos 2 usuarios en la BD');
      await pool.end();
      return;
    }
    
    const user1 = users.rows[0];
    const user2 = users.rows[1];
    
    console.log('👤 Usuario 1:', user1.name, '(', user1.email, ')');
    console.log('👤 Usuario 2:', user2.name, '(', user2.email, ')');
    console.log('');
    
    // Eliminar solicitudes previas entre estos usuarios
    console.log('🧹 Limpiando solicitudes previas...');
    await pool.query(
      'DELETE FROM friends WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)',
      [user1.id, user2.id]
    );
    console.log('✅ Limpieza completada\n');
    
    // Agregar solicitud de user1 a user2
    console.log(`📤 Usuario 1 envía solicitud a Usuario 2...`);
    await addFriend(user1.id, user2.id);
    console.log('✅ Solicitud enviada\n');
    
    // Verificar en la BD
    console.log('🔍 Verificando en la base de datos...');
    const result = await pool.query(
      'SELECT * FROM friends WHERE user_id = $1 AND friend_id = $2',
      [user1.id, user2.id]
    );
    
    if (result.rows.length > 0) {
      const friendship = result.rows[0];
      console.log('✅ Solicitud encontrada en la BD:');
      console.log('   ID:', friendship.id);
      console.log('   user_id:', friendship.user_id);
      console.log('   friend_id:', friendship.friend_id);
      console.log('   status:', friendship.status);
      console.log('   created_at:', friendship.created_at);
      console.log('');
      
      if (friendship.status === 'pending') {
        console.log('✅✅✅ CORRECTO: Status es "pending"');
      } else {
        console.log('❌❌❌ ERROR: Status es "' + friendship.status + '" en lugar de "pending"');
      }
    } else {
      console.log('❌ No se encontró la solicitud en la BD');
    }
    
    console.log('');
    
    // Verificar solicitudes pendientes de user2
    console.log('📥 Verificando solicitudes pendientes de Usuario 2...');
    const pending = await pool.query(
      `SELECT u.name, f.status, f.created_at
       FROM friends f 
       JOIN users u ON f.user_id = u.id 
       WHERE f.friend_id = $1 AND f.status = 'pending'`,
      [user2.id]
    );
    
    if (pending.rows.length > 0) {
      console.log(`✅ Usuario 2 tiene ${pending.rows.length} solicitud(es) pendiente(s):`);
      pending.rows.forEach((req, i) => {
        console.log(`   ${i + 1}. De: ${req.name} | Status: ${req.status} | Fecha: ${req.created_at}`);
      });
    } else {
      console.log('❌ Usuario 2 NO tiene solicitudes pendientes');
      console.log('   Esto significa que la solicitud no se guardó correctamente');
    }
    
    console.log('\n===============================================\n');
    
  } catch (error) {
    console.error('❌ Error en prueba:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

testAddFriend();
