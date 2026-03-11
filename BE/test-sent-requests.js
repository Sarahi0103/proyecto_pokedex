// Test rápido del endpoint de solicitudes enviadas
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { pool, getSentFriendRequests, getUserByEmail } = require('./lib/db');

async function testSentRequests() {
  console.log('\n🧪 TEST: Solicitudes Enviadas\n');
  
  try {
    // Obtener primer usuario
    const userResult = await pool.query('SELECT * FROM users LIMIT 1');
    if (userResult.rows.length === 0) {
      console.log('❌ No hay usuarios en la BD');
      await pool.end();
      return;
    }
    
    const user = userResult.rows[0];
    console.log(`👤 Usuario de prueba: ${user.name} (${user.email})`);
    
    // Verificar solicitudes enviadas
    console.log('\n📤 Buscando solicitudes enviadas...');
    const sentRequests = await getSentFriendRequests(user.id);
    
    console.log(`\n📊 Resultado:`);
    console.log(`   Total: ${sentRequests.length} solicitud(es) enviada(s)\n`);
    
    if (sentRequests.length > 0) {
      console.log('📋 Solicitudes:');
      sentRequests.forEach((req, index) => {
        console.log(`   ${index + 1}. Para: ${req.name} (${req.email})`);
        console.log(`      Código: ${req.code}`);
        console.log(`      Enviada: ${req.created_at}\n`);
      });
    } else {
      console.log('ℹ️  No hay solicitudes enviadas pendientes\n');
    }
    
    // Ver todas las solicitudes en la tabla
    console.log('📋 Todas las solicitudes en BD:');
    const allFriends = await pool.query(`
      SELECT 
        f.id,
        u1.name as sender,
        u2.name as receiver,
        f.status,
        f.created_at
      FROM friends f
      JOIN users u1 ON f.user_id = u1.id
      JOIN users u2 ON f.friend_id = u2.id
      ORDER BY f.created_at DESC
      LIMIT 10
    `);
    
    if (allFriends.rows.length > 0) {
      console.log(`\n   Total: ${allFriends.rows.length} relación(es):\n`);
      allFriends.rows.forEach(row => {
        console.log(`   ${row.sender} → ${row.receiver} [${row.status}]`);
      });
      console.log('');
    } else {
      console.log('   No hay relaciones de amistad\n');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
    console.log('\n✅ Test completado\n');
  }
}

testSentRequests();
