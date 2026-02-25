# 🔧 INSTRUCCIONES DE ACTUALIZACIÓN - SISTEMA DE AMIGOS Y NOTIFICACIONES

## 📋 Resumen de Cambios

Se implementaron las siguientes mejoras:

1. ✅ **Sistema de Solicitudes de Amistad**
   - Ahora enviar solicitud de amistad requiere que el receptor acepte o rechace
   - Se muestran solicitudes pendientes en la vista de Amigos
   - Notificación push cuando alguien acepta tu solicitud

2. ✅ **Botón para Eliminar Amigos**
   - Cada tarjeta de amigo tiene un botón "Eliminar"
   - Confirmación antes de eliminar

3. ✅ **Notificaciones Push Persistentes**
   - Las suscripciones ahora se guardan en PostgreSQL (no en memoria)
   - Las notificaciones funcionan incluso después de reiniciar el servidor
   - Notificaciones para: solicitudes de amistad, aceptación de amistad, retos de batalla

4. ✅ **Optimización de Carga de Pokémon**
   - Sistema de caché en memoria para peticiones de Pokémon
   - Segunda carga de mismos Pokémon es instantánea

## 🚀 Pasos para Activar las Mejoras

### **1. Ejecutar Migración de Base de Datos**

Necesitas agregar dos cosas a PostgreSQL en Render:

1. Ve a: https://dashboard.render.com
2. Busca tu servicio de PostgreSQL: `pokedex-db`
3. Haz clic en **"Connect"** (botón superior derecho)
4. Elige **"External Connection"**
5. Copia la **"External Database URL"**

Luego, necesitas ejecutar el SQL de migración. Hay 2 opciones:

#### **Opción A: Usar endpoint del backend (RECOMENDADO)**

1. Abre tu navegador
2. Ve a: `https://pokedex-backend-rzjl.onrender.com/api/run-migration`
3. Si todo salió bien, verás un mensaje de éxito

#### **Opción B: Usar cliente PostgreSQL (alternativa)**

Si tienes instalado `psql` o pgAdmin:

```bash
# Conectar con psql (sustituir con tu URL de Render)
psql "postgresql://pokedex_db_user:CONTRASEÑA@dpg-XXXX.oregon-postgres.render.com/pokedex_db"

# Pegar el contenido de BE/database/migration_friends_push.sql
```

### **2. Probar Localmente (Opcional)**

Si quieres probar antes de subir a producción:

```bash
# Terminal 1 - Backend
cd BE
npm start

# Terminal 2 - Frontend  
cd pokedex
npm run dev
```

Abre http://localhost:5173

### **3. Subir Cambios a GitHub y Render**

```bash
# Desde la raíz del proyecto
git add .
git commit -m "Feature: Sistema completo de solicitudes de amistad, eliminar amigos y notificaciones push persistentes"
git push origin main
```

Render detectará automáticamente los cambios y desplegará (3-5 minutos).

## 📱 Cómo Usar las Nuevas Funciones

### **Solicitudes de Amistad**

1. **Enviar solicitud:**
   - Ve a Amigos → Ingresa código del amigo → "Enviar Solicitud"
   - El receptor recibirá una push notification

2. **Aceptar/Rechazar:**
   - Si tienes solicitudes pendientes, aparecerán en la parte superior
   - Botones: ✓ Aceptar | ✗ Rechazar
   - Al aceptar, el solicitante recibe notificación push

### **Eliminar Amigos**

- En tu lista de amigos, cada tarjeta tiene botón "🗑️ Eliminar"
- Click → Confirmación → Amigo eliminado de ambos lados

### **Notificaciones Push**

Para recibir notificaciones:
1. Abre la app en el navegador
2. Si el navegador pregunta "¿Permitir notificaciones?" → Permitir
3. Las notificaciones se guardan automáticamente en la base de datos
4. Recibirás notificaciones para:
   - 👥 Nueva solicitud de amistad
   - ✅ Solicitud aceptada
   - ⚔️ Nuevo reto de batalla
   - ⚔️ Batalla aceptada

## 🔍 Verificar que Todo Funciona

1. **Base de datos actualizada:**
   ```
   Ve a https://pokedex-backend-rzjl.onrender.com/api/run-migration
   Deberías ver: "✅ Migration completed successfully"
   ```

2. **Notificaciones funcionando:**
   - Abre DevTools (F12) → Console
   - Deberías ver: "✅ Suscrito a push notifications correctamente"

3. **Solicitudes de amistad:**
   - Prueba enviar solicitud con el código de otro usuario
   - Deberías ver la solicitud en "Solicitudes Pendientes" del receptor

## 🐛 Solución de Problemas

### No recibo notificaciones push

**Causas posibles:**
- El otro usuario aún no activó notificaciones
- El navegador bloqueó permisos de notificaciones
- La migración de BD no se ejecutó

**Solución:**
1. Verifica que ejecutaste la migración SQL
2. Ve a Configuración del navegador → Permisos → Notificaciones
3. Asegúrate de que `pokedex-frontend-yi14.onrender.com` está permitido
4. Recarga la página con Ctrl + Shift + R

### Las solicitudes no aparecen

**Causa:** La migración de BD no se ejecutó

**Solución:**
```bash
# Ejecuta la migración manualmente
Ve a: https://pokedex-backend-rzjl.onrender.com/api/run-migration
```

## 📊 Nuevas Tablas en la Base de Datos

Después de la migración tendrás:

| Tabla | Descripción |
|-------|-------------|
| `push_subscriptions` | Suscripciones push de usuarios (endpoint, keys) |
| `friends` (actualizada) | Nueva columna `status` (pending, accepted, rejected) |

## 📝 Archivos Modificados

Backend:
- `BE/lib/db.js` - Nuevas funciones de amigos y push
- `BE/lib/push-notifications.js` - Usa base de datos en lugar de memoria
- `BE/index.js` - Nuevos endpoints: accept, reject, delete friend
- `BE/database/migration_friends_push.sql` - Script de migración

Frontend:
- `pokedex/src/views/Friends.vue` - UI de solicitudes y botón eliminar
- `pokedex/src/api.js` - Caché de Pokémon para optimización

## ✅ Checklist Final

- [ ] Migración SQL ejecutada en Render
- [ ] Código subido a GitHub (`git push origin main`)
- [ ] Render terminó de desplegar (ver dashboard)
- [ ] Probé enviar solicitud de amistad
- [ ] Probé aceptar/rechazar solicitud
- [ ] Activé notificaciones en el navegador
- [ ] Recibí notificación push de prueba

---

**¡Todo listo!** 🎉 Ahora tienes un sistema completo de amigos con solicitudes, notificaciones push persistentes y carga optimizada de Pokémon.
