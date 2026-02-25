# 🔔 SOLUCIÓN: Notificaciones Push No Funcionan

## 🎯 Problema
Las solicitudes de amistad se envían correctamente (puedes verlas en la base de datos), pero:
- ❌ No se reciben notificaciones push
- ❌ No aparecen las solicitudes pendientes en la app

## 🔍 Diagnóstico Rápido

### Paso 1: Abre la Herramienta de Diagnóstico

**Abre este archivo en tu navegador:**
```
C:\Users\ksgom\PWD\diagnostico-completo.html
```

Esta herramienta verificará automáticamente:
- ✅ Si los códigos de usuario están correctos
- ✅ Si la migración se ejecutó
- ✅ El estado de la base de datos

### Paso 2: Ejecuta las Acciones Necesarias

Haz clic en los botones en este orden:
1. **"🔧 Arreglar Códigos"** - Asegura que todos los usuarios tengan código
2. **"📦 Ejecutar Migración"** - Crea las tablas necesarias

### Paso 3: Verifica el Estado de Push Notifications (IMPORTANTE)

Después de ejecutar la migración, **debes iniciar sesión en la app** y abrir esta URL:

```
https://pokedex-backend-rzjl.onrender.com/api/debug/push-status
```

Esto te mostrará:
- ✅ Si la tabla `push_subscriptions` existe
- ✅ Si la columna `status` existe en la tabla `friends`
- ✅ Cuántas suscripciones push tiene tu usuario
- ✅ Si las claves VAPID están configuradas

## ⚙️ Configuración de Push Notifications en la App

### CRÍTICO: Debes activar las notificaciones push en la app

1. **Inicia sesión** en la app
2. Ve a la sección de **"Agregar Amigos"**
3. Busca el **toggle de "Notificaciones Push"** (debería estar en la parte superior)
4. **Actívalo** - el navegador te pedirá permiso
5. **Acepta** los permisos del navegador

### ¿Cómo verificar si estás suscrito?

Después de activar el toggle, vuelve a abrir:
```
https://pokedex-backend-rzjl.onrender.com/api/debug/push-status
```

Deberías ver:
```json
{
  "push_notifications": {
    "subscriptions_count": 1,
    "status": "ACTIVO"
  }
}
```

## 🧪 Prueba del Sistema Completo

Una vez que hayas:
1. ✅ Ejecutado la migración
2. ✅ Activado las notificaciones push en ambos usuarios
3. ✅ Verificado que ambos usuarios tienen `subscriptions_count > 0`

**Prueba enviando una solicitud de amistad:**

### Usuario 1 (Alberto):
1. Ve a "Agregar Amigos"
2. Copia tu código (ej: `k72or5p`)
3. Compártelo con Karla

### Usuario 2 (Karla):
1. Ve a "Agregar Amigos"
2. Ingresa el código de Alberto: `k72or5p`
3. Haz clic en "Agregar Amigo"

**✅ Resultado esperado:**
- Alberto debería recibir una **notificación push** en el navegador
- La solicitud debería aparecer en la sección de **"Solicitudes Pendientes"** de Alberto

## ❌ Troubleshooting

### Problema: "subscriptions_count: 0" en el diagnóstico

**Causa:** No te has suscrito a notificaciones push en la app.

**Solución:**
1. Ve a la app → Agregar Amigos
2. Busca el toggle de notificaciones push
3. Actívalo y acepta los permisos del navegador

### Problema: No aparece el toggle de notificaciones

**Causa:** El componente puede no estar visible o no se importó correctamente.

**Solución:**
Abre las DevTools (F12) → Console y ejecuta:
```javascript
// Verificar si el Service Worker está activo
navigator.serviceWorker.getRegistration().then(reg => {
  console.log('SW:', reg ? 'ACTIVO' : 'NO REGISTRADO');
});

// Verificar permisos de notificación
console.log('Permisos:', Notification.permission);
```

Si `Notification.permission` es `"denied"`, debes:
1. Ir a la configuración del sitio en el navegador
2. Restablecer los permisos
3. Recargar la página
4. Aceptar cuando te pida permisos de nuevo

### Problema: La migración dice "ya ejecutada" pero las notificaciones no funcionan

**Solución:**
1. Abre: `https://pokedex-backend-rzjl.onrender.com/api/debug/push-status`
2. Verifica que `push_subscriptions_table_exists: true`
3. Verifica que `friends_status_column_exists: true`
4. Si alguno es `false`, ejecuta la migración manualmente desde el Shell de Render:

```bash
node -e "require('./lib/db').pool.query(require('fs').readFileSync('./database/migration_friends_push.sql', 'utf8')).then(() => console.log('OK')).catch(console.error)"
```

### Problema: Las claves VAPID no están configuradas

**Verifica en Render Dashboard:**
1. Ve a tu servicio backend
2. Haz clic en "Environment"
3. Deberías tener estas variables:
   - `VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`

Si no están, ejecuta localmente:
```bash
cd BE
node generate-vapid-keys.js
```

Luego copia las claves y agrégalas en Render.

## 📋 Checklist Final

Antes de probar, verifica que TODO esté ✅:

- [ ] Migración ejecutada correctamente
- [ ] Todos los usuarios tienen código
- [ ] Tabla `push_subscriptions` existe en la base de datos
- [ ] Columna `status` existe en tabla `friends`
- [ ] Claves VAPID configuradas en Render
- [ ] Usuario 1 activó notificaciones push (subscriptions_count > 0)
- [ ] Usuario 2 activó notificaciones push (subscriptions_count > 0)
- [ ] Service Worker activo en ambos navegadores
- [ ] Permisos de notificación aceptados en ambos navegadores

## 🎉 Una vez que TODO esté listo

El flujo completo debería funcionar así:

1. **Karla envía solicitud** usando el código de Alberto
2. **Alberto recibe notificación push** en su navegador
3. **Alberto ve la solicitud** en "Solicitudes Pendientes"
4. **Alberto acepta la solicitud**
5. **Karla recibe notificación** de que Alberto aceptó
6. Ahora son amigos y pueden retarse a batallas

---

**Última actualización:** 25/02/2026 - Commit: 8e3d59a

**Herramientas creadas:**
- `diagnostico-completo.html` - Diagnóstico automático del sistema
- `/api/debug/push-status` - Endpoint de diagnóstico (requiere login)
- `/api/fix-user-codes` - Arregla códigos faltantes
- `/api/run-migration` - Ejecuta la migración
