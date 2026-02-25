# 🔔 Sistema de Push Notifications - Pokedex PWA

## 📋 Descripción

Sistema completo de notificaciones push implementado con Web Push API y Service Workers. Permite enviar notificaciones en tiempo real a los usuarios cuando:

- **Reciben una invitación de amistad** 👥
- **Son retados a una batalla** ⚔️
- **Su reto de batalla es aceptado** ✅

## 🏗️ Arquitectura del Sistema

### Backend (Node.js + Express)

1. **Módulo de Push Notifications** (`BE/lib/push-notifications.js`)
   - Gestión de suscripciones de usuarios
   - Envío de notificaciones push con `web-push`
   - Funciones especializadas para cada tipo de notificación
   - Almacenamiento en memoria de suscripciones (Map)

2. **Endpoints REST API**
   - `GET /api/push/vapid-public-key` - Obtener clave pública VAPID
   - `POST /api/push/subscribe` - Suscribirse a notificaciones
   - `POST /api/push/unsubscribe` - Desuscribirse
   - `GET /api/push/stats` - Estadísticas de suscripciones

3. **Integración en eventos**
   - Invitación de amistad: `POST /api/friends/add`
   - Reto de batalla: `POST /api/battles/challenge`
   - Batalla aceptada: `POST /api/battles/:battleId/accept`

### Frontend (Vue 3 + PWA)

1. **Service Worker** (`pokedex/public/sw.js`)
   - Listener de eventos `push` para recibir notificaciones
   - Listener de `notificationclick` para manejar clics
   - Listener de `notificationclose` para tracking
   - Soporte para acciones en notificaciones

2. **Composable** (`src/composables/usePushNotifications.js`)
   - Hook de Vue para gestionar suscripciones
   - Verificación de soporte del navegador
   - Solicitud de permisos
   - Conversión de VAPID keys

3. **Componente UI** (`src/components/PushNotificationToggle.vue`)
   - Toggle para activar/desactivar notificaciones
   - Feedback visual del estado
   - Manejo de errores

## 📦 Dependencias

### Backend
```json
{
  "web-push": "^3.6.7"
}
```

Instalar con:
```bash
cd BE
npm install web-push
```

## 🔐 Configuración VAPID Keys

Las VAPID keys son necesarias para identificar tu aplicación con los servicios de push.

### 1. Generar las keys

```bash
cd BE
node generate-vapid-keys.js
```

Esto generará output como:
```
✅ VAPID keys generadas correctamente!

📋 Agrega estas líneas a tu archivo .env:

VAPID_PUBLIC_KEY=BKLI_xE4Ubca8iBe8SlPsWn_ZHIEVdf9WnG4CT79qLHcONHR-JsQYO1rPHuIoZIPcFigRTe2xioxR4SkTDcXLkI
VAPID_PRIVATE_KEY=RzWob8QACjt5ECTU3n2TIcoIZcTHnmKAoANnnwCpIjw
VAPID_SUBJECT=mailto:your-email@example.com
```

### 2. Agregar al archivo .env

Crea o edita el archivo `BE/.env`:

```env
# Push Notifications (VAPID)
VAPID_PUBLIC_KEY=tu_clave_publica_aqui
VAPID_PRIVATE_KEY=tu_clave_privada_aqui
VAPID_SUBJECT=mailto:tu-email@example.com
```

⚠️ **IMPORTANTE**: 
- No compartas estas claves
- No las subas a repositorios públicos
- Usa claves diferentes para desarrollo y producción

## 🚀 Uso

### En el Frontend

#### 1. Importar el componente

```vue
<script setup>
import PushNotificationToggle from '@/components/PushNotificationToggle.vue';
</script>

<template>
  <div>
    <h2>Configuración</h2>
    <PushNotificationToggle />
  </div>
</template>
```

#### 2. O usar el composable directamente

```vue
<script setup>
import { usePushNotifications } from '@/composables/usePushNotifications';

const { isSupported, isSubscribed, subscribe, unsubscribe } = usePushNotifications();

async function toggleNotifications() {
  if (isSubscribed.value) {
    await unsubscribe();
  } else {
    await subscribe();
  }
}
</script>
```

### En el Backend

#### Enviar notificación personalizada

```javascript
const { sendPushNotification } = require('./lib/push-notifications');

// Enviar notificación personalizada
await sendPushNotification(userId, {
  title: '🎉 ¡Felicidades!',
  body: 'Has capturado un Pokémon legendario',
  icon: '/icons/icon-192.png',
  badge: '/icons/icon-72.png',
  tag: 'achievement',
  data: {
    type: 'achievement',
    url: '/achievements'
  }
});
```

## 📱 Tipos de Notificaciones

### 1. Invitación de Amistad
```javascript
sendFriendRequestNotification(userId, friendName)
```
- **Título**: "👥 Nueva solicitud de amistad"
- **Cuerpo**: "{friendName} quiere ser tu amigo en Pokedex!"
- **Redirección**: `/friends`

### 2. Reto de Batalla
```javascript
sendBattleChallengeNotification(userId, challengerName, battleId)
```
- **Título**: "⚔️ Nuevo reto de batalla"
- **Cuerpo**: "{challengerName} te ha retado a una batalla!"
- **Acciones**: 
  - Aceptar
  - Ver detalles
- **Redirección**: `/battle?id={battleId}`

### 3. Batalla Aceptada
```javascript
sendBattleAcceptedNotification(userId, opponentName, battleId)
```
- **Título**: "⚔️ Batalla aceptada"
- **Cuerpo**: "{opponentName} ha aceptado tu desafío!"
- **Redirección**: `/battle?id={battleId}`

