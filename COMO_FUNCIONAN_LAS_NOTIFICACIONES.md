# 🔔 ¿Cómo Funciona el Envío de Notificaciones?

## ✅ Respuesta Corta: SÍ, se envían automáticamente

Cuando tienes las notificaciones activadas en tu navegador (suscrito), **el sistema ENVÍA automáticamente** una notificación push cuando alguien te envía una solicitud de amistad.

## 📋 Flujo Completo del Sistema

### 1️⃣ **Usuario A activa notificaciones**
```
Usuario A → Hace clic en "Permitir" 
         → Navegador crea suscripción
         → Frontend envía suscripción al backend
         → Backend guarda en push_subscriptions
         ✅ Usuario A está suscrito
```

### 2️⃣ **Usuario B envía solicitud a Usuario A**
```
Usuario B → Ingresa código de Usuario A
         → Hace clic en "Agregar Amigo"
         → Backend recibe POST /api/friends/add
         → Backend guarda la solicitud en tabla friends
         📤 Backend busca suscripciones de Usuario A
         → Encuentra suscripción activa
         → Crea payload de notificación
         → Envía notificación push
         🔔 Usuario A recibe notificación en su navegador
```

### 3️⃣ **Usuario A recibe la notificación**
```
🔔 Notificación aparece en el navegador:
   "Nueva Solicitud de Amistad"
   "Usuario B quiere ser tu amigo"
   
Usuario A → Ve la notificación
         → Hace clic en la notificación
         → Se abre la app en la página Friends
         → Ve la solicitud en "Solicitudes Recibidas"
         → Acepta o rechaza
```

## 🔍 Código Exacto que Envía las Notificaciones

**Archivo:** `BE/index.js` - Líneas 732-751

```javascript
// Enviar push notification al amigo
console.log('📤 Enviando push notification de amistad...');
try {
  const subs = await getPushSubscriptions(friend.id); // Busca suscripciones
  if (subs && subs.length > 0) {
    console.log(`📱 Encontradas ${subs.length} suscripciones para el amigo`);
    const payload = createFriendRequestPayload(user.name); // Crea mensaje
    console.log('📦 Payload de notificación:', JSON.stringify(payload));
    const result = await sendPushNotification(subs, payload); // ENVÍA
    if (result.success) {
      console.log('✅ Push notification enviada correctamente');
    } else {
      console.log('⚠️  No se pudo enviar la notificación:', result);
    }
  } else {
    console.log('⚠️  Usuario sin suscripción push');
  }
} catch (err) {
  console.error('❌ Error enviando push notification:', err);
}
```

**Este código se ejecuta AUTOMÁTICAMENTE cada vez que alguien envía una solicitud de amistad.**

## 📊 Condiciones para que SE ENVÍE la Notificación

### ✅ Requisitos:
1. **Usuario receptor tiene suscripción activa** (hizo clic en "Permitir")
2. **Suscripción guardada en la BD** (tabla push_subscriptions)
3. **Backend encuentra la suscripción** (getPushSubscriptions devuelve datos)
4. **VAPID keys configuradas** (.env tiene las keys)
5. **Service Worker activo en el navegador** (sw.js funcionando)

### ❌ NO se envía si:
- Usuario receptor NO activó notificaciones (0 suscripciones en BD)
- Usuario receptor bloqueó notificaciones en su navegador
- Service Worker no está registrado
- VAPID keys no configuradas

## 🧪 Cómo Verificar que Funciona

### **Paso 1: Verifica que tu sistema está configurado**
```bash
cd BE
node test-push-system.js
```

Debe decir:
```
1️⃣ VAPID Keys: ✅ Configuradas correctamente
2️⃣ Tabla push_subscriptions: ✅ Existe
```

### **Paso 2: Activa notificaciones en el navegador**
1. Abre `http://localhost:3000`
2. Inicia sesión
3. Verás el **banner amarillo** o la **tarjeta en Friends**
4. Haz clic en **"Activar Notificaciones"**
5. En el popup del navegador, haz clic en **"Permitir"**

