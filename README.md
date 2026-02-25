# Pokedex Fullstack Minimalista

Aplicación fullstack con **Node.js/Express** (backend) + **Vue 3** (frontend) para explorar Pokémon, gestionar favoritos, equipos, amigos y batallas.

---

## 🎨 Características

- **Registro y autenticación** (email + password **O Google OAuth**)
- **Explorador de Pokémon**: listar, buscar y filtrar
- **Detalles de Pokémon**: especie, estadísticas y línea evolutiva
- **Favoritos**: persistencia por usuario
- **Equipos**: crear y administrar equipos de Pokémon (máx 6)
- **Amigos**: agregar amigos mediante código único
- **Batallas**: simulación entre Pokémon (basada en estadísticas)
- **Diseño minimalista**: colores rojo (#e63946), azul (#1d3557) y negro

---

## 📂 Estructura del proyecto

```
/BE            # Backend Node.js (BFF)
/pokedex       # Frontend Vue 3
```

---

## 🚀 Instalación y arranque

### **Backend** (BE/)

1. **Instalar dependencias**:
   ```bash
   cd BE
   npm install
   ```

2. **Configurar variables de entorno**:  
   Crea un archivo `.env` (o copia `.env.example`):
   ```
   PORT=4000
   JWT_SECRET=your_secret_here
   POKEAPI_BASE=https://pokeapi.co/api/v2
   SESSION_SECRET=session_secret_key
   FRONTEND_URL=http://localhost:5173
   
   # Google OAuth (opcional - ver GOOGLE_OAUTH_SETUP.md)
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_CALLBACK_URL=http://localhost:4000/auth/google/callback
   ```
   
   **Nota**: Para habilitar Google OAuth, consulta [GOOGLE_OAUTH_SETUP.md](GOOGLE_OAUTH_SETUP.md)

3. **Arrancar servidor**:
   ```bash
   npm start
   ```
   El servidor estará disponible en `http://localhost:4000`

---

### **Frontend** (pokedex/)

1. **Instalar dependencias**:
   ```bash
   cd pokedex
   npm install
   ```

2. **Configurar `.env`** (opcional):
   ```
   VITE_API_BASE=http://localhost:4000
   ```

3. **Arrancar dev server**:
   ```bash
   npm run dev
   ```
   La aplicación estará disponible en `http://localhost:5173` (o el puerto que indique Vite)

---

## ☁️ Despliegue en la Nube

Este proyecto está **listo para desplegarse** en plataformas cloud como Render, Railway, Vercel, etc.

### 🚀 Inicio Rápido

1. **Sube tu código a GitHub**
2. **Elige una plataforma** (recomendado: Render o Railway)
3. **Sigue la guía correspondiente**:
   - 📘 **[Render - Guía Completa](GUIA_DESPLIEGUE_RENDER.md)** ← Recomendado para principiantes
   - 📙 **[Railway - Guía Rápida](GUIA_DESPLIEGUE_RAILWAY.md)** ← Mejor experiencia
   - 📋 **[Resumen de Opciones](DESPLIEGUE_NUBE.md)** ← Comparativa completa
   - ✅ **[Checklist Pre-Despliegue](CHECKLIST_DESPLIEGUE.md)** ← Verifica antes de desplegar

### 📦 Archivos de Configuración

El proyecto incluye:
- ✅ `render.yaml` - Configuración automática para Render
- ✅ `BE/init-db.js` - Script de inicialización de PostgreSQL
- ✅ `.gitignore` - Protección de archivos sensibles
- ✅ `BE/.env.example` - Template de variables de entorno

### 💰 Costos Estimados

- **Render:** Gratis (backend duerme tras 15min inactividad, DB gratis 90 días)
- **Railway:** $5 USD crédito/mes (suficiente para proyectos pequeños)
- **Vercel (solo frontend):** Gratis permanente

**¡Tu app puede estar online en menos de 10 minutos!** 🎉

---

## 📡 API Endpoints (Backend)

### Autenticación
- `POST /auth/register` - Registro (body: `{ email, password, name }`)
- `POST /auth/login` - Login (body: `{ email, password }`) → retorna `{ token, user }`
- `GET /auth/google` - Inicia OAuth con Google
- `GET /auth/google/callback` - Callback de Google OAuth
- `GET /auth/logout` - Cerrar sesión (OAuth)

### Proxy a PokeAPI
- `GET /api/pokemon` - Listar Pokémon (query: `limit`, `offset`, `name`)
- `GET /api/pokemon/:id` - Detalle de Pokémon
- `GET /api/pokemon-species/:id` - Especie del Pokémon
- `GET /api/pokemon-evolution/:id` - Cadena evolutiva

### Favoritos
- `GET /api/favorites` - Obtener favoritos del usuario (requiere auth)
- `POST /api/favorites` - Agregar favorito (body: `{ pokemon }`)
- `DELETE /api/favorites/:id` - Eliminar favorito

### Equipos
- `GET /api/teams` - Obtener equipos del usuario
- `POST /api/teams` - Crear equipo (body: `{ team }`)
- `PUT /api/teams/:idx` - Actualizar equipo
- `DELETE /api/teams/:idx` - Eliminar equipo

### Amigos
- `GET /api/friends` - Obtener lista de amigos
- `POST /api/friends/add` - Agregar amigo (body: `{ code }`)

### Batallas
- `POST /api/battle/simulate` - Simular batalla (body: `{ attacker, defender }`)

---

## 🎯 Funcionalidades implementadas

✅ **Backend con Express y BFF consumiendo PokeAPI**  
✅ **Autenticación JWT** (email + password)  
✅ **Autenticación Google OAuth 2.0**  
✅ **Registro de usuarios con correo**  
✅ **Favoritos persistentes por usuario**  
✅ **Administración de características de Pokémon favoritos** (agregar/eliminar)  
✅ **Creación y administración de equipos** (máx 6 Pokémon por equipo)  
✅ **Filtros completos**: tipo, región y nombre  
✅ **Detalles de Pokémon**: especie, estadísticas y línea evolutiva  
✅ **Sistema de amigos mediante código único**  
✅ **Batallas entre amigos** (simulación con estadísticas y tipos)  
✅ **Frontend Vue 3 con router y diseño Pokémon**  
✅ **Diseño con tema Pokémon** (rojo, azul, amarillo, verde)  
✅ **Uso de archivos `.env`**  
✅ **Documentación completa en README**  

### Detalles adicionales implementados:
- ✅ **Header Pokémon** con logo Pokéball y tarjeta de entrenador
- ✅ **Navegación animada** con iconos y efectos hover
- ✅ **Carga optimizada** de Pokémon en lotes de 20
- ✅ **Grid responsivo** con tarjetas de Pokémon estilizadas
- ✅ **Animaciones CSS**: spin, pulse, heartbeat, bounce
- ✅ **Sistema de login dual**: email/password + Google OAuth
- ✅ **Persistencia en JSON** para desarrollo rápido  

---

## 🛠️ Tecnologías utilizadas

### Backend
- Node.js + Express
- axios (consumo de PokeAPI)
- bcryptjs (hashing de passwords)
- jsonwebtoken (JWT)
- dotenv (variables de entorno)
- Persistencia simple con JSON (`data/db.json`)

### Frontend
- Vue 3 + Vue Router
- Vite (build tool)
- Fetch API (comunicación con backend)

---

## 📝 Notas

- La persistencia usa un archivo JSON simple (`BE/data/db.json`) para facilitar el desarrollo. En producción, considera usar una base de datos (MongoDB, PostgreSQL, etc.).
- Los filtros avanzados (tipo 1, tipo 2, región) pueden implementarse consultando endpoints adicionales de PokeAPI.
- La línea evolutiva se puede expandar usando el endpoint `/api/pokemon-evolution/:id`.
- Las batallas usan un algoritmo simplificado basado en estadísticas base; puedes mejorarlo considerando tipos, ataques y mecánicas más complejas.

---

## 🚧 Próximas mejoras

- **Filtros avanzados**: tipo 1, tipo 2, región, generación
- **Búsqueda mejorada**: autocompletado, sugerencias
- **Línea evolutiva visual**: mostrar cadena completa con sprites
- **Simulación de batallas avanzada**: tipos, ataques, efectividad, habilidades
- **Paginación completa** en el explorador
- **Sprites animados** y artwork oficial de alta calidad
- **Validación de formularios** (frontend y backend)
- **Tests**: unitarios (Jest/Vitest) e integración (Supertest)
- **Persistencia robusta**: migrar a MongoDB/PostgreSQL
- **Deploy**: Vercel (frontend), Railway/Render (backend)
- **Optimización**: lazy loading, caching de PokeAPI
- **UI/UX**: transiciones, loading states, toasts/notifications

---

## 🎮 Cómo empezar

1. **Arranca el backend** (terminal 1):
   ```bash
   cd BE
   node index.js
   ```

2. **Arranca el frontend** (terminal 2):
   ```bash
   cd pokedex
   npx vite
   ```

3. **Abre el navegador** en `http://localhost:5174` (o el puerto que indique Vite)

4. **Regístrate** en `/register` con un email y password

5. **Explora Pokémon**, agrega favoritos, crea equipos y simula batallas!

---

## 📄 Licencia

ISC

---

**¡Explora, colecciona y batalla!** 🎮
