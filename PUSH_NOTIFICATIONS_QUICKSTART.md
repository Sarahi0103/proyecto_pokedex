# 🔔 Push Notifications - Quick Start

## ⚡ Configuración Rápida (5 minutos)

### 1. Ya instaladas las dependencias ✅
```bash
cd BE
npm install web-push  # Ya ejecutado
```

### 2. VAPID Keys ya generadas ✅

Ya tenemos las keys generadas. Solo necesitas agregarlas al archivo `.env`:

```env
# Agregar estas líneas al archivo BE/.env:

VAPID_PUBLIC_KEY=BKLI_xE4Ubca8iBe8SlPsWn_ZHIEVdf9WnG4CT79qLHcONHR-JsQYO1rPHuIoZIPcFigRTe2xioxR4SkTDcXLkI
VAPID_PRIVATE_KEY=RzWob8QACjt5ECTU3n2TIcoIZcTHnmKAoANnnwCpIjw
VAPID_SUBJECT=mailto:your-email@example.com
```

### 3. Reiniciar el servidor

```bash
# Detener el servidor backend (Ctrl+C)
# Reiniciarlo:
cd BE
npm start
```

### 4. Probar las notificaciones

1. Abre la aplicación: `http://localhost:5173`
2. Verás un nuevo componente de **"Notificaciones Push"** en la página principal
3. Haz clic en **"Activar Notificaciones"**
4. Acepta los permisos en el navegador
5. ¡Listo! Ahora recibirás notificaciones cuando:
   - Alguien te agregue como amigo
   - Te reten a una batalla
   - Acepten tu reto de batalla

## 🧪 Prueba Manual

### Opción 1: Agregar un amigo

1. Crea dos usuarios (o usa dos navegadores/dispositivos)
2. Activa notificaciones en ambos
3. Agrega a uno como amigo usando su código
4. El segundo usuario recibirá una notificación push

### Opción 2: Retar a batalla

1. Crea dos usuarios con equipos
2. Activa notificaciones en el segundo usuario
3. Desde el primer usuario, reta al segundo a una batalla
4. El segundo usuario recibirá la notificación

## 🔍 Verificar que funciona

### En el backend (consola):
```
✅ Push Notifications configuradas correctamente
📱 Usuario Juan suscrito a push notifications
📤 Enviando push notification de amistad...
✅ Push notification enviada correctamente
```

### En el frontend (navegador):
- Verás aparecer una notificación del sistema
- Al hacer clic, te llevará a la página correspondiente

## 🎯 Archivos Modificados/Creados

```
BE/
  ├── lib/push-notifications.js          ✅ Nuevo
  ├── generate-vapid-keys.js            ✅ Nuevo
  ├── .env.example                      ✅ Nuevo
  └── index.js                          ✏️ Modificado

pokedex/
  ├── public/sw.js                      ✏️ Modificado
  ├── src/
  │   ├── composables/
  │   │   └── usePushNotifications.js   ✅ Nuevo
  │   ├── components/
  │   │   └── PushNotificationToggle.vue ✅ Nuevo
  │   └── views/
  │       └── Home.vue                  ✏️ Modificado

Documentación/
  └── PUSH_NOTIFICATIONS_GUIDE.md       ✅ Nuevo
```

## 🚨 Solución de Problemas

### "Push notifications not configured"
→ Verifica que agregaste las VAPID keys al archivo `.env` y reiniciaste el servidor

### No aparece el botón de notificaciones
→ Asegúrate de que el frontend esté actualizado (`npm run dev` en pokedex/)

### No recibo notificaciones
→ Verifica que:
1. Aceptaste los permisos en el navegador
2. El Service Worker está activo (F12 > Application > Service Workers)
3. El usuario tiene suscripción activa (verifica en consola del backend)

## 📚 Documentación Completa

Para más detalles, ver: [PUSH_NOTIFICATIONS_GUIDE.md](./PUSH_NOTIFICATIONS_GUIDE.md)

---

✅ **Sistema completamente funcional y listo para usar**
