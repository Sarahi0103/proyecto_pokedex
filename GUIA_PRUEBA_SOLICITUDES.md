# 🔍 Guía: Por qué NO aparece la solicitud en "Agregar Amigos"

## ✅ DIAGNÓSTICO COMPLETADO

### El Sistema Funciona Correctamente ✓

He verificado que:
- ✅ Las solicitudes se guardan con `status='pending'` en la BD
- ✅ El endpoint `/api/friends/requests` devuelve las solicitudes correctamente
- ✅ El polling cada 5 segundos funciona
- ✅ El logging detallado está activo

---

## 🎯 El Problema Probable

**Estás viendo la página del EMISOR, no del RECEPTOR.**

### Cómo Funciona:

```
Usuario A (TÚ)          →  Envía solicitud  →         Usuario B (OTRO)
├─ Ve en: "Solicitudes Enviadas" (📤)                 ├─ Ve en: "Solicitudes Pendientes" (📨)
├─ Status: ⏳ Pendiente                               ├─ Botones: ✓ Aceptar / ✗ Rechazar
└─ NO puede aceptar/rechazar                          └─ Recibe notificación push 🔔
```

---

## 📋 Prueba Correcta Paso a Paso

### 🎮 CONFIGURACIÓN:

**Terminal 1** (Backend):
```bash
cd BE
node index.js
# Debe estar corriendo en http://localhost:4000
```

**Terminal 2** (Frontend):
```bash
cd pokedex
npm run dev
# Debe estar corriendo en http://localhost:3000
```

**Navegador 1** - Usuario A (Emisor):
- Modo normal o Incógnito
- `http://localhost:3000`

**Navegador 2** - Usuario B (Receptor):
- Modo incógnito (diferente sesión)
- `http://localhost:3000`

---

### 📝 PASOS:

#### 1️⃣ Usuario A (Navegador 1):
```
✓ Abre http://localhost:3000
✓ Inicia sesión (ejemplo: test@pokedex.com)
✓ Activa notificaciones (banner amarillo)
✓ Ve a "Agregar Amigos"
✓ Copia tu código (ejemplo: TEST123)
```

#### 2️⃣ Usuario B (Navegador 2):
```
✓ Abre http://localhost:3000 en OTRO navegador/incógnito
✓ Inicia sesión con DIFERENTE usuario (ejemplo: sara@gmail.com)
✓ Activa notificaciones (banner amarillo)
✓ Ve a "Agregar Amigos"
✓ Copia tu código (ejemplo: 3utn3uw)
```

#### 3️⃣ Usuario B envía solicitud a Usuario A:
```
✓ Navegador 2: Ingresa el código de Usuario A (TEST123)
✓ Haz clic en "Enviar Solicitud"
✓ Verás mensaje: "✓ Solicitud de amistad enviada. El receptor será notificado."
```

**Qué verás en cada navegador:**

**Navegador 2 (Usuario B - Emisor):**
```
📤 Solicitudes Enviadas (1)
   ┌─────────────────────────────┐
   │ 👤 Test User                │
   │ 🔖 TEST123                  │
   │ ⏳ Pendiente                │
   └─────────────────────────────┘
```

**Navegador 1 (Usuario A - Receptor):**
```
🔔 NOTIFICACIÓN PUSH (en el sistema operativo)
   "Nueva Solicitud de Amistad"
   "Usuario B quiere ser tu amigo"

📨 Solicitudes Pendientes (1)
   ┌─────────────────────────────┐
   │ 👤 Sarahi González          │
   │ 🔖 3utn3uw                  │
   │ [✓ Aceptar] [✗ Rechazar]   │
   └─────────────────────────────┘
```

---

## 🔍 Verificar en Tiempo Real

### Consola del Navegador (F12):

**Navegador 1 (Receptor)** - Verás cada 5 segundos:
```
📊 Datos actualizados: { amigos: 0, pendientes: 1, enviadas: 0 }
📨 Solicitudes pendientes recibidas:
   1. Usuario B (3utn3uw)
```

**Navegador 2 (Emisor)** - Verás cada 5 segundos:
```
📊 Datos actualizados: { amigos: 0, pendientes: 0, enviadas: 1 }
📤 Solicitudes enviadas:
   1. Para Test User (TEST123)
```

### Terminal del Backend:

Cuando Usuario B envía solicitud:
```
🔍 Intentando agregar amigo con código: TEST123
👤 Usuario actual: sara@gmail.com | Código: 3utn3uw
👥 Amigo encontrado: test@pokedex.com
✅ Agregando amigo: sara@gmail.com -> test@pokedex.com
📝 Creando solicitud: user_id=2, friend_id=1, status=pending
✅ Solicitud guardada en la BD
✅ Verificado en BD: status="pending", id=13
📤 Enviando push notification de amistad...
📱 Encontradas 1 suscripciones para el amigo
✅ Push notification enviada correctamente
```

Cuando Usuario A carga su página:
```
📥 Solicitando pendientes para: test@pokedex.com (ID: 1)
📨 Solicitudes pendientes encontradas: 1
📋 Detalles:
   1. De: Sarahi González (sara@gmail.com) - ID: 2
```

---

## ❌ Errores Comunes

### Error 1: "No veo las solicitudes"
**Causa**: Estás viendo el mismo navegador/usuario que envió la solicitud.
**Solución**: Abre OTRO navegador con OTRO usuario para recibir la solicitud.

### Error 2: "Las notificaciones no llegan"
**Causa**: No activaste notificaciones o las bloqueaste.
**Solución**: 
- Haz clic en el banner amarillo "Activar Notificaciones"
- Acepta el popup del navegador
- Verifica en `chrome://settings/content/notifications`

### Error 3: "La página no se actualiza"
**Causa**: El polling no está activo o la pestaña está en segundo plano.
**Solución**:
- Verifica en la consola que diga: "✅ Polling automático activado (cada 5 segundos)"
- Mantén la pestaña visible (el polling solo funciona cuando `document.visibilityState === 'visible'`)

### Error 4: "Veo el mensaje pero luego desaparece"
**Causa**: Las solicitudes ya fueron aceptadas/rechazadas.
**Solución**: Crea solicitudes nuevas con usuarios diferentes.

---

## 🧪 Scripts de Diagnóstico

### Verificar sistema completo:
```bash
cd BE
node test-push-system.js
```

### Simular envío de solicitud:
```bash
cd BE
node test-add-friend.js
```

### Simular carga de solicitudes pendientes:
```bash
cd BE
node test-pending-requests.js
```

### Ver base de datos directamente:
```bash
$env:PGPASSWORD='123'
psql -U postgres -d pokedex -c "SELECT * FROM friends WHERE status = 'pending';"
```

---

## ✅ Resumen

| Característica | Estado |
|----------------|--------|
| Guardar solicitud como pending | ✅ Funciona |
| Enviar notificación push | ✅ Funciona |
| Cargar solicitudes pendientes | ✅ Funciona |
| Polling automático (5s) | ✅ Funciona |
| UI "Solicitudes Enviadas" | ✅ Visible para emisor |
| UI "Solicitudes Pendientes" | ✅ Visible para receptor |
| Botones Aceptar/Rechazar | ✅ Solo en receptor |

**El sistema está funcionando correctamente.** Solo asegúrate de probar con 2 navegadores/usuarios diferentes.

---

**Commit**: `fabe42c` - Logging detallado en todos los endpoints de solicitudes
