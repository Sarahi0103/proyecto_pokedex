# 🔔 GUÍA RÁPIDA: ACTIVAR NOTIFICACIONES PUSH

## 🎯 Problema Actual

Las notificaciones push NO funcionan porque **las VAPID keys NO están configuradas en Render**.

## ✅ SOLUCIÓN EN 3 PASOS (5 minutos)

### Paso 1: Abre la Herramienta de Configuración

**IMPORTANTE: Espera 2-3 minutos** para que Render despliegue el nuevo código (commit `7c5fce3`), luego:

Abre este archivo en tu navegador:
```
C:\Users\ksgom\PWD\configurar-push-notifications.html
```

**O también puedes abrir:**
```
https://pokedex-backend-rzjl.onrender.com/api/setup-push
```

### Paso 2: Configurar VAPID Keys en Render

La herramienta te mostrará las VAPID keys con botones para copiarlas. Debes agregarlas en Render:

1. **Ve a Render Dashboard**: https://dashboard.render.com/
2. **Selecciona tu servicio backend**
3. **Haz clic en "Environment"** en el menú lateral
4. **Agrega estas 3 variables de entorno:**

   Variable 1:
   ```
   VAPID_PUBLIC_KEY
   ```
   Valor:
   ```
   BKLI_xE4Ubca8iBe8SlPsWn_ZHIEVdf9WnG4CT79qLHcONHR-JsQYO1rPHuIoZIPcFigRTe2xioxR4SkTDcXLkI
   ```

   Variable 2:
   ```
   VAPID_PRIVATE_KEY
   ```
   Valor:
   ```
   RzWob8QACjt5ECTU3n2TIcoIZcTHnmKAoANnnwCpIjw
   ```

   Variable 3:
   ```
   VAPID_SUBJECT
   ```
   Valor:
   ```
   mailto:karla.gomez.23e@utzmg.edu.mx
   ```

5. **Haz clic en "Save Changes"**
6. **Espera a que Render redespliegue** (2-3 minutos)

### Paso 3: Ejecutar Migración

Una vez que Render termine de redesplegar:

1. **Abre en tu navegador:**
```
https://pokedex-backend-rzjl.onrender.com/api/run-migration
```

2. **Deberías ver:**
```json
{
  "success": true,
  "message": "Migration executed successfully"
}
```

3. **Recarga ambos navegadores** (Alberto y Karla) con **Ctrl + F5**

---

## 🧪 PRUEBA

Una vez completados los 3 pasos:

1. **Karla**: Envía solicitud de amistad a Alberto
2. **Alberto**: Debería recibir una **notificación push** 🔔
3. **Alberto**: Acepta la solicitud
4. **Karla**: Debería recibir notificación de que fue aceptada

---

## 📋 Verificación

Para verificar que todo está configurado correctamente:

1. Abre DevTools (F12) → Console
2. Busca el mensaje: `✅ Suscrito a push notifications`
3. O visita: `https://pokedex-backend-rzjl.onrender.com/api/debug/push-status` (debes estar logueado)

Deberías ver:
```json
{
  "vapid": {
    "configured": true
  },
  "push_notifications": {
    "subscriptions_count": 1,
    "status": "ACTIVO"
  },
  "ready_for_push": true
}
```

---

## ❌ Troubleshooting

### Las notificaciones no llegan

1. **Verifica que las VAPID keys estén en Render:**
   - Dashboard → tu servicio → Environment
   - Debe haber 3 variables: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT

2. **Verifica que la migración se ejecutó:**
   - Visita: https://pokedex-backend-rzjl.onrender.com/api/setup-push
   - Debe decir "Tabla push_subscriptions existe"

3. **Verifica que estás suscrito:**
   - Abre DevTools → Console
   - Busca: "✅ Suscrito a push notifications"
   - Si no aparece, recarga con Ctrl+F5

4. **Verifica los permisos del navegador:**
   - Haz clic en el icono 🔒 junto a la URL
   - Verifica que "Notificaciones" esté en "Permitir"

### La herramienta de configuración no abre

- Espera a que Render despliegue el nuevo código (2-3 minutos)
- Verifica en: https://dashboard.render.com/ que el servicio esté "Live"

---

## 🎉 Resultado Final

Después de completar los pasos:

✅ **Notificaciones de solicitud de amistad:**
- Cuando alguien te envía solicitud → recibes notificación push

✅ **Notificaciones de amistad aceptada:**
- Cuando alguien acepta tu solicitud → recibes notificación

✅ **Notificaciones de reto de batalla:**
- Cuando alguien te reta → recibes notificación

✅ **Notificaciones de batalla aceptada:**
- Cuando aceptan tu reto → recibes notificación

---

**Última actualización:** 25/02/2026 - Commit: 7c5fce3

**Archivos importantes:**
- Herramienta de configuración: `configurar-push-notifications.html`
- Endpoint de diagnóstico: `/api/setup-push`
- Endpoint de migración: `/api/run-migration`
- VAPID keys locales: `BE/.env`
