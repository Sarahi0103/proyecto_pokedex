// Script de diagnóstico completo para Push Notifications
require('dotenv').config();
const { pool } = require('./lib/db');
const { getVapidPublicKey } = require('./lib/push-notifications');

async function diagnosticoPushNotifications() {
  console.log('\n🔍 ==========================================');
  console.log('   DIAGNÓSTICO COMPLETO PUSH NOTIFICATIONS');
  console.log('==========================================\n');

  let todosCorrecto = true;

  // 1. VAPID Keys
  console.log('1️⃣ Verificando VAPID Keys...');
  const publicKey = getVapidPublicKey();
  if (publicKey) {
    console.log('   ✅ VAPID keys configuradas');
    console.log(`   📋 Public Key: ${publicKey.substring(0, 40)}...\n`);
  } else {
    console.log('   ❌ VAPID keys NO configuradas');
    console.log('   💡 Solución: Verifica el archivo .env\n');
    todosCorrecto = false;
  }

  // 2. Conexión a Base de Datos
  console.log('2️⃣ Verificando conexión a base de datos...');
  try {
    await pool.query('SELECT NOW()');
    console.log('   ✅ Conexión exitosa\n');
  } catch (error) {
    console.log('   ❌ Error de conexión:', error.message);
    console.log('   💡 Solución: Verifica PostgreSQL esté corriendo\n');
    todosCorrecto = false;
    await pool.end();
    return;
  }

  // 3. Tabla push_subscriptions
  console.log('3️⃣ Verificando tabla push_subscriptions...');
  try {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'push_subscriptions'
      );
    `);
    
    if (result.rows[0].exists) {
      console.log('   ✅ Tabla existe\n');
    } else {
      console.log('   ❌ Tabla NO existe');
      console.log('   💡 Solución: Ejecuta la migración');
      console.log('   npm run migrate\n');
      todosCorrecto = false;
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message, '\n');
    todosCorrecto = false;
  }

  // 4. Usuarios en BD
  console.log('4️⃣ Verificando usuarios registrados...');
  try {
    const result = await pool.query('SELECT COUNT(*) as total FROM users');
    const total = parseInt(result.rows[0].total);
    
    if (total > 0) {
      console.log(`   ✅ ${total} usuario(s) registrado(s)`);
      
      const users = await pool.query('SELECT id, name, email FROM users LIMIT 5');
      console.log('   📋 Primeros usuarios:');
      users.rows.forEach(u => {
        console.log(`      • ${u.name} (${u.email})`);
      });
      console.log('');
    } else {
      console.log('   ⚠️  No hay usuarios registrados');
      console.log('   💡 Registra usuarios en /register\n');
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message, '\n');
  }

  // 5. Suscripciones Push
  console.log('5️⃣ Verificando suscripciones push activas...');
  try {
    const result = await pool.query(`
      SELECT u.name, u.email, ps.created_at
      FROM push_subscriptions ps
      JOIN users u ON ps.user_id = u.id
      ORDER BY ps.created_at DESC
    `);
    
    if (result.rows.length > 0) {
      console.log(`   ✅ ${result.rows.length} suscripción(es) activa(s)`);
      result.rows.forEach(row => {
        console.log(`      • ${row.name} (${row.email}) - ${row.created_at}`);
      });
      console.log('');
    } else {
      console.log('   ⚠️  NO hay usuarios suscritos a notificaciones');
      console.log('   💡 ACCIÓN REQUERIDA:');
      console.log('      1. Abre http://localhost:3000');
      console.log('      2. Inicia sesión');
      console.log('      3. Acepta el permiso de notificaciones');
      console.log('      4. Verifica la consola del navegador (F12)\n');
      todosCorrecto = false;
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message, '\n');
  }

  // 6. Service Worker
  console.log('6️⃣ Verificando Service Worker...');
  const fs = require('fs');
  const path = require('path');
  const swPath = path.join(__dirname, '../pokedex/public/sw.js');
  
  if (fs.existsSync(swPath)) {
    const swContent = fs.readFileSync(swPath, 'utf8');
    const hasPush = swContent.includes("addEventListener('push'");
    const hasClick = swContent.includes("addEventListener('notificationclick'");
    
    if (hasPush && hasClick) {
      console.log('   ✅ Service Worker correctamente configurado\n');
    } else {
      console.log('   ⚠️  Service Worker incompleto');
      if (!hasPush) console.log('      ❌ Falta event listener para push');
      if (!hasClick) console.log('      ❌ Falta event listener para notificationclick\n');
      todosCorrecto = false;
    }
  } else {
    console.log('   ❌ Service Worker no encontrado\n');
    todosCorrecto = false;
  }

  // Resumen Final
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  if (todosCorrecto) {
    console.log('✅ TODO CONFIGURADO CORRECTAMENTE');
    console.log('✅ El sistema está listo para enviar notificaciones\n');
    console.log('🎯 SIGUIENTE PASO:');
    console.log('   Envía una solicitud de amistad para probar\n');
  } else {
    console.log('⚠️  HAY PROBLEMAS QUE CORREGIR');
    console.log('   Revisa los mensajes anteriores\n');
  }

  await pool.end();
}

// Ejecutar
diagnosticoPushNotifications()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error fatal:', err);
    process.exit(1);
  });
