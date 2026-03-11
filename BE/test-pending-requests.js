// Test: Simular carga de solicitudes pendientes como el frontend
require('dotenv').config();
const { pool, getPendingFriendRequests, getUserByEmail } = require('./lib/db');

async function testPendingRequests() {
  console.log('\n🧪 ===== SIMULACIÓN: CARGA DE SOLICITUDES PENDIENTES =====\n');
  
  try {
    // Simular que hay una solicitud pendiente
    const users = await pool.query('SELECT id, name, email FROM users LIMIT 2');
    if (users.rows.length < 2) {
      console.log('❌ Necesitas al menos 2 usuarios');
      await pool.end();
      return;
    }
    
    const sender = users.rows[0];
    const receiver = users.rows[1];
    
    console.log('👤 Simulación:');
    console.log(`   Usuario A (emisor): ${sender.name} (${sender.email})`);
    console.log(`   Usuario B (receptor): ${receiver.name} (${receiver.email})\n`);
    
    // Limpiar solicitudes previas
    console.log('🧹 Limpiando solicitudes previas...');
    await pool.query(
      'DELETE FROM friends WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)',
      [sender.id, receiver.id]
    );
    
    // Usuario A envía solicitud a Usuario B
    console.log(`📤 Usuario A envía solicitud a Usuario B...`);
    await pool.query(
      `INSERT INTO friends (user_id, friend_id, status) VALUES ($1, $2, 'pending')`,
      [sender.id, receiver.id]
    );
    console.log('✅ Solicitud creada en BD\n');
    
    // Verificar en BD directamente
    console.log('🔍 Verificación directa en BD:');
    const dbCheck = await pool.query(
      'SELECT * FROM friends WHERE user_id = $1 AND friend_id = $2',
      [sender.id, receiver.id]
    );
    if (dbCheck.rows.length > 0) {
      console.log('   ✅ Solicitud existe en la BD');
      console.log(`   📋 Status: ${dbCheck.rows[0].status}\n`);
    } else {
      console.log('   ❌ Solicitud NO encontrada en BD\n');
    }
    
    // Ahora simular lo que hace el FRONTEND
    console.log('🌐 Simulando endpoint /api/friends/requests');
    console.log(`   Usuario logueado: ${receiver.email}\n`);
    
    // Llamar a la función que usa el backend
    console.log('📡 Llamando a getPendingFriendRequests()...');
    const requests = await getPendingFriendRequests(receiver.id);
    
    console.log(`\n📊 RESULTADO:`);
    console.log(`   Total solicitudes: ${requests.length}`);
    
    if (requests.length > 0) {
      console.log('\n   ✅✅✅ SOLICITUDES ENCONTRADAS:\n');
      requests.forEach((req, i) => {
        console.log(`   ${i + 1}. Solicitud de: ${req.name}`);
        console.log(`      Email: ${req.email}`);
        console.log(`      Código: ${req.code}`);
        console.log(`      ID: ${req.id}`);
        console.log(`      Friendship ID: ${req.friendship_id}`);
        console.log(`      Fecha: ${req.created_at}\n`);
      });
      
      console.log('📦 JSON que recibe el frontend:');
      console.log(JSON.stringify({ requests }, null, 2));
      console.log('');
      
      console.log('🎯 En el frontend:');
      console.log('   pendingRequests.value = requestsData.requests || []');
      console.log(`   pendingRequests.value = ${JSON.stringify(requests, null, 2)}`);
      console.log('');
      console.log(`   ✅ v-if="pendingRequests.length > 0" → TRUE`);
      console.log(`   ✅ Se mostrará la sección "Solicitudes Pendientes"`);
      
    } else {
      console.log('\n   ❌❌❌ NO HAY SOLICITUDES');
      console.log('   El array está vacío: []');
      console.log('   v-if="pendingRequests.length > 0" → FALSE');
      console.log('   La sección NO se mostrará en la interfaz\n');
      
      // Diagnosticar por qué
      console.log('🔍 Diagnóstico:');
      console.log('   ¿La solicitud existe en BD? Verificando...');
      const allPending = await pool.query(
        `SELECT * FROM friends WHERE friend_id = $1 AND status = 'pending'`,
        [receiver.id]
      );
      
      if (allPending.rows.length > 0) {
        console.log(`   ✅ Hay ${allPending.rows.length} solicitud(es) en BD con status='pending'`);
        console.log('   ❌ Pero getPendingFriendRequests() NO las devolvió');
        console.log('   💡 Problema en el JOIN o en la query\n');
      } else {
        console.log('   ❌ NO hay solicitudes con status=pending en la BD');
        console.log('   💡 El problema está en cómo se guardan las solicitudes\n');
      }
    }
    
    console.log('===============================================\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

testPendingRequests();
