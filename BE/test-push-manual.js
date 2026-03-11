// Test manual de Push Notifications
require('dotenv').config();
const { pool, getPushSubscriptions } = require('./lib/db');
const { sendPushNotification, createFriendRequestPayload } = require('./lib/push-notifications');

async function testPushNotification() {
  console.log('\n🧪 ==========================================');
  console.log('   TEST MANUAL PUSH NOTIFICATIONS');
  console.log('==========================================\n');

  try {
    // 1. Listar usuarios con suscripciones
    console.log('1️⃣ Buscando usuarios con suscripciones...\n');
    
    const usersResult = await pool.query(`
      SELECT DISTINCT u.id, u.name, u.email, COUNT(ps.id) as subscriptions
      FROM users u
      LEFT JOIN push_subscriptions ps ON u.id = ps.user_id
      GROUP BY u.id, u.name, u.email
      HAVING COUNT(ps.id) > 0
      ORDER BY u.name
    `);
    
    if (usersResult.rows.length === 0) {
      console.log('❌ No hay usuarios con suscripciones push');
      console.log('💡 Abre la aplicación y acepta los permisos de notificaciones\n');
      await pool.end();
      return;
    }
    
    console.log(`✅ Encontrados ${usersResult.rows.length} usuario(s) con suscripciones:\n`);
    usersResult.rows.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - ${user.subscriptions} suscripción(es)`);
    });
    
    // 2. Seleccionar primer usuario para test
    const testUser = usersResult.rows[0];
    console.log(`\n2️⃣ Enviando notificación de prueba a: ${testUser.name}\n`);
    
    // 3. Obtener suscripciones del usuario
    const subs = await getPushSubscriptions(testUser.id);
    
    if (subs.length === 0) {
      console.log('❌ No se encontraron suscripciones (error de consulta)');
      await pool.end();
      return;
    }
    
    console.log(`📱 Suscripciones encontradas: ${subs.length}`);
    subs.forEach((sub, index) => {
      console.log(`   ${index + 1}. Endpoint: ${sub.endpoint.substring(0, 60)}...`);
    });
    
    // 4. Crear payload de prueba
    const payload = createFriendRequestPayload('Sistema de Prueba');
    console.log('\n📦 Payload de notificación:');
    console.log(JSON.stringify(payload, null, 2));
    
    // 5. Enviar notificación
    console.log('\n📤 Enviando notificación push...\n');
    const result = await sendPushNotification(subs, payload);
    
    console.log('\n📊 RESULTADO:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    if (result.success) {
      console.log('✅ NOTIFICACIÓN ENVIADA EXITOSAMENTE');
      console.log(`📤 ${result.results.filter(r => r.success).length} de ${result.results.length} suscripciones notificadas\n`);
      
      console.log('💡 ¿Recibiste la notificación en tu navegador?');
      console.log('   Si no la recibiste, verifica que:');
      console.log('   - El navegador tenga permisos de notificaciones');
      console.log('   - El Service Worker esté activo (F12 > Application > Service Workers)');
      console.log('   - No hayas cerrado todas las ventanas del navegador\n');
    } else {
      console.log('❌ ERROR AL ENVIAR NOTIFICACIÓN\n');
      console.log('Detalles de errores:');
      result.results.forEach((r, index) => {
        if (!r.success) {
          console.log(`\n${index + 1}. Endpoint: ${r.endpoint.substring(0, 50)}...`);
          console.log(`   Error: ${r.error}`);
        }
      });
      console.log('\n');
    }
    
    if (result.invalidEndpoints && result.invalidEndpoints.length > 0) {
      console.log('⚠️  Endpoints inválidos detectados (deberían eliminarse):');
      result.invalidEndpoints.forEach(endpoint => {
        console.log(`   - ${endpoint.substring(0, 60)}...`);
      });
      console.log('\n');
    }
    
  } catch (error) {
    console.error('❌ Error en el test:', error);
  } finally {
    await pool.end();
    console.log('✅ Test completado\n');
  }
}

// Ejecutar test
testPushNotification()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error fatal:', err);
    process.exit(1);
  });
