# 🎉 ¡Despliegue Exitoso! - Primeros Pasos

Felicidades por desplegar tu aplicación. Ahora verifica que todo funcione correctamente.

---

## ✅ Verificaciones Inmediatas

### 1. Backend está vivo

Visita: `https://tu-backend.onrender.com/api/health`

**Respuesta esperada:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-25T...",
  "service": "Pokedex Backend",
  "environment": "production"
}
```

✅ Si ves esto, el backend está funcionando.

---

### 2. Frontend carga

Visita: `https://tu-frontend.onrender.com`

✅ Deberías ver la interfaz de Pokedex.

---

### 3. Registro de usuario

1. Ve a **Register** en tu frontend
2. Crea una cuenta con email y password
3. Deberías ser redirigido al Login o Dashboard

✅ Si te registras exitosamente, la base de datos funciona.

---

### 4. Login

1. Ingresa con las credenciales que creaste
2. Deberías ver el dashboard principal

✅ El sistema de autenticación JWT funciona.

---

### 5. Búsqueda de Pokémon

1. En el explorador, busca un Pokémon (ej: "pikachu")
2. Deberían aparecer resultados

✅ La conexión con PokeAPI funciona.

---

### 6. Agregar Favorito

1. Busca un Pokémon
2. Click en **"Add to Favorites"**
3. Ve a la sección de Favoritos

✅ Deberías ver el Pokémon guardado.

---

### 7. Crear Equipo

1. Ve a **Teams**
2. Crea un nuevo equipo
3. Agrega Pokémon (máximo 6)

✅ El equipo se guarda correctamente.

---

### 8. Sistema de Amigos

1. Copia tu código de entrenador (aparece en perfil)
2. Compártelo con un amigo
3. Tu amigo debe poder agregarte

✅ El sistema de amigos funciona.

---

### 9. Batallas (Socket.io)

1. Agrega un amigo
2. Desafíalo a una batalla
3. La batalla debe actualizarse en tiempo real

✅ Socket.io está conectado y funcionando.

---

## 🐛 Si Algo No Funciona

### Backend no responde

**Posibles causas:**
- El servicio se está iniciando (espera 1-2 minutos)
- Error en variables de entorno
- Base de datos no inicializada

**Solución:**
1. Ve a Render/Railway → Backend → **Logs**
2. Busca errores rojos
3. Verifica variables de entorno
4. Ejecuta `npm run init-db` en el shell

---

### CORS Error en el navegador

**Error típico:**
```
Access to fetch at 'https://backend...' from origin 'https://frontend...' 
has been blocked by CORS policy
```

**Solución:**
1. Ve a Backend → **Environment**
2. Verifica `FRONTEND_URL` = URL completa del frontend
3. Formato: `https://tu-frontend.onrender.com` (sin `/` al final)
4. **Redeploy** el backend

---

### Frontend muestra página en blanco

**Posibles causas:**
- Build falló
- `VITE_API_BASE` incorrecto

**Solución:**
1. Ve a Frontend → **Logs** → **Deploy Logs**
2. Asegúrate que el build terminó exitosamente
3. Verifica `VITE_API_BASE` en Environment
4. Debe ser: `https://tu-backend.onrender.com` (sin `/` al final)
5. **Redeploy** el frontend

---

### "Cannot connect to database"

**Solución:**
1. Ve a Backend → **Environment**
2. Verifica que `DATABASE_URL` existe
3. Debe estar conectado a tu database de PostgreSQL
4. En Render: debe ser una referencia tipo `${{Postgres.DATABASE_URL}}`
5. Si no existe, agrégala manualmente desde el dashboard de la DB

---

### Base de datos vacía / sin tablas

**Solución:**
1. Ve a Backend → **Shell**
2. Ejecuta:
   ```bash
   npm run init-db
   ```
3. Deberías ver:
   ```
   ✅ Conectado a PostgreSQL
   🔨 Ejecutando schema SQL...
   ✅ Schema ejecutado correctamente
   ```

---

### Google OAuth no funciona

**Solución:**
1. Verifica que las credenciales de Google Cloud estén configuradas
2. En Google Cloud Console → Credenciales:
   - **Authorized redirect URIs** debe incluir:
     `https://tu-backend.onrender.com/auth/google/callback`
   - **Authorized JavaScript origins** debe incluir:
     `https://tu-frontend.onrender.com`
