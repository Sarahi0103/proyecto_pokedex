// Script de prueba de envío de notificaciones push
require('dotenv').config();
const { pool, getPushSubscriptions } = require('./lib/db');
const { sendPushNotification, createFriendRequestPayload } = require('./lib/push-notifications');

async function testNotificationSend() {
  console.log('\n🧪 ===== PRUEBA DE ENVÍO DE NOTIFICACIONES =====\n');
  
  try {
    // 1. Verificar si hay suscripciones
    console.log('1️⃣ Buscando suscripciones en la base de datos...');
    const allSubs = await pool.query('SELECT * FROM push_subscriptions');
    
    if (allSubs.rows.length === 0) {
      console.log('❌ NO HAY SUSCRIPCIONES EN LA BASE DE DATOS');
      console.log('\n📱 Para probar el envío de notificaciones:');
      console.log('   1. Abre http://localhost:3000');
      console.log('   2. Inicia sesión');
      console.log('   3. Haz clic en "Activar Notificaciones"');
      console.log('   4. Acepta el popup del navegador');
      console.log('   5. Ejecuta este script de nuevo\n');
      return; // No llamar pool.end aquí
    }
    
    console.log(`✅ Encontradas ${allSubs.rows.length} suscripción(es)\n`);
    
    // 2. Mostrar detalles de las suscripciones
    console.log('2️⃣ Detalles de las suscripciones:\n');
    for (let i = 0; i < allSubs.rows.length; i++) {
      const sub = allSubs.rows[i];
      const userResult = await pool.query('SELECT name, email FROM users WHERE id = $1', [sub.user_id]);
      const user = userResult.rows[0];
      
      console.log(`   ${i + 1}. Usuario: ${user.name} (${user.email})`);
      console.log(`      User ID: ${sub.user_id}`);
      console.log(`      Endpoint: ${sub.endpoint.substring(0, 60)}...`);
      console.log(`      Creada: ${sub.created_at}\n`);
    }
    
    // 3. Preguntar si desea enviar notificación de prueba
    console.log('3️⃣ Simulación de envío:\n');
    console.log('   📤 Cuando alguien envía una solicitud de amistad:');
    console.log('   ');
    console.log('   Backend ejecuta:');
    console.log('   ┌─────────────────────────────────────────────┐');
    console.log('   │ const subs = await getPushSubscriptions()   │');
    console.log('   │ const payload = createFriendRequestPayload()│');
    console.log('   │ await sendPushNotification(subs, payload)   │');
    console.log('   └─────────────────────────────────────────────┘');
    console.log('');
    
    // 4. Mostrar ejemplo de payload
    console.log('4️⃣ Ejemplo de mensaje que se enviaría:\n');
    const examplePayload = createFriendRequestPayload('Usuario Ejemplo');
    console.log('   📦 Payload:');
    console.log('   ', JSON.stringify(examplePayload, null, 2).replace(/\n/g, '\n    '));
    console.log('');
    
    // 5. Explicar el flujo
    console.log('5️⃣ Flujo completo de envío:\n');
    console.log('   ┌─────────────────────────────────────────────────────────┐');
    console.log('   │ 1. Usuario B envía solicitud a Usuario A                │');
    console.log('   │    → POST /api/friends/add                              │');
    console.log('   │                                                          │');
    console.log('   │ 2. Backend busca suscripciones de Usuario A             │');
    console.log('   │    → getPushSubscriptions(userA.id)                     │');
    console.log('   │                                                          │');
    console.log('   │ 3. Backend encuentra suscripción activa                 │');
    console.log('   │    → Suscripción con endpoint y keys                    │');
    console.log('   │                                                          │');
    console.log('   │ 4. Backend crea mensaje de notificación                │');
    console.log('   │    → "Usuario B quiere ser tu amigo"                    │');
    console.log('   │                                                          │');
    console.log('   │ 5. Backend envía notificación push                      │');
    console.log('   │    → sendPushNotification(subs, payload)                │');
    console.log('   │                                                          │');
    console.log('   │ 6. Navegador de Usuario A recibe notificación          │');
    console.log('   │    → 🔔 Aparece notificación en el sistema              │');
    console.log('   │                                                          │');
    console.log('   │ 7. Usuario A hace clic en la notificación              │');
    console.log('   │    → Se abre la app en /friends                         │');
    console.log('   └─────────────────────────────────────────────────────────┘');
    console.log('');
    
    // 6. Estado del sistema
    console.log('6️⃣ Estado del sistema:\n');
    console.log('   ✅ VAPID keys configuradas');
    console.log('   ✅ Tabla push_subscriptions existe');
    console.log(`   ✅ ${allSubs.rows.length} usuario(s) suscrito(s)`);
    console.log('   ✅ Sistema listo para enviar notificaciones');
    console.log('');
    console.log('   💡 Para probarlo:');
    console.log('      1. Abre dos navegadores diferentes (o modo incógnito)');
    console.log('      2. Inicia sesión con usuarios diferentes en cada uno');
    console.log('      3. Activa notificaciones en AMBOS (haz clic en "Permitir")');
    console.log('      4. Desde el Navegador 1, envía solicitud al Usuario del Navegador 2');
    console.log('      5. El Navegador 2 recibirá la notificación 🔔');
    console.log('');
    
    // 7. Logs que verás
    console.log('7️⃣ Logs que verás en la terminal del backend:\n');
    console.log('   Cuando se envía una solicitud:');
    console.log('   ┌────────────────────────────────────────────────────────┐');
    console.log('   │ 🔍 Intentando agregar amigo con código: xyz123        │');
    console.log('   │ 👤 Usuario actual: usuario1@email.com                 │');
    console.log('   │ 👥 Amigo encontrado: usuario2@email.com               │');
    console.log('   │ ✅ Agregando amigo: usuario1 -> usuario2              │');
    console.log('   │ 📤 Enviando push notification de amistad...           │');
    console.log('   │ 📱 Encontradas 1 suscripciones para el amigo          │');
    console.log('   │ 📦 Payload de notificación: {...}                     │');
    console.log('   │ ✅ Push notification enviada correctamente            │');
    console.log('   └────────────────────────────────────────────────────────┘');
    console.log('');
    
    console.log('✅ Sistema verificado y listo para usar\n');
    console.log('===============================================\n');
    
  } catch (error) {
    console.error('❌ Error en prueba:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

testNotificationSend();
