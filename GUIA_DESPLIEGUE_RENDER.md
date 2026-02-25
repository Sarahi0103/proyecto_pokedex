# 🚀 Guía de Despliegue a Render.com

Esta guía te llevará paso a paso para desplegar tu aplicación Pokedex Fullstack en Render.com de forma **GRATUITA**.

---

## 📋 Requisitos Previos

1. ✅ Cuenta de GitHub (gratis)
2. ✅ Cuenta de Render.com (gratis) - [Crear cuenta aquí](https://render.com)
3. ✅ Tu proyecto debe estar en un repositorio de GitHub

---

## 🎯 Paso 1: Preparar el Repositorio de GitHub

### 1.1 Inicializar Git (si no lo has hecho)

```bash
# En la raíz de tu proyecto (PWD/)
git init
git add .
git commit -m "Preparar proyecto para despliegue en Render"
```

### 1.2 Crear Repositorio en GitHub

1. Ve a [GitHub](https://github.com) y crea un nuevo repositorio
2. **NO** marques "Initialize with README" (ya tienes uno)
3. Copia la URL del repositorio (ej: `https://github.com/tu-usuario/pokedex-app.git`)

### 1.3 Subir el Código a GitHub

```bash
# Agrega el remote de GitHub
git remote add origin https://github.com/tu-usuario/pokedex-app.git

# Sube el código
git branch -M main
git push -u origin main
```

---

## 🌐 Paso 2: Desplegar en Render (Opción Automática)

Render puede leer el archivo `render.yaml` que ya está configurado en tu proyecto.

### 2.1 Crear Blueprint desde GitHub

1. Ve a [Render Dashboard](https://dashboard.render.com/)
2. Click en **"New +"** → **"Blueprint"**
3. Conecta tu repositorio de GitHub
4. Render detectará automáticamente el archivo `render.yaml`
5. Click en **"Apply"**

Render creará automáticamente:
- ✅ Backend (Web Service)
- ✅ Frontend (Static Site)
- ✅ PostgreSQL Database

---

## 🔧 Paso 3: Configurar Variables de Entorno

### 3.1 Variables del Backend

Ve a tu servicio **pokedex-backend** en Render → **Environment**

Las variables críticas que DEBES configurar:

```bash
# Ya configuradas automáticamente por render.yaml:
NODE_ENV=production
PORT=10000
JWT_SECRET=(generado automáticamente)
SESSION_SECRET=(generado automáticamente)
DATABASE_URL=(conectado automáticamente)
FRONTEND_URL=(conectado automáticamente)

# DEBES AGREGAR MANUALMENTE:

# Google OAuth (Opcional - ver GOOGLE_OAUTH_SETUP.md)
GOOGLE_CLIENT_ID=tu_google_client_id
GOOGLE_CLIENT_SECRET=tu_google_client_secret  
GOOGLE_CALLBACK_URL=https://tu-backend.onrender.com/auth/google/callback

# Push Notifications (Opcional)
# Generar con: npm run generate-vapid
VAPID_PUBLIC_KEY=tu_vapid_public_key
VAPID_PRIVATE_KEY=tu_vapid_private_key
VAPID_SUBJECT=mailto:tu_email@example.com
```

### 3.2 Variables del Frontend

Ve a tu servicio **pokedex-frontend** en Render → **Environment**

```bash
# Ya configurada automáticamente:
VITE_API_BASE=(conectado automáticamente al backend)
```

---

## 🗄️ Paso 4: Inicializar la Base de Datos

Una vez que el backend esté desplegado:

### Opción 1: Desde Render Shell

1. Ve a **pokedex-backend** → **Shell** (pestaña)
2. Ejecuta:

```bash
npm run init-db
```

### Opción 2: Manualmente con SQL

1. Ve a **pokedex-db** → **Info** → Click en **"Access Database"**
2. Usa las credenciales para conectarte con un cliente PostgreSQL
3. Ejecuta el contenido de `BE/database/schema.sql`

---

## 🎉 Paso 5: ¡Listo! Verificar el Despliegue

### Verificar Backend

```
https://tu-backend.onrender.com/api/health
```

Deberías ver:
```json
{
  "status": "ok",
  "timestamp": "2026-02-25T...",
  "service": "Pokedex Backend",
  "environment": "production"
}
```

### Verificar Frontend

```
https://tu-frontend.onrender.com
```

Deberías ver la aplicación Pokedex funcionando.

---

## 🔍 Solución de Problemas Comunes

### ❌ Error: "Application failed to respond"

**Causa:** El backend no se está iniciando correctamente.

**Solución:**
1. Revisa los logs en Render: **Backend → Logs**
2. Verifica que `DATABASE_URL` esté configurado
3. Asegúrate que la base de datos esté inicializada

### ❌ Error: "CORS policy" en el frontend

**Causa:** El backend no permite requests desde el frontend.

**Solución:**
1. Verifica que `FRONTEND_URL` en el backend apunte a tu frontend de Render
2. En el backend → Environment, actualiza `FRONTEND_URL` con la URL completa:
   ```
   https://tu-frontend.onrender.com
   ```

### ❌ Error: "Connection refused" a la base de datos

**Causa:** Variables de base de datos incorrectas.

**Solución:**
1. Ve a **Backend → Environment**
2. Asegúrate que `DATABASE_URL` esté conectado a `pokedex-db`
3. Re-deploya el backend después de cambiar variables

### ❌ El frontend se ve pero no conecta al backend

**Causa:** `VITE_API_BASE` incorrecto.

**Solución:**
1. Ve a **Frontend → Environment**
2. Asegúrate que `VITE_API_BASE` tenga la URL completa del backend:
   ```
   https://tu-backend.onrender.com
   ```
3. Re-deploya el frontend

### 🐌 El servicio se "duerme" después de inactividad

**Causa:** El plan gratuito de Render pone los servicios en "sleep" después de 15 minutos de inactividad.

**Solución:**
- Es normal en el plan gratuito
- El servicio se despierta automáticamente cuando recibe una request (toma ~30 segundos)
- Para evitarlo, usa un servicio de "ping" o actualiza a un plan de pago

---

## 🔐 Generar VAPID Keys para Push Notifications

Si quieres habilitar notificaciones push:

### Localmente:

```bash
cd BE
npm run generate-vapid
```

Esto imprimirá las keys. Cópialas y agrégalas en las variables de entorno del backend en Render.

---

## 🔄 Actualizaciones Posteriores

Cada vez que hagas cambios al código:

```bash
git add .
git commit -m "Descripción de cambios"
git push origin main
```

Render detectará automáticamente los cambios y re-desplegará tu aplicación.

---

## 💰 Costos

Con el plan gratuito de Render:

- ✅ **Backend:** Gratis (con limitaciones de sleep)
- ✅ **Frontend:** Gratis
- ✅ **PostgreSQL:** Gratis (90 días, luego $7/mes o migrar)

**Total:** $0/mes por 90 días, luego $7/mes solo por la base de datos.

### Alternativas a PostgreSQL gratuitas permanentes:
- [Supabase](https://supabase.com) - 500MB gratis siempre
- [Neon](https://neon.tech) - 3GB gratis siempre
- [ElephantSQL](https://elephantsql.com) - 20MB gratis siempre

---

## 📚 Recursos Adicionales

- [Documentación de Render](https://render.com/docs)
- [Blueprint Specification](https://render.com/docs/blueprint-spec)
- [PostgreSQL en Render](https://render.com/docs/databases)

---

## 🆘 Soporte

Si tienes problemas:

1. Revisa los **Logs** en Render (cada servicio tiene su pestaña de Logs)
2. Verifica las **variables de entorno**
3. Consulta la sección de "Solución de Problemas" arriba
4. Lee la documentación de Render

---

**¡Felicidades!** 🎊 Tu aplicación Pokedex ya está en la nube y accesible desde cualquier lugar del mundo.
