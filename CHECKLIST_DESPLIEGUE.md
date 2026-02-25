# ✅ Checklist Pre-Despliegue

Usa este checklist para asegurarte de que todo está listo antes de desplegar tu aplicación.

---

## 📋 Preparación del Código

### Git y GitHub
- [ ] Git está inicializado (`git init`)
- [ ] Repositorio creado en GitHub
- [ ] Código subido a GitHub (`git push`)
- [ ] Rama principal es `main` o `master`

### Archivos de Configuración
- [x] `render.yaml` existe en raíz (✅ ya creado)
- [x] `.gitignore` existe y está configurado (✅ ya creado)
- [x] `BE/.env.example` existe (✅ ya creado)
- [x] `pokedex/.env.example` existe (✅ ya creado)
- [ ] **NO** hay archivos `.env` con datos reales en el repositorio

---

## 🔐 Variables de Entorno

### Backend - Requeridas
- [ ] `JWT_SECRET` - Crear uno seguro (mínimo 32 caracteres)
- [ ] `SESSION_SECRET` - Crear uno seguro
- [ ] `DATABASE_URL` - Será provisto por Render/Railway
- [ ] `FRONTEND_URL` - URL del frontend en producción
- [ ] `NODE_ENV` - Configurar a `production`
- [ ] `PORT` - Render/Railway lo asigna automáticamente

### Backend - Opcionales
- [ ] `GOOGLE_CLIENT_ID` - Si usas Google OAuth
- [ ] `GOOGLE_CLIENT_SECRET` - Si usas Google OAuth
- [ ] `GOOGLE_CALLBACK_URL` - URL callback de producción
- [ ] `VAPID_PUBLIC_KEY` - Si usas push notifications
- [ ] `VAPID_PRIVATE_KEY` - Si usas push notifications
- [ ] `VAPID_SUBJECT` - Tu email para VAPID

### Frontend
- [ ] `VITE_API_BASE` - URL del backend en producción

---

## 🗄️ Base de Datos

### PostgreSQL
- [ ] Schema SQL está en `BE/database/schema.sql`
- [ ] Script de inicialización existe: `BE/init-db.js`
- [ ] Has probado el script localmente (opcional)

### Datos Importantes
- [ ] ¿Necesitas migrar datos existentes? Si sí, planea cómo hacerlo
- [ ] ¿Tienes backup de datos locales? (si aplica)

---

## 🔑 Servicios Externos

### Google OAuth (si aplica)
- [ ] Proyecto creado en Google Cloud Console
- [ ] OAuth consent screen configurado
- [ ] Credenciales creadas (Client ID y Secret)
- [ ] URIs autorizados incluyen URLs de producción:
  - Authorized redirect URIs: `https://tu-backend.onrender.com/auth/google/callback`
  - Authorized JavaScript origins: `https://tu-frontend.onrender.com`

### Push Notifications (si aplica)
- [ ] VAPID keys generadas (`npm run generate-vapid`)
- [ ] Keys guardadas de forma segura
- [ ] `VAPID_SUBJECT` usa un email válido

---

## 🧪 Pruebas Locales

### Backend
- [ ] Backend inicia correctamente: `cd BE && npm start`
- [ ] Endpoint de salud responde: `http://localhost:4000/api/health`
- [ ] Login funciona
- [ ] Registro funciona
- [ ] Conexión a PostgreSQL exitosa

### Frontend
- [ ] Frontend inicia correctamente: `cd pokedex && npm run dev`
- [ ] Build se genera sin errores: `npm run build`
- [ ] Aplicación funciona en modo desarrollo

### Socket.io (Batallas en tiempo real)
- [ ] Socket.io conecta correctamente
- [ ] Batallas funcionan en local

---

## 📦 Dependencias

### Backend (`BE/package.json`)
- [x] Todas las dependencias listadas (✅ ya configurado)
- [ ] No hay dependencias de desarrollo en `dependencies` (deben estar en `devDependencies`)
- [ ] Script `start` existe y funciona