3. Actualiza las variables en Backend → Environment:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_CALLBACK_URL`
4. **Redeploy** el backend

---

### Push Notifications no funcionan

**Solución:**
1. Genera VAPID keys localmente:
   ```bash
   cd BE
   npm run generate-vapid
   ```
2. Copia las keys generadas
3. Agrégalas en Backend → Environment:
   - `VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`
   - `VAPID_SUBJECT`
4. **Redeploy** el backend

---

## 📊 Monitoreo

### Ver Logs en Tiempo Real

**Render:**
1. Dashboard → Tu servicio → **Logs**
2. Los logs se actualizan automáticamente

**Railway:**
1. Dashboard → Tu servicio → **Deployments** → Click en el deploy activo
2. Los logs aparecen en tiempo real

---

### Métricas

**Render:**
1. Dashboard → Tu servicio → **Metrics**
2. Verás CPU, memoria, requests

**Railway:**
1. Dashboard → Tu servicio
2. Gráficas de uso en la parte superior

---

## 🔄 Actualizar la Aplicación

Cuando hagas cambios al código:

```bash
# En tu computadora local
git add .
git commit -m "Descripción de cambios"
git push origin main
```

Render/Railway detectarán el push y desplegarán automáticamente (toma 2-5 minutos).

---

## 🎯 Próximos Pasos Recomendados

### 1. Configurar Dominio Personalizado (Opcional)

**Render:**
- Settings → Custom Domain → Agregar tu dominio

**Railway:**
- Settings → Domains → Generate Domain o agregar custom domain

---

### 2. Configurar SSL/HTTPS

Render y Railway proveen HTTPS automáticamente. No necesitas hacer nada.

---

### 3. Configurar Alertas

**Render:**
- Settings → Notifications → Agrega email o Slack

**Railway:**
- Project Settings → Notifications

---

### 4. Backup de Base de Datos

**Importante:** El plan gratuito de Render DB expira a los 90 días.

**Opciones:**
1. Exportar datos antes de los 90 días
2. Migrar a Supabase/Neon (gratis permanente)
3. Pagar $7/mes por PostgreSQL en Render

**Exportar datos:**
```bash
# Desde Render Shell (Backend)
pg_dump $DATABASE_URL > backup.sql
```

---

### 5. Monitoreo Externo (Opcional)

Para evitar que el servicio duerma (plan gratuito):

**UptimeRobot:**
1. Crea cuenta gratis en [uptimerobot.com](https://uptimerobot.com)
2. Agrega monitor tipo "HTTP(s)"
3. URL: `https://tu-backend.onrender.com/api/health`
4. Intervalo: 5 minutos

Esto hará "ping" a tu backend cada 5 minutos y evitará que duerma.

---

## 📱 Compartir tu Aplicación

Tu Pokedex ya está online! Comparte las URLs:

**Frontend (usuarios):**
```
https://tu-frontend.onrender.com
```

**Backend API (desarrolladores):**
```
https://tu-backend.onrender.com
```

---

## 🎓 Aprende Más

### Documentación Oficial

- [Render Docs](https://render.com/docs)
- [Railway Docs](https://docs.railway.app)
- [PostgreSQL](https://www.postgresql.org/docs/)
- [Vue 3](https://vuejs.org/guide/)
- [Express](https://expressjs.com/)

### Mejoras Sugeridas

1. **Añadir tests** (Vitest en frontend, Jest en backend)
2. **Implementar caché** (Redis) para PokeAPI
3. **Añadir rate limiting** más estricto
4. **Implementar analytics** (Google Analytics, Plausible)
5. **Mejorar SEO** (meta tags, sitemap)
6. **Añadir modo offline** (Service Workers, PWA)

---

## 🏆 ¡Felicidades!

Has desplegado exitosamente una aplicación fullstack completa con:

- ✅ Backend Node.js + Express
- ✅ Frontend Vue 3
- ✅ Base de datos PostgreSQL
- ✅ Autenticación JWT + Google OAuth
- ✅ WebSockets (Socket.io) para batallas en tiempo real
- ✅ Push Notifications
- ✅ HTTPS seguro
- ✅ Deploy automatizado

**Tu aplicación está lista para el mundo real.** 🌍

---

¿Problemas? Consulta:
- [GUIA_DESPLIEGUE_RENDER.md](GUIA_DESPLIEGUE_RENDER.md)
- [GUIA_DESPLIEGUE_RAILWAY.md](GUIA_DESPLIEGUE_RAILWAY.md)
- O revisa los logs de tu servicio
