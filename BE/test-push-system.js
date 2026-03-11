// Script de prueba rápida del sistema push
const { pool } = require('./lib/db');
const { getVapidPublicKey } = require('./lib/push-notifications');

async function testPushSystem() {
  console.log('\n🔍 ===== DIAGNÓSTICO RÁPIDO DEL SISTEMA PUSH =====\n');
  
  try {
    // 1. Verificar VAPID keys
    console.log('1️⃣ VAPID Keys:');
    const vapidKey = getVapidPublicKey();
    if (vapidKey) {
      console.log('   ✅ Configuradas correctamente');
      console.log(`   📍 Public Key: ${vapidKey.substring(0, 30)}...`);
    } else {
      console.log('   ❌ NO configuradas (revisa .env)');
    }
    
    // 2. Verificar tabla
    console.log('\n2️⃣ Tabla push_subscriptions:');
    try {
      const tableCheck = await pool.query(`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_name = 'push_subscriptions'
      `);
      
      if (tableCheck.rows[0].count > 0) {
        console.log('   ✅ Existe');
      } else {
        console.log('   ❌ NO existe (ejecuta la migración)');
      }
    } catch (err) {
      console.log('   ❌ Error verificando tabla');
    }
    
    // 3. Contar suscripciones
    console.log('\n3️⃣ Suscripciones activas:');
    try {
      const subsResult = await pool.query('SELECT COUNT(*) as count FROM push_subscriptions');
      const count = subsResult.rows[0].count;
      
      if (count > 0) {
        console.log(`   ✅ ${count} usuario(s) suscrito(s)`);
        
        // Mostrar detalles
        const details = await pool.query(`
          SELECT 
            ps.id,
            ps.user_id,
            u.name,
            u.email,
            ps.created_at
          FROM push_subscriptions ps
          JOIN users u ON ps.user_id = u.id
          ORDER BY ps.created_at DESC
        `);
        
        console.log('\n   📋 Detalles:');
        details.rows.forEach((sub, index) => {
          console.log(`   ${index + 1}. ${sub.name} (${sub.email})`);
          console.log(`      User ID: ${sub.user_id} | Suscrito: ${sub.created_at}`);
        });
      } else {
        console.log('   ⚠️  0 suscripciones - Ningún usuario ha activado notificaciones');
        console.log('   💡 Sigue estos pasos:');
        console.log('      1. Abre http://localhost:3000');
        console.log('      2. Inicia sesión');
        console.log('      3. Haz clic en "Activar Notificaciones" en el banner amarillo');
        console.log('      4. Acepta el popup del navegador');
      }
    } catch (err) {
      console.log('   ❌ Error contando suscripciones');
    }
    
    // 4. Verificar usuarios disponibles
    console.log('\n4️⃣ Usuarios registrados:');
    const usersResult = await pool.query('SELECT COUNT(*) as count FROM users');
    const userCount = usersResult.rows[0].count;
    console.log(`   📊 ${userCount} usuario(s) en la BD`);
    
    if (userCount > 0) {
      const users = await pool.query('SELECT id, name, email, code FROM users ORDER BY id LIMIT 5');
      console.log('\n   👥 Primeros 5 usuarios:');
      users.rows.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.name} - ${user.email}`);
        console.log(`      Código: ${user.code}`);
      });
    }
    
    // 5. Estado del sistema
    console.log('\n5️⃣ Estado del Sistema:');
    if (vapidKey && subsResult.rows[0].count > 0) {
      console.log('   ✅ SISTEMA FUNCIONANDO CORRECTAMENTE');
      console.log('   💡 Las notificaciones push están listas para usar');
    } else if (vapidKey && subsResult.rows[0].count === 0) {
      console.log('   ⚠️  SISTEMA CONFIGURADO, SIN SUSCRIPCIONES');
      console.log('   💡 Los usuarios necesitan activar las notificaciones');
      console.log('   📱 Van a ver un banner amarillo al entrar a la app');
    } else {
      console.log('   ❌ SISTEMA INCOMPLETO');
      console.log('   💡 Revisa la documentación en SISTEMA_PUSH_AUTOMATICO.md');
    }
    
    console.log('\n===============================================\n');
    
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error.message);
  } finally {
    await pool.end();
  }
}

testPushSystem();