### Frontend (`pokedex/package.json`)
- [x] Todas las dependencias listadas (✅ ya configurado)
- [ ] Build command correcto: `npm run build`
- [ ] Genera carpeta `dist/` correctamente

---

## 🌐 Configuración de Red

### CORS
- [x] Backend acepta origin del frontend (✅ ya configurado)
- [x] Configuración dinámica basada en `FRONTEND_URL` (✅ ya configurado)

### URLs
- [ ] Has planificado los nombres de tus servicios:
  - Backend: `_______________`.onrender.com
  - Frontend: `_______________`.onrender.com
  - (O en Railway: `_______________`.up.railway.app)

---

## 💳 Cuenta y Costos

### Render.com o Railway
- [ ] Cuenta creada
- [ ] GitHub conectado
- [ ] Método de pago configurado (tarjeta requerida, pero no se cobra en plan gratis)
- [ ] Entiendes los límites del plan gratuito:
  - Render: Backend duerme después de 15min inactividad
  - Railway: $5 USD crédito mensual

### Costos Esperados
- [ ] Plan gratuito es suficiente? ¿Por cuánto tiempo?
- [ ] ¿Necesitas plan de pago? (típicamente $7-15/mes)

---

## 📝 Documentación

- [ ] Has leído la guía de despliegue correspondiente:
  - [ ] [GUIA_DESPLIEGUE_RENDER.md](GUIA_DESPLIEGUE_RENDER.md)
  - [ ] [GUIA_DESPLIEGUE_RAILWAY.md](GUIA_DESPLIEGUE_RAILWAY.md)
- [ ] Entiendes el proceso de deployment
- [ ] Sabes cómo ver los logs
- [ ] Sabes cómo actualizar variables de entorno

---

## 🚀 Post-Despliegue

Una vez desplegado, verifica:

### Inmediatamente
- [ ] Backend responde: `https://tu-backend/api/health`
- [ ] Frontend carga: `https://tu-frontend`
- [ ] Base de datos inicializada (`npm run init-db`)

### Funcionalidad
- [ ] Registro de usuario funciona
- [ ] Login funciona
- [ ] Búsqueda de Pokémon funciona
- [ ] Favoritos se guardan
- [ ] Equipos se crean
- [ ] Amigos se pueden agregar
- [ ] Batallas funcionan (Socket.io conecta)

### Opcional
- [ ] Google OAuth funciona
- [ ] Push notifications funcionan
- [ ] PWA se instala correctamente

---

## 🐛 Plan de Contingencia

### Si algo sale mal
- [ ] Sabes cómo ver los logs en Render/Railway
- [ ] Sabes cómo hacer rollback (re-deploy commit anterior)
- [ ] Tienes backup de datos importantes
- [ ] Puedes volver a desarrollo local rápidamente

---

## 🎯 Generadores de Secretos

Para generar secretos seguros, usa:

### Bash/PowerShell
```bash
# JWT_SECRET (Linux/Mac/Git Bash)
openssl rand -base64 32

# PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### Node.js
```javascript
require('crypto').randomBytes(32).toString('base64')
```

### Online (úsalo con precaución)
- [randomkeygen.com](https://randomkeygen.com/)
- [passwordsgenerator.net](https://passwordsgenerator.net/)

---

## ✅ Estado Final

Marca cuando hayas completado:

- [ ] Todo el checklist está completo
- [ ] Código está en GitHub
- [ ] Plataforma elegida (Render/Railway)
- [ ] Variables de entorno preparadas
- [ ] Listo para desplegar

---

**¿Todo marcado?** 🎉 ¡Adelante, despliega con confianza!

Sigue la guía correspondiente:
- 📘 [Render - Guía Completa](GUIA_DESPLIEGUE_RENDER.md)
- 📙 [Railway - Guía Rápida](GUIA_DESPLIEGUE_RAILWAY.md)