### **Paso 3: Verifica que quedaste suscrito**
```bash
cd BE
node test-push-system.js
```

Ahora debe decir:
```
3️⃣ Suscripciones activas: ✅ 1 usuario(s) suscrito(s)
```

### **Paso 4: Prueba el envío**
1. **Abre un segundo navegador** (modo incógnito)
2. Inicia sesión con OTRO usuario
3. Ve a "Agregar Amigos"
4. Ingresa TU código
5. Haz clic en "Agregar Amigo"

**En tu primer navegador/dispositivo deberías recibir:**
```
🔔 Nueva Solicitud de Amistad
   [Nombre del Usuario] quiere ser tu amigo
```

### **Paso 5: Verifica en la terminal del backend**

Cuando el Usuario B envía la solicitud, verás:
```
🔍 Intentando agregar amigo con código: 3utn3uw
👤 Usuario actual: usuario2@pokedex.com | Código: xyz123
👥 Amigo encontrado: usuario1@pokedex.com
✅ Agregando amigo: usuario2@pokedex.com -> usuario1@pokedex.com
📤 Enviando push notification de amistad...
📱 Encontradas 1 suscripciones para el amigo
📦 Payload de notificación: {"title":"Nueva Solicitud...","body":"..."}
✅ Push notification enviada correctamente
👥 Total amigos: 1
```

## 🎯 Respuesta a tu Pregunta

> **"¿Pero aún así te manda la notificación si ya en el navegador está activo?"**

**SÍ, EXACTO.** Si ya activaste las notificaciones en el navegador (hiciste clic en "Permitir"), entonces:

1. ✅ Tu suscripción está guardada en la base de datos
2. ✅ Cuando alguien te envía solicitud, el backend AUTOMÁTICAMENTE:
   - Busca tu suscripción
   - Crea el mensaje
   - Lo envía a tu navegador
3. ✅ Tu navegador recibe la notificación y la muestra
4. ✅ Aunque tengas la pestaña cerrada o estés en otra app

**El navegador NO necesita estar abierto en esa pestaña.** Las notificaciones push funcionan **incluso con la app cerrada**.

## 🚀 Lo Único que Necesitas Hacer

**Para que TODO funcione:**

1. **Backend corriendo** → `cd BE; node index.js`
2. **Frontend corriendo** → `cd pokedex; npm run dev`
3. **Aceptar el popup "Permitir"** cuando te lo muestre el navegador

**Eso es todo.** El resto es automático.

## 🐛 Si NO Recibes Notificaciones

### Verifica:
1. **¿Está tu suscripción en la BD?**
   ```bash
   cd BE
   $env:PGPASSWORD='123'
   psql -U postgres -d pokedex -c "SELECT user_id FROM push_subscriptions;"
   ```
   Debe mostrar tu user_id.

2. **¿Tienes permisos en Chrome?**
   - Chrome: `chrome://settings/content/notifications`
   - Busca `localhost:3000`
   - Debe estar en "Permitir", NO en "Bloquear"

3. **¿El Service Worker está activo?**
   Abre consola (F12):
   ```javascript
   navigator.serviceWorker.getRegistration()
   ```
   Debe devolver un objeto.

4. **¿La terminal del backend muestra el envío?**
   Cuando alguien envía solicitud, debe aparecer:
   ```
   📤 Enviando push notification de amistad...
   📱 Encontradas 1 suscripciones para el amigo
   ✅ Push notification enviada correctamente
   ```

---

## 📝 Resumen Ejecutivo

| Pregunta | Respuesta |
|----------|-----------|
| ¿Se envían automáticamente? | ✅ SÍ |
| ¿Necesito hacer algo después de "Permitir"? | ❌ NO, es automático |
| ¿Funciona con la app cerrada? | ✅ SÍ |
| ¿Cuándo se envía? | Cuando alguien te envía solicitud de amistad |
| ¿Qué se envía? | Título: "Nueva Solicitud" + Nombre del usuario |
| ¿Dónde aparece? | En las notificaciones del sistema operativo |

**Tu sistema está 100% funcional. Solo necesitas activar las notificaciones en tu navegador.**
