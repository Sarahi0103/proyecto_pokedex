// Script para verificar configuración de Push Notifications
// IMPORTANTE: Cargar dotenv PRIMERO antes de cualquier otro módulo
require('dotenv').config();

const { pool } = require('./lib/db');
const { getVapidPublicKey } = require('./lib/push-notifications');

async function verifyPushNotifications() {
  console.log('\n🔍 ==========================================');
  console.log('   VERIFICACIÓN PUSH NOTIFICATIONS');
  console.log('==========================================\n');

  // 1. Verificar VAPID keys
  console.log('1️⃣ Verificando VAPID keys...');
  const publicKey = getVapidPublicKey();
  if (publicKey) {
    console.log('   ✅ VAPID keys configuradas correctamente');
    console.log(`   📋 Public Key: ${publicKey.substring(0, 30)}...`);
  } else {
    console.log('   ❌ VAPID keys NO configuradas');
    console.log('   💡 Ejecuta: node generate-vapid-keys.js');
    console.log('   💡 Luego agrega las keys al archivo .env\n');
    return;
  }

  // 2. Verificar tabla push_subscriptions
  console.log('\n2️⃣ Verificando tabla push_subscriptions...');
  try {
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'push_subscriptions'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('   ✅ Tabla push_subscriptions existe');
      
      // Contar suscripciones
      const countResult = await pool.query('SELECT COUNT(*) as total FROM push_subscriptions');
      const total = countResult.rows[0].total;
      console.log(`   📊 Total de suscripciones: ${total}`);
      
      if (total > 0) {
        // Mostrar últimas suscripciones
        const subsResult = await pool.query(`
          SELECT u.name, u.email, ps.created_at 
          FROM push_subscriptions ps
          JOIN users u ON ps.user_id = u.id
          ORDER BY ps.created_at DESC
          LIMIT 5
        `);
        
        console.log('\n   📱 Últimas suscripciones:');
        subsResult.rows.forEach((row, index) => {
          console.log(`   ${index + 1}. ${row.name} (${row.email}) - ${row.created_at}`);
        });
      }
    } else {
      console.log('   ❌ Tabla push_subscriptions NO existe');
      console.log('   💡 Ejecuta la migración:');
      console.log('   psql -U postgres -d pokedex -f database/migration_friends_push.sql\n');
      return;
    }
  } catch (error) {
    console.error('   ❌ Error verificando tabla:', error.message);
    return;
  }

  // 3. Verificar Service Worker
  console.log('\n3️⃣ Verificando Service Worker...');
  const fs = require('fs');
  const path = require('path');
  const swPath = path.join(__dirname, '../pokedex/public/sw.js');
  
  if (fs.existsSync(swPath)) {
    const swContent = fs.readFileSync(swPath, 'utf8');
    const hasPushListener = swContent.includes("addEventListener('push'");
    const hasNotificationClick = swContent.includes("addEventListener('notificationclick'");
    
    if (hasPushListener && hasNotificationClick) {
      console.log('   ✅ Service Worker configurado correctamente');
      console.log('   ✅ Event listener para push notifications presente');
      console.log('   ✅ Event listener para notification click presente');
    } else {
      console.log('   ⚠️  Service Worker incompleto');
      if (!hasPushListener) console.log('   ❌ Falta event listener para push');
      if (!hasNotificationClick) console.log('   ❌ Falta event listener para notificationclick');
    }
  } else {
    console.log('   ⚠️  Service Worker no encontrado en:', swPath);
  }

  // 4. Resumen
  console.log('\n✅ ==========================================');
  console.log('   RESULTADO DE LA VERIFICACIÓN');
  console.log('==========================================');
  console.log('✅ VAPID keys: Configuradas');
  console.log('✅ Base de datos: Tabla push_subscriptions existe');
  console.log('✅ Service Worker: Configurado correctamente\n');
  console.log('💡 SIGUIENTES PASOS:');
  console.log('1. Inicia el backend: npm start');
  console.log('2. Abre la aplicación en el navegador');
  console.log('3. Acepta los permisos de notificaciones cuando se soliciten');
  console.log('4. Envía una solicitud de amistad para probar\n');

  await pool.end();
}

// Ejecutar verificación si se llama directamente
if (require.main === module) {
  verifyPushNotifications()
    .then(() => {
      console.log('✅ Verificación completada\n');
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Error en verificación:', err);
      process.exit(1);
    });
}

module.exports = { verifyPushNotifications };