## 🔧 Service Worker - Eventos

### Push Event
```javascript
self.addEventListener('push', event => {
  const data = event.data.json();
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    data: data.data,
    actions: data.actions
  });
});
```

### Notification Click
```javascript
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  // Abrir o enfocar ventana
  clients.openWindow(event.notification.data.url);
});
```

## 🧪 Pruebas

### 1. Verificar soporte del navegador

```javascript
if ('serviceWorker' in navigator && 'PushManager' in window) {
  console.log('✅ Push notifications soportadas');
} else {
  console.log('❌ Push notifications no soportadas');
}
```

### 2. Verificar permiso

```javascript
console.log('Permiso actual:', Notification.permission);
// Valores: 'default', 'granted', 'denied'
```

### 3. Probar notificación desde backend

Puedes usar el siguiente script de prueba:

```javascript
// test-push.js
const { sendPushNotification } = require('./lib/push-notifications');

const userId = 1; // ID del usuario de prueba

sendPushNotification(userId, {
  title: '🧪 Notificación de Prueba',
  body: 'Si ves esto, ¡las push notifications funcionan!',
  icon: '/icons/icon-192x192.png',
  data: { url: '/' }
}).then(result => {
  console.log('Resultado:', result);
});
```

## 📊 Estadísticas

Obtener información sobre suscripciones:

```bash
curl http://localhost:4000/api/push/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Respuesta:
```json
{
  "totalUsers": 5,
  "totalSubscriptions": 7
}
```

## 🔍 Debug

### Logs importantes

El sistema incluye logs detallados:

```
📱 Nueva suscripción guardada para usuario 1
📤 Push enviado a usuario 2
✅ Push notification enviada correctamente
⚠️  Push notification no enviada (usuario sin suscripción)
❌ Error enviando push: ...
```

### Chrome DevTools

1. Abrir DevTools (F12)
2. Application > Service Workers
3. Ver "Push" para simular notificaciones
4. Application > Push Notification para ver suscripciones

### Firefox DevTools

1. Abrir DevTools (F12)
2. Consola > Service Workers
3. about:debugging#/runtime/this-firefox

## 🌐 Navegadores Soportados

| Navegador | Desktop | Mobile |
|-----------|---------|---------|
| Chrome    | ✅ 42+  | ✅ 42+ |
| Firefox   | ✅ 44+  | ✅ 48+ |
| Safari    | ✅ 16+  | ✅ 16.4+ |
| Edge      | ✅ 17+  | ✅ 17+ |
| Opera     | ✅ 37+  | ✅ 37+ |

## 📝 Consideraciones de Producción

### 1. Base de Datos persistente
El sistema actual guarda suscripciones en memoria (Map). Para producción:
- Migrar a PostgreSQL o MongoDB
- Crear tabla `push_subscriptions`
- Relacionar con usuarios

### 2. Seguridad
- Validar y sanitizar datos de suscripciones
- Implementar rate limiting en endpoints de push
- Rotar VAPID keys periódicamente

### 3. Escalabilidad
- Usar queue system (Redis, RabbitMQ) para envíos masivos
- Implementar retry logic para fallos
- Cachear VAPID keys

### 4. Analytics
- Trackear tasa de apertura de notificaciones
- Medir engagement por tipo de notificación
- A/B testing de mensajes

## 🐛 Troubleshooting

### "Push notifications not supported"
- Verificar que el sitio use HTTPS (o localhost)
- Verificar que Service Worker esté registrado
- Comprobar que el navegador soporte Push API

### "Permission denied"
- El usuario negó permisos
- Limpiar permisos: Chrome > Configuración > Privacidad > Configuración del sitio
- Solicitar permisos nuevamente

### "Subscription failed"
- Verificar VAPID keys en .env
- Verificar que el servidor esté corriendo
- Comprobar logs del backend

### No se reciben notificaciones
- Verificar que la suscripción esté activa
- Comprobar que el Service Worker esté activo
- Verificar logs del servidor al enviar
- Verificar que no esté en modo "No molestar"

## 📚 Referencias

- [Web Push Protocol](https://datatracker.ietf.org/doc/html/rfc8030)
- [Push API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [web-push npm](https://www.npmjs.com/package/web-push)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

## ✅ Checklist de Implementación

- [x] Instalar dependencia `web-push`
- [x] Generar VAPID keys
- [x] Configurar archivo .env
- [x] Crear módulo push-notifications.js
- [x] Agregar endpoints REST API
- [x] Actualizar Service Worker
- [x] Crear composable usePushNotifications
- [x] Crear componente PushNotificationToggle
- [x] Integrar en invitaciones de amistad
- [x] Integrar en retos de batalla
- [ ] Agregar componente en vista de configuración
- [ ] Agregar tabla en base de datos (producción)
- [ ] Implementar analytics de notificaciones
- [ ] Testing en diferentes navegadores

## 🎯 Próximos Pasos

1. **Agregar más tipos de notificaciones**:
   - Pokemon capturado
   - Logro desbloqueado
   - Amigo conectado

2. **Mejorar UX**:
   - Configuración granular (qué notificaciones recibir)
   - Horarios de "No molestar"
   - Sonidos personalizados

3. **Funcionalidades avanzadas**:
   - Notificaciones programadas
   - Notificaciones basadas en ubicación
   - Rich notifications con imágenes

---

**Desarrollado por**: Tu Nombre
**Fecha**: Febrero 2026
**Versión**: 1.0.0
