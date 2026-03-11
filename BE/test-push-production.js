// Test Completo - Verificar Push Notifications en Producción
const API_URL = 'https://pokedex-backend-rzjl.onrender.com';

// Usuario de prueba (el que está logueado)
const userEmail = 'laura@gmail.com'; // Cambia por tu email
const userPassword = 'tu_password'; // Cambia por tu password

async function testPushSystem() {
  console.log('🔍 DIAGNÓSTICO COMPLETO DEL SISTEMA PUSH\n');

  try {
    // Paso 1: Login
    console.log('📝 Paso 1: Iniciando sesión...');
    const loginRes = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userEmail, password: userPassword })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log('✅ Login exitoso:', loginData.user.name);

    // Paso 2: Verificar endpoint VAPID
    console.log('\n📝 Paso 2: Verificando endpoint VAPID...');
    const vapidRes = await fetch(`${API_URL}/api/push/vapid-public-key`);
    if (vapidRes.ok) {
      const vapidData = await vapidRes.json();
      console.log('✅ Endpoint VAPID disponible');
      console.log('   Public Key:', vapidData.publicKey.substring(0, 20) + '...');
    } else {
      console.log('❌ Endpoint VAPID NO disponible:', vapidRes.status);
      return;
    }

    // Paso 3: Verificar endpoint de suscripción
    console.log('\n📝 Paso 3: Verificando endpoint de suscripción...');
    const subRes = await fetch(`${API_URL}/api/push/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        subscription: {
          endpoint: 'https://test-endpoint.com',
          keys: {
            p256dh: 'test-p256dh-key',
            auth: 'test-auth-key'
          }
        }
      })
    });

    if (subRes.ok) {
      console.log('✅ Endpoint /api/push/subscribe está funcionando');
    } else if (subRes.status === 404) {
      console.log('❌ ERROR 404: Endpoint /api/push/subscribe NO EXISTE');
      console.log('   Render NO se ha redespliegado con el código actualizado');
      console.log('   Verifica en: https://dashboard.render.com');
      return;
    } else {
      console.log('⚠️  Respuesta inesperada:', subRes.status);
    }

    // Paso 4: Verificar estado del sistema push
    console.log('\n📝 Paso 4: Verificando estado completo del sistema push...');
    const statusRes = await fetch(`${API_URL}/api/push/verify`);
    const statusData = await statusRes.json();
    
    console.log('\n📊 ESTADO DEL SISTEMA PUSH:');
    console.log('   Base de datos conectada:', statusData.database_connected);
    console.log('   Tabla push_subscriptions existe:', statusData.push_subscriptions_table_exists);
    console.log('   Total suscripciones:', statusData.total_subscriptions);
    console.log('   VAPID configurado:', statusData.vapid.configured);
    console.log('   Sistema listo:', statusData.ready_for_push);

    if (!statusData.ready_for_push) {
      console.log('\n⚠️  SISTEMA NO ESTÁ LISTO:');
      if (!statusData.vapid.configured) {
        console.log('   ❌ Variables VAPID no configuradas en Render');
        console.log('   → Ve a Dashboard → Environment → Agrega VAPID_PUBLIC_KEY y VAPID_PRIVATE_KEY');
      }
      if (!statusData.push_subscriptions_table_exists) {
        console.log('   ❌ Tabla push_subscriptions no existe');
        console.log('   → Ejecuta las migraciones de BD');
      }
      if (statusData.total_subscriptions === 0) {
        console.log('   ⚠️  No hay usuarios suscritos a notificaciones');
      }
    } else {
      console.log('\n✅ SISTEMA COMPLETAMENTE FUNCIONAL');
    }

    console.log('\n===========================================');
    console.log('RESUMEN:');
    console.log('===========================================');
    if (statusData.ready_for_push) {
      console.log('✅ Backend está actualizado y funcionando');
      console.log('✅ Endpoints push disponibles');
      console.log('✅ VAPID keys configuradas');
      console.log('\n👉 AHORA DEBES:');
      console.log('   1. Ir a: https://pokedex-frontend-yi14.onrender.com/friends');
      console.log('   2. Hacer clic en "Activar Notificaciones Push"');
      console.log('   3. Aceptar el permiso del navegador');
      console.log('   4. Probar enviando una solicitud de amistad');
    } else {
      console.log('❌ Sistema push NO está listo');
      console.log('👉 Revisa el Dashboard de Render y verifica:');
      console.log('   1. Que el redespliegue terminó (debe decir "Live")');
      console.log('   2. Variables VAPID configuradas');
      console.log('   3. Logs sin errores');
    }

  } catch (error) {
    console.error('\n❌ Error en el diagnóstico:', error.message);
  }
}

// Ejecutar
testPushSystem();
