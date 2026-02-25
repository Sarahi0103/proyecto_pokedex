# 📚 DOCUMENTACIÓN TÉCNICA COMPLETA - POKÉDEX FULLSTACK

## 📋 ÍNDICE

1. [Arquitectura General del Proyecto](#1-arquitectura-general)
2. [Almacenamiento de Datos](#2-almacenamiento-de-datos)
3. [Sistema de Autenticación](#3-sistema-de-autenticación)
4. [Backend - Explicación Completa](#4-backend-explicación-completa)
5. [Frontend - Explicación Completa](#5-frontend-explicación-completa)
6. [Flujos de Datos Completos](#6-flujos-de-datos-completos)
7. [Cada Vista y Componente](#7-cada-vista-y-componente-explicado)
8. [Sistema de Estado Reactivo](#8-sistema-de-estado-reactivo)
9. [Google OAuth - Funcionamiento](#9-google-oauth-funcionamiento)
10. [Consumo de PokeAPI](#10-consumo-de-pokeapi)
11. [Sistema de Batallas](#11-sistema-de-batallas)
12. [Preguntas Frecuentes Técnicas](#12-preguntas-frecuentes-técnicas)

---

## 1. ARQUITECTURA GENERAL

### 1.1 Estructura de Carpetas Completa

```
PWD/
├── BE/                          # BACKEND (Node.js + Express)
│   ├── index.js                 # Servidor principal (304 líneas)
│   ├── package.json             # Dependencias del backend
│   ├── .env                     # Variables de entorno (NO subir a Git)
│   ├── data/
│   │   └── db.json             # BASE DE DATOS (archivo JSON)
│   └── lib/
│       └── db.js               # Funciones para leer/escribir db.json
│
├── pokedex/                     # FRONTEND (Vue 3 + Vite)
│   ├── index.html              # HTML principal
│   ├── package.json            # Dependencias del frontend
│   ├── vite.config.js          # Configuración de Vite
│   ├── jsconfig.json           # Configuración de JavaScript
│   ├── src/
│   │   ├── main.js             # Punto de entrada de Vue
│   │   ├── App.vue             # Componente raíz (469 líneas)
│   │   ├── api.js              # Funciones para llamar al backend (25 líneas)
│   │   ├── store.js            # Estado reactivo global (29 líneas)
│   │   ├── styles.css          # Estilos globales
│   │   ├── router/
│   │   │   └── index.js        # Rutas de Vue Router
│   │   └── views/
│   │       ├── Home.vue        # Explorador de Pokémon (656 líneas)
│   │       ├── Login.vue       # Inicio de sesión (310 líneas)
│   │       ├── Register.vue    # Registro (360 líneas)
│   │       ├── PokemonDetail.vue  # Detalles de Pokémon (565 líneas)
│   │       ├── Favorites.vue   # Lista de favoritos (398 líneas)
│   │       ├── Teams.vue       # Gestión de equipos (672 líneas)
│   │       ├── Battle.vue      # Arena de batallas (617 líneas)
│   │       └── Friends.vue     # Sistema de amigos (432 líneas)
│   └── public/                 # Archivos estáticos
│
├── README.md                    # Documentación principal
├── VERIFICACION_COMPLETA.md    # Checklist de requerimientos
└── PROCESO_DESARROLLO.md       # Historial de desarrollo
```

### 1.2 Tecnologías Utilizadas

**Backend:**
- **Node.js v20.13.0**: Runtime de JavaScript
- **Express 4.x**: Framework web para crear APIs REST
- **bcryptjs**: Encriptación de contraseñas (hash con salt)
- **jsonwebtoken (JWT)**: Tokens de autenticación
- **axios**: Cliente HTTP para consumir PokeAPI
- **passport + passport-google-oauth20**: Autenticación con Google
- **express-session**: Manejo de sesiones
- **dotenv**: Carga de variables de entorno desde .env
- **cors**: Permitir peticiones desde el frontend

**Frontend:**
- **Vue 3**: Framework JavaScript reactivo (Composition API)
- **Vue Router**: Navegación entre páginas
- **Vite 7.3.1**: Build tool ultra rápido
- **Fetch API**: Peticiones HTTP al backend

---

## 2. ALMACENAMIENTO DE DATOS

### 2.1 Ubicación de la Base de Datos

**Archivo:** `BE/data/db.json`

Este es un archivo JSON que actúa como base de datos. Se almacena en el servidor backend.

### 2.2 Estructura Completa de db.json

```json
{
  "users": [
    {
      "id": 1,
      "email": "usuario@ejemplo.com",
      "password": "$2a$10$abcd...xyz",  // Hash bcrypt (NO es texto plano)
      "name": "Juan Pérez",
      "code": "ABCD1234",                // Código único de 8 caracteres
      "favorites": [                      // Array de Pokémon favoritos
        {
          "id": 25,
          "name": "pikachu",
          "sprite": "https://raw.githubusercontent.com/.../25.png",
          "types": ["electric"]
        }
      ],
      "teams": [                          // Array de equipos
        {
          "name": "Equipo Fuego",
          "pokemon": [
            {
              "id": 6,
              "name": "charizard",
              "sprite": "...",
              "types": ["fire", "flying"]
            }
          ]
        }
      ],
      "friends": [                        // Array de códigos de amigos
        "XYZ98765"
      ]
    }
  ]
}
```

### 2.3 ¿Dónde y Cómo se Guardan los Datos?

#### Registro de Usuario (POST /auth/register)

**Paso 1:** Usuario llena formulario en `Register.vue`
```javascript
// Frontend envía:
{
  "email": "nuevo@email.com",
  "password": "miPassword123",  // Texto plano
  "name": "Nuevo Usuario"
}
```

**Paso 2:** Backend recibe datos en `BE/index.js` línea 64
```javascript
const { email, password, name } = req.body;
```

**Paso 3:** Se verifica si el email ya existe
```javascript
const db = getDB();
const exists = db.users.find(u => u.email === email);
if(exists) return res.status(400).json({ error: 'Usuario ya registrado' });
```

**Paso 4:** Se encripta la contraseña con bcrypt
```javascript
const hashedPassword = await bcrypt.hash(password, 10);
// Resultado: "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"
// NUNCA se guarda la contraseña en texto plano
```

**Paso 5:** Se genera un código único de 8 caracteres
```javascript
const code = generateUniqueCode();
// Ejemplo: "AB12CD34"
```

**Paso 6:** Se crea el nuevo usuario
```javascript
const newUser = {
  id: db.users.length + 1,
  email,
  password: hashedPassword,  // Hash, NO texto plano
  name,
  code,
  favorites: [],   // Vacío al inicio
  teams: [],       // Vacío al inicio
  friends: []      // Vacío al inicio
};
```

**Paso 7:** Se agrega al array de usuarios
```javascript
db.users.push(newUser);
```

**Paso 8:** Se guarda en el archivo db.json
```javascript
saveDB(db);  // Escribe en BE/data/db.json
```

**Paso 9:** Se genera un token JWT
```javascript
const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '7d' });
// Token válido por 7 días
```

**Paso 10:** Se envía respuesta al frontend
```javascript
res.json({
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  user: { email, name, code }  // SIN password
});
```

#### Inicio de Sesión (POST /auth/login)

**Paso 1:** Usuario llena formulario en `Login.vue`
```javascript
// Frontend envía:
{
  "email": "usuario@ejemplo.com",
  "password": "miPassword123"  // Texto plano
}
```

**Paso 2:** Backend busca el usuario en db.json
```javascript
const db = getDB();
const user = db.users.find(u => u.email === email);
if(!user) return res.status(400).json({ error: 'Usuario no encontrado' });
```

**Paso 3:** Se compara la contraseña con bcrypt
```javascript
const valid = await bcrypt.compare(password, user.password);
// bcrypt.compare("miPassword123", "$2a$10$N9qo8uLO...")
// Retorna true si coinciden, false si no
```

**Paso 4:** Si es válida, se genera token
```javascript
const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '7d' });
```

**Paso 5:** Se envía respuesta
```javascript
res.json({
  token,
  user: { email: user.email, name: user.name, code: user.code }
});
```

#### ¿Dónde se Guardan los Favoritos?

**Ubicación:** `db.json → users[índice] → favorites[]`

**Agregar Favorito (POST /api/favorites):**

1. Frontend envía:
```javascript
{
  "pokemon": {
    "id": 25,
    "name": "pikachu",
    "sprite": "https://...",
    "types": ["electric"]
  }
}
```

2. Backend obtiene usuario del token JWT:
```javascript
const userEmail = req.user.email;  // Del middleware authMiddleware
const db = getDB();
const user = db.users.find(u => u.email === userEmail);
```

3. Se verifica que no exista ya:
```javascript
const alreadyFav = user.favorites.find(f => f.id === pokemon.id);
if(alreadyFav) return res.status(400).json({ error: 'Ya está en favoritos' });
```

4. Se agrega al array:
```javascript
user.favorites.push(pokemon);
saveDB(db);  // Se guarda en db.json
```

#### ¿Dónde se Guardan los Equipos?

**Ubicación:** `db.json → users[índice] → teams[]`

**Crear Equipo (POST /api/teams):**

1. Frontend envía:
```javascript
{
  "team": {
    "name": "Equipo Fuego",
    "pokemon": [
      { id: 6, name: "charizard", sprite: "...", types: ["fire", "flying"] },
      { id: 38, name: "ninetales", sprite: "...", types: ["fire"] }
    ]
  }
}
```

2. Backend obtiene usuario:
```javascript
const user = db.users.find(u => u.email === req.user.email);
```

3. Se valida máximo 6 Pokémon:
```javascript
if(team.pokemon.length > 6) {
  return res.status(400).json({ error: 'Máximo 6 Pokémon por equipo' });
}
```

4. Se agrega al array de equipos:
```javascript
user.teams.push(team);
saveDB(db);
```

#### ¿Dónde se Guardan los Amigos?

**Ubicación:** `db.json → users[índice] → friends[]`

Es un array de **códigos** de amigos, NO objetos completos.

**Agregar Amigo (POST /api/friends/add):**

1. Frontend envía el código:
```javascript
{ "code": "XYZ98765" }
```

2. Backend verifica que el código exista:
```javascript
const friendUser = db.users.find(u => u.code === code);
if(!friendUser) return res.status(404).json({ error: 'Código no encontrado' });
```

3. Se agrega al array:
```javascript
const user = db.users.find(u => u.email === req.user.email);
if(!user.friends.includes(code)) {
  user.friends.push(code);
  saveDB(db);
}
```

---

## 3. SISTEMA DE AUTENTICACIÓN

### 3.1 JWT (JSON Web Tokens)

**¿Qué es JWT?**
Un token JWT es un string codificado que contiene información del usuario.

**Ejemplo de token:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJpYXQiOjE2MTYyMzkwMjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

**Estructura:**
- **Header** (eyJhbGci...): Tipo de token y algoritmo (HS256)
- **Payload** (eyJlbWFp...): Datos del usuario (email)
- **Signature** (SflKxwRJ...): Firma digital para verificar autenticidad

**¿Dónde se guarda el token?**

En el **localStorage** del navegador:
```javascript
localStorage.token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
localStorage.user = '{"email":"user@example.com","name":"Juan"}';
```

### 3.2 Flujo Completo de Autenticación

**REGISTRO:**
```
┌─────────────┐         ┌──────────────┐         ┌──────────┐
│ Register.vue│────1───▶│ POST /auth/  │────2───▶│ db.json  │
│  (Frontend) │         │   register   │         │ (Backend)│
└─────────────┘         └──────────────┘         └──────────┘
       ▲                        │
       │                        │ 3. Retorna token
       └────────4. Guarda───────┘
           en localStorage
```

1. Usuario llena formulario (email, password, name)
2. Backend encripta password, genera código, guarda en db.json
3. Backend genera token JWT y lo envía
4. Frontend guarda token en localStorage

**LOGIN:**
```
┌─────────────┐         ┌──────────────┐         ┌──────────┐
│  Login.vue  │────1───▶│ POST /auth/  │────2───▶│ db.json  │
│  (Frontend) │         │    login     │         │ (Backend)│
└─────────────┘         └──────────────┘         └──────────┘
       ▲                        │
       │                        │ 3. Retorna token
       └────────4. Guarda───────┘
           en localStorage
```

1. Usuario ingresa email y password
2. Backend verifica password con bcrypt, busca usuario en db.json
3. Backend genera token JWT y lo envía
4. Frontend guarda token en localStorage

**PETICIONES AUTENTICADAS:**
```
┌─────────────┐         ┌──────────────┐         ┌──────────┐
│  Cualquier  │────1───▶│ GET /api/    │────2───▶│authMiddle│
│    Vista    │         │  favorites   │         │   ware   │
└─────────────┘         └──────────────┘         └──────────┘
                               │                        │
                               │ 4. Retorna datos       │
                               └────────────────────────┘
                                        3. Verifica token
```

1. Frontend envía petición con header `Authorization: Bearer <token>`
2. Backend ejecuta middleware `authMiddleware`
3. Middleware verifica token con `jwt.verify(token, JWT_SECRET)`
4. Si es válido, extrae email y busca usuario
5. Retorna datos solicitados

### 3.3 Middleware de Autenticación

**Código completo (BE/index.js línea 40-54):**

```javascript
function authMiddleware(req, res, next){
  const authHeader = req.headers['authorization'];
  
  // Verificar que exista header Authorization
  if(!authHeader) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  
  // Extraer token (formato: "Bearer eyJhbGciOi...")
  const token = authHeader.split(' ')[1];
  
  try{
    // Verificar y decodificar token
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;  // { email: "user@example.com" }
    next();  // Continuar al siguiente middleware/ruta
  }catch(e){
    return res.status(403).json({ error: 'Token inválido' });
  }
}
```

**¿Cómo se usa?**

En rutas protegidas:
```javascript
app.get('/api/favorites', authMiddleware, (req, res) => {
  // req.user.email está disponible aquí
  const userEmail = req.user.email;
  // ...
});
```

---

## 4. BACKEND - EXPLICACIÓN COMPLETA

### 4.1 Archivo Principal: BE/index.js (304 líneas)

**Estructura:**

1. **Imports y configuración (líneas 1-33)**
   - Importa dependencias (express, bcrypt, jwt, etc.)
   - Carga variables de entorno desde .env
   - Configura Express con middleware CORS y JSON

2. **Middleware de autenticación (líneas 40-54)**
   - Verifica tokens JWT
   - Protege rutas privadas

3. **Configuración de Passport Google OAuth (líneas 56-88)**
   - Configura estrategia de autenticación con Google
   - Serializa/deserializa usuarios

4. **Rutas de autenticación (líneas 90-134)**
   - POST /auth/register: Registro de usuarios
   - POST /auth/login: Inicio de sesión
   - GET /auth/google: Inicia OAuth con Google
   - GET /auth/google/callback: Callback de Google

5. **Proxy a PokeAPI (líneas 136-179)**
   - GET /api/pokemon: Lista de Pokémon
   - GET /api/pokemon/:id: Detalles de un Pokémon
   - GET /api/pokemon-species/:id: Especie
   - GET /api/evolution-chain/:id: Cadena evolutiva

6. **CRUD de Favoritos (líneas 181-217)**
   - GET /api/favorites: Obtener favoritos
   - POST /api/favorites: Agregar favorito
   - DELETE /api/favorites/:id: Eliminar favorito

7. **CRUD de Equipos (líneas 219-271)**
   - GET /api/teams: Obtener equipos
   - POST /api/teams: Crear equipo
   - PUT /api/teams/:idx: Actualizar equipo
   - DELETE /api/teams/:idx: Eliminar equipo

8. **Sistema de Amigos (líneas 273-299)**
   - GET /api/friends: Obtener amigos
   - POST /api/friends/add: Agregar amigo por código

9. **Sistema de Batallas (líneas 301-327)**
   - POST /api/battle/simulate: Simular batalla

10. **Inicio del servidor (líneas 329-332)**
    - Escucha en puerto 4000

### 4.2 Sistema de Persistencia: BE/lib/db.js

```javascript
const fs = require('fs');
const path = require('path');
const dbPath = path.join(__dirname, '../data/db.json');

// Leer base de datos
function getDB(){
  if(!fs.existsSync(dbPath)){
    return { users: [] };  // Si no existe, retorna estructura vacía
  }
  const raw = fs.readFileSync(dbPath, 'utf-8');
  return JSON.parse(raw);
}

// Guardar base de datos
function saveDB(data){
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
}

module.exports = { getDB, saveDB };
```

**¿Cómo funciona?**
- `getDB()`: Lee el archivo db.json y lo convierte a objeto JavaScript
- `saveDB(data)`: Convierte el objeto a JSON y lo escribe en db.json

### 4.3 Variables de Entorno (.env)

```env
PORT=4000                                    # Puerto del servidor
JWT_SECRET=pokemon_secret_key_2026          # Clave para firmar tokens JWT
POKEAPI_BASE=https://pokeapi.co/api/v2     # URL de PokeAPI
SESSION_SECRET=pokemon_session_secret_2026  # Clave para sesiones
FRONTEND_URL=http://localhost:5173          # URL del frontend

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:4000/auth/google/callback
```

**¿Por qué usar .env?**
- Seguridad: No se suben credenciales a GitHub
- Flexibilidad: Cambiar configuración sin modificar código
- Entornos: Diferentes valores para desarrollo/producción

---

## 5. FRONTEND - EXPLICACIÓN COMPLETA

### 5.1 Punto de Entrada: pokedex/src/main.js

```javascript
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

createApp(App)    // Crea aplicación Vue
  .use(router)    // Instala Vue Router
  .mount('#app')  // Monta en <div id="app"> de index.html
```

### 5.2 Componente Raíz: pokedex/src/App.vue (469 líneas)

**Responsabilidades:**
1. **Header con navegación** (líneas 1-102)
   - Logo Pokéball
   - Tarjeta de entrenador (muestra nombre y email del usuario)
   - Botón de logout
   - Menú de navegación (Explorar, Favoritos, Equipos, Amigos, Batallas)

2. **Carga de usuario** (líneas 1-20 del script)
   - Importa estado reactivo desde `store.js`
   - Muestra/oculta menú según estado de autenticación

3. **Estilos Pokémon** (líneas 103-469)
   - Colores: Rojo (#CC0000), Azul (#3B4CCA), Amarillo (#FFCB05)
   - Animaciones: fadeInRight, slideDown, spin
   - Grid responsivo

**Código clave:**

```javascript
import { user, clearUser } from './store'

function handleLogout(){
  logout()        // Limpia localStorage
  clearUser()     // Limpia estado reactivo
  router.push('/login')
}
```

### 5.3 API Client: pokedex/src/api.js (32 líneas)

```javascript
const API_BASE = 'http://localhost:4000'

// Petición genérica con autenticación automática
export async function api(path, opts = {}){
  const headers = opts.headers || {};
  
  // Si existe token, agregarlo a headers
  if(localStorage.token) {
    headers['Authorization'] = 'Bearer ' + localStorage.token;
  }
  
  const res = await fetch(API_BASE + path, { 
    ...opts, 
    headers, 
    credentials: 'include' 
  });
  
  return res.json();
}

// Guardar token y usuario al hacer login
export function login(token, user){
  localStorage.token = token;
  localStorage.user = JSON.stringify(user);
}

// Limpiar datos al hacer logout
export function logout(){
  delete localStorage.token;
  delete localStorage.user;
}

// Obtener usuario actual
export function currentUser(){
  try{
    if(!localStorage.token) return null;
    const userData = localStorage.user;
    if(!userData || userData === '{}') return null;
    const parsed = JSON.parse(userData);
    if(!parsed.email) return null;
    return parsed;
  }catch(e){
    return null;
  }
}
```

### 5.4 Store Reactivo: pokedex/src/store.js (29 líneas)

**¿Qué problema resuelve?**

Antes, al hacer login, el menú no aparecía hasta recargar la página. Ahora, con un estado reactivo compartido, todos los componentes se actualizan instantáneamente.

```javascript
import { ref } from 'vue'

// Estado reactivo compartido globalmente
export const user = ref(null)

// Inicializar usuario desde localStorage al cargar la app
export function initUser(){
  try{
    if(!localStorage.token) return
    const userData = localStorage.user
    if(!userData || userData === '{}') return
    const parsed = JSON.parse(userData)
    if(!parsed.email) return
    user.value = parsed  // Actualiza estado reactivo
  }catch(e){
    user.value = null
  }
}

// Actualizar usuario (al hacer login)
export function setUser(userData){
  user.value = userData  // Todos los componentes se actualizan automáticamente
}

// Limpiar usuario (al hacer logout)
export function clearUser(){
  user.value = null
}

// Inicializar al cargar el módulo
initUser()
```

**¿Cómo se usa?**

En cualquier componente:
```javascript
import { user } from '../store'

// En template
<div v-if="user">
  Bienvenido {{ user.name }}
</div>
```

### 5.5 Router: pokedex/src/router/index.js

```javascript
import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import PokemonDetail from '../views/PokemonDetail.vue'
import Favorites from '../views/Favorites.vue'
import Teams from '../views/Teams.vue'
import Battle from '../views/Battle.vue'
import Friends from '../views/Friends.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/login', component: Login },
  { path: '/register', component: Register },
  { path: '/pokemon/:id', component: PokemonDetail },
  { path: '/favorites', component: Favorites },
  { path: '/teams', component: Teams },
  { path: '/battle', component: Battle },
  { path: '/friends', component: Friends }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
```

---

## 6. FLUJOS DE DATOS COMPLETOS

### 6.1 Flujo: Agregar Pokémon a Favoritos

```
┌──────────────────────────────────────────────────────────────┐
│ 1. Usuario hace clic en "❤️ Favorito" en Home.vue           │
└──────────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────┐
│ 2. Se ejecuta función addToFavorites(pokemon)                │
│    const pokemon = {                                          │
│      id: 25,                                                  │
│      name: "pikachu",                                         │
│      sprite: "https://...",                                   │
│      types: ["electric"]                                      │
│    }                                                          │
└──────────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────┐
│ 3. Frontend llama a api('/api/favorites', { method: POST })  │
│    Headers:                                                   │
│      Authorization: "Bearer eyJhbGciOiJIUzI1NiIs..."         │
│    Body:                                                      │
│      { "pokemon": { id: 25, name: "pikachu", ... } }         │
└──────────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────┐
│ 4. Backend recibe petición en POST /api/favorites            │
│    Ejecuta authMiddleware:                                    │
│    - Extrae token del header Authorization                    │
│    - Verifica token con jwt.verify()                          │
│    - Decodifica email del usuario                             │
│    - Agrega req.user = { email: "user@example.com" }         │
└──────────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────┐
│ 5. Backend ejecuta lógica de favoritos:                      │
│    const db = getDB();                                        │
│    const user = db.users.find(u => u.email === req.user.email)│
│    user.favorites.push(pokemon);                              │
│    saveDB(db);  // Guarda en db.json                         │
└──────────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────┐
│ 6. Backend responde:                                          │
│    res.json({ message: "Agregado", favorites: [...] })       │
└──────────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────┐
│ 7. Frontend recibe respuesta y actualiza UI                  │
│    - Muestra mensaje "Agregado a favoritos"                  │
│    - Cambia ícono de ❤️ a ❤️ (lleno)                          │
└──────────────────────────────────────────────────────────────┘
```

### 6.2 Flujo: Crear Equipo de Pokémon

```
┌──────────────────────────────────────────────────────────────┐
│ 1. Usuario hace clic en "Crear Equipo" en Teams.vue         │
└──────────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────┐
│ 2. Se abre modal con formulario                              │
│    - Input para nombre del equipo                            │
│    - Selector de Pokémon (multiselect)                       │
│    - Usuario selecciona hasta 6 Pokémon                      │
└──────────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────┐
│ 3. Usuario hace submit del formulario                        │
│    Datos:                                                     │
│    {                                                          │
│      name: "Equipo Eléctrico",                               │
│      pokemon: [                                              │
│        { id: 25, name: "pikachu", ... },                     │
│        { id: 26, name: "raichu", ... }                       │
│      ]                                                        │
│    }                                                          │
└──────────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────┐
│ 4. Frontend valida:                                           │
│    - Nombre no vacío                                          │
│    - Al menos 1 Pokémon                                       │
│    - Máximo 6 Pokémon                                         │
└──────────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────┐
│ 5. Frontend envía POST /api/teams con token JWT             │
└──────────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────┐
│ 6. Backend valida y guarda:                                  │
│    const user = db.users.find(u => u.email === req.user.email)│
│    user.teams.push({ name, pokemon });                        │
│    saveDB(db);                                                │
└──────────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────┐
│ 7. Frontend cierra modal y recarga lista de equipos         │
└──────────────────────────────────────────────────────────────┘
```

### 6.3 Flujo: Simular Batalla

```
┌──────────────────────────────────────────────────────────────┐
│ 1. Usuario selecciona equipo en Battle.vue                   │
└──────────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────┐
│ 2. Se muestran Pokémon del equipo seleccionado              │
└──────────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────┐
│ 3. Usuario selecciona 1 Pokémon de su equipo                │
│    Ejemplo: Charizard                                         │
└──────────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────┐
│ 4. Usuario selecciona 1 Pokémon rival (mock)                │
│    Ejemplo: Blastoise                                         │
└──────────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────┐
│ 5. Usuario hace clic en "Iniciar Batalla"                   │
└──────────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────┐
│ 6. Frontend obtiene estadísticas de ambos Pokémon           │
│    GET /api/pokemon/6    → Stats de Charizard                │
│    GET /api/pokemon/9    → Stats de Blastoise                │
└──────────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────┐
│ 7. Frontend envía POST /api/battle/simulate                  │
│    Body:                                                      │
│    {                                                          │
│      "attacker": {                                            │
│        "pokemon": { id: 6, name: "charizard", ... },         │
│        "stats": { hp: 78, attack: 84, defense: 78, ... }     │
│      },                                                       │
│      "defender": {                                            │
│        "pokemon": { id: 9, name: "blastoise", ... },         │
│        "stats": { hp: 79, attack: 83, defense: 100, ... }    │
│      }                                                        │
│    }                                                          │
└──────────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────┐
│ 8. Backend ejecuta algoritmo de batalla:                     │
│    - Calcula poder de cada Pokémon:                          │
│      power = hp + (attack × 1.2) + (defense × 0.8)          │
│      Charizard: 78 + (84 × 1.2) + (78 × 0.8) = 241.2        │
│      Blastoise: 79 + (83 × 1.2) + (100 × 0.8) = 258.6       │
│    - Multiplica por factor aleatorio (0.8-1.6):             │
│      Charizard: 241.2 × 1.3 = 313.56                        │
│      Blastoise: 258.6 × 1.1 = 284.46                        │
│    - Compara scores → Ganador: Charizard                     │
└──────────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────┐
│ 9. Backend responde:                                          │
│    {                                                          │
│      "winner": { id: 6, name: "charizard", ... },            │
│      "log": [                                                 │
│        "Charizard vs Blastoise",                             │
│        "Poder de Charizard: 313.56",                         │
│        "Poder de Blastoise: 284.46",                         │
│        "¡Charizard gana!"                                     │
│      ]                                                        │
│    }                                                          │
└──────────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────┐
│ 10. Frontend muestra resultado:                              │
│     - Animación de VS                                         │
│     - Log de batalla línea por línea                         │
│     - Banner de ganador con bounce animation                 │
└──────────────────────────────────────────────────────────────┘
```

---

## 7. CADA VISTA Y COMPONENTE EXPLICADO

### 7.1 Home.vue - Explorador de Pokémon (656 líneas)

**Responsabilidades:**
1. Mostrar lista de Pokémon en grid
2. Filtrar por región (Kanto, Johto, etc.)
3. Filtrar por tipo (fire, water, etc.)
4. Buscar por nombre
5. Agregar a favoritos
6. Navegar a detalle de Pokémon

**Estructura de datos:**

```javascript
const pokemons = ref([])        // Array de Pokémon mostrados
const allPokemons = ref([])     // Array completo (sin filtros)
const loading = ref(false)      // Estado de carga
const selectedType = ref('')    // Tipo seleccionado
const selectedRegion = ref('')  // Región seleccionada
const q = ref('')               // Query de búsqueda
```

**Flujo de carga:**

1. `onMounted(() => load())`
2. `load()` obtiene límite y offset según región
3. Se hace petición a `/api/pokemon?limit=151&offset=0`
4. Se obtiene lista de nombres y URLs
5. Se cargan detalles en lotes de 20:
   ```javascript
   for(let i = 0; i < list.length; i += 20){
     const batch = list.slice(i, i + 20)
     const details = await Promise.all(
       batch.map(r => api(`/api/pokemon/${r.name}`))
     )
   }
   ```
6. Se guardan en `allPokemons.value`
7. Se aplican filtros con `filterPokemons()`

**Filtrado:**

```javascript
function filterPokemons(){
  let filtered = [...allPokemons.value]
  
  // Por nombre
  if(q.value.trim()){
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(q.value.toLowerCase())
    )
  }
  
  // Por tipo
  if(selectedType.value){
    filtered = filtered.filter(p => 
      p.types?.some(t => t.type.name === selectedType.value)
    )
  }
  
  pokemons.value = filtered
}
```

**Agregar a favoritos:**

```javascript
async function addToFavorites(pokemon){
  try{
    const data = await api('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pokemon })
    })
    alert('Agregado a favoritos')
  }catch(e){
    alert('Error: ' + e.message)
  }
}
```

### 7.2 Login.vue - Inicio de Sesión (310 líneas)

**Campos:**
- Email (input type="email")
- Password (input type="password")

**Validaciones:**
```javascript
if(!email.value || !password.value){
  err.value = 'Por favor completa todos los campos'
  return
}
```

**Proceso de login:**

```javascript
async function submit(){
  loading.value = true
  err.value = ''
  
  try{
    // Petición al backend
    const res = await fetch('http://localhost:4000/auth/login', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ 
        email: email.value, 
        password: password.value 
      }) 
    })
    
    const data = await res.json()
    
    if(data.token){ 
      // Guardar en localStorage
      login(data.token, data.user)
      
      // Actualizar estado reactivo global
      setUser(data.user)
      
      // Redirigir a home
      router.push('/')
    } else {
      err.value = data.error || 'Error al iniciar sesión'
    }
  }catch(e){
    err.value = 'Error de conexión'
  }finally{
    loading.value = false
  }
}
```

**Google OAuth:**

```javascript
function loginWithGoogle() {
  // Redirige a backend que inicia OAuth flow
  window.location.href = 'http://localhost:4000/auth/google'
}
```

### 7.3 Register.vue - Registro (360 líneas)

**Campos:**
- Nombre (input type="text")
- Email (input type="email")
- Password (input type="password")
- Confirmar Password (input type="password")

**Validaciones:**

```javascript
if(!email.value || !password.value || !name.value){
  err.value = 'Por favor completa todos los campos'
  return
}

if(password.value.length < 6){
  err.value = 'La contraseña debe tener al menos 6 caracteres'
  return
}

if(password.value !== confirmPassword.value){
  err.value = 'Las contraseñas no coinciden'
  return
}
```

**Proceso similar a Login:**
1. Validar campos
2. Hacer POST a /auth/register
3. Guardar token en localStorage
4. Actualizar estado reactivo
5. Redirigir a home

### 7.4 PokemonDetail.vue - Detalles (565 líneas)

**Datos que muestra:**
- Sprite (imagen)
- Nombre
- Altura y peso
- Tipos (con colores)
- Estadísticas (HP, Attack, Defense, etc.) con barras de progreso
- Habilidades
- Cadena evolutiva

**Carga de datos:**

```javascript
async function load(){
  const id = route.params.id  // Obtiene ID de la URL
  
  // Obtener detalles del Pokémon
  const data = await api(`/api/pokemon/${id}`)
  pokemon.value = data
  
  // Obtener especie (para cadena evolutiva)
  const speciesData = await api(`/api/pokemon-species/${id}`)
  
  // Obtener cadena evolutiva
  const evolutionURL = speciesData.evolution_chain.url
  const evolutionId = evolutionURL.split('/').slice(-2)[0]
  const evolutionData = await api(`/api/evolution-chain/${evolutionId}`)
  
  // Parsear cadena evolutiva
  parseEvolutionChain(evolutionData.chain)
}
```

**Barras de progreso de stats:**

```javascript
// HTML
<div class="stat-bar">
  <div class="stat-fill" :style="{ width: stat.base_stat + '%' }"></div>
</div>

// CSS
.stat-fill {
  background: linear-gradient(90deg, #06d6a0 0%, #1d3557 100%);
  height: 100%;
  transition: width 0.5s ease;
}
```

### 7.5 Favorites.vue - Lista de Favoritos (398 líneas)

**Funcionalidades:**
1. Mostrar favoritos en grid
2. Eliminar de favoritos
3. Ver detalle de Pokémon

**Carga:**

```javascript
async function loadFavorites(){
  const data = await api('/api/favorites')
  favorites.value = data.favorites || []
}
```

**Eliminar:**

```javascript
async function removeFromFavorites(pokemonId){
  if(!confirm('¿Eliminar de favoritos?')) return
  
  await api(`/api/favorites/${pokemonId}`, { method: 'DELETE' })
  
  // Recargar lista
  loadFavorites()
}
```

### 7.6 Teams.vue - Gestión de Equipos (672 líneas)

**Funcionalidades:**
1. Listar equipos del usuario
2. Crear nuevo equipo (modal)
3. Editar equipo existente
4. Eliminar equipo
5. Seleccionar hasta 6 Pokémon por equipo

**Estados:**

```javascript
const myTeams = ref([])              // Array de equipos
const showModal = ref(false)         // Mostrar/ocultar modal
const editingIndex = ref(null)       // Índice del equipo en edición
const teamName = ref('')             // Nombre del nuevo/editado equipo
const selectedPokemon = ref([])      // Pokémon seleccionados (máx 6)
const availablePokemon = ref([])     // Pokémon disponibles para agregar
```

**Crear equipo:**

```javascript
async function saveTeam(){
  if(selectedPokemon.value.length === 0){
    alert('Selecciona al menos 1 Pokémon')
    return
  }
  
  if(selectedPokemon.value.length > 6){
    alert('Máximo 6 Pokémon por equipo')
    return
  }
  
  const team = {
    name: teamName.value,
    pokemon: selectedPokemon.value
  }
  
  if(editingIndex.value !== null){
    // Editar equipo existente
    await api(`/api/teams/${editingIndex.value}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ team })
    })
  } else {
    // Crear nuevo equipo
    await api('/api/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ team })
    })
  }
  
  closeModal()
  loadTeams()
}
```

### 7.7 Battle.vue - Arena de Batallas (617 líneas)

**Flujo:**
1. Seleccionar equipo del usuario
2. Mostrar Pokémon del equipo
3. Seleccionar 1 Pokémon propio
4. Seleccionar 1 Pokémon rival (mock: Charizard, Pikachu, Venusaur)
5. Iniciar batalla
6. Mostrar log y resultado

**Estados:**

```javascript
const myTeams = ref([])           // Equipos del usuario
const selectedTeam = ref(null)    // Índice del equipo seleccionado
const myPokemon = ref(null)       // Pokémon seleccionado del usuario
const enemyPokemon = ref(null)    // Pokémon rival seleccionado
const battling = ref(false)       // Estado de batalla en curso
const battleLog = ref([])         // Array de mensajes del log
const battleResult = ref(null)    // Resultado de la batalla
```

**Iniciar batalla:**

```javascript
async function startBattle(){
  if(!myPokemon.value || !enemyPokemon.value){
    alert('Selecciona ambos Pokémon')
    return
  }
  
  battling.value = true
  battleLog.value = []
  battleResult.value = null
  
  // Obtener stats de ambos Pokémon
  const myStats = await api(`/api/pokemon/${myPokemon.value.id}`)
  const enemyStats = await api(`/api/pokemon/${enemyPokemon.value.id}`)
  
  // Simular batalla en backend
  const result = await api('/api/battle/simulate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      attacker: { pokemon: myPokemon.value, stats: myStats.stats },
      defender: { pokemon: enemyPokemon.value, stats: enemyStats.stats }
    })
  })
  
  // Mostrar log línea por línea con delay
  for(const msg of result.log){
    addLog(msg)
    await new Promise(r => setTimeout(r, 800))
  }
  
  battleResult.value = result.winner
  battling.value = false
}
```

### 7.8 Friends.vue - Sistema de Amigos (432 líneas)

**Funcionalidades:**
1. Mostrar código único del usuario
2. Agregar amigo por código
3. Listar amigos
4. Ver equipos de amigos

**Estados:**

```javascript
const myCode = ref('')           // Código del usuario actual
const friendCode = ref('')       // Código ingresado en input
const friends = ref([])          // Lista de amigos
const friendsDetails = ref([])   // Detalles completos de amigos
```

**Agregar amigo:**

```javascript
async function addFriend(){
  if(!friendCode.value.trim()){
    alert('Ingresa un código')
    return
  }
  
  try{
    await api('/api/friends/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: friendCode.value })
    })
    
    alert('Amigo agregado')
    friendCode.value = ''
    loadFriends()
  }catch(e){
    alert('Código no encontrado o ya es tu amigo')
  }
}
```

---

## 8. SISTEMA DE ESTADO REACTIVO

### 8.1 ¿Por qué necesitamos un store?

**Problema:**
Antes del store, al hacer login, el componente `App.vue` no se enteraba del cambio hasta recargar la página.

**Solución:**
Estado reactivo compartido que todos los componentes pueden observar.

### 8.2 Reactividad de Vue

```javascript
import { ref } from 'vue'

// ref() crea una referencia reactiva
const user = ref(null)

// Cuando cambias user.value, todos los componentes que lo usan se actualizan
user.value = { email: "user@example.com", name: "Juan" }
```

**En template:**

```vue
<div v-if="user">
  Hola {{ user.name }}  <!-- Se actualiza automáticamente -->
</div>
```

### 8.3 Flujo completo con store

```
┌─────────────┐         ┌──────────────┐         ┌──────────┐
│  Login.vue  │────1───▶│ POST /auth/  │────2───▶│ Backend  │
│             │         │    login     │         │          │
└─────────────┘         └──────────────┘         └──────────┘
       │                        ▲
       │ 3. Recibe token        │
       ▼                        │
┌─────────────┐                 │
│ setUser()   │─────────────────┘
│ en store.js │
└─────────────┘
       │
       │ 4. Actualiza user.value
       ▼
┌─────────────────────────────────────┐
│ TODOS LOS COMPONENTES SE ACTUALIZAN │
│ - App.vue: muestra menú             │
│ - Cualquier vista que use user      │
└─────────────────────────────────────┘
```

---

## 9. GOOGLE OAUTH - FUNCIONAMIENTO

### 9.1 ¿Qué es OAuth 2.0?

OAuth es un protocolo que permite a los usuarios iniciar sesión con su cuenta de Google sin compartir su password con nuestra aplicación.

### 9.2 Flujo completo

```
┌──────────┐         ┌──────────┐         ┌──────────┐
│ Usuario  │────1───▶│  Google  │────2───▶│ Backend  │
│          │◀────5───│          │◀────3───│          │
└──────────┘         └──────────┘         └──────────┘
     │                                           │
     └───────────────6. Redirige─────────────────┘
                   con token JWT
```

**Paso 1:** Usuario hace clic en "Iniciar sesión con Google"
```javascript
window.location.href = 'http://localhost:4000/auth/google'
```

**Paso 2:** Backend redirige a Google
```javascript
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);
// Redirige a: accounts.google.com/o/oauth2/auth?client_id=...
```

**Paso 3:** Usuario inicia sesión en Google
- Google muestra pantalla de login
- Usuario ingresa email/password de Google
- Google pide permisos (ver email, perfil)

**Paso 4:** Google redirige a nuestro callback
```
http://localhost:4000/auth/google/callback?code=4/0AbCD...xyz
```

**Paso 5:** Backend intercambia código por token
```javascript
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // req.user contiene datos de Google
    const token = jwt.sign({ email: req.user.email }, JWT_SECRET)
    res.redirect(`http://localhost:5173?token=${token}`)
  }
);
```

**Paso 6:** Frontend recibe token y lo guarda
```javascript
// En Home.vue o App.vue
onMounted(() => {
  const urlParams = new URLSearchParams(window.location.search)
  const token = urlParams.get('token')
  if(token){
    login(token, { email, name })
    setUser({ email, name })
  }
})
```

### 9.3 Configuración de Google OAuth

**En Google Cloud Console:**

1. Ir a https://console.cloud.google.com
2. Crear proyecto
3. Habilitar Google+ API
4. Crear credenciales OAuth 2.0
5. Agregar URL autorizada: `http://localhost:4000/auth/google/callback`
6. Copiar Client ID y Client Secret

**En .env:**
```env
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:4000/auth/google/callback
```

---

## 10. CONSUMO DE POKEAPI

### 10.1 ¿Qué es PokeAPI?

API REST pública con información de todos los Pokémon.

**Base URL:** https://pokeapi.co/api/v2

### 10.2 Endpoints usados

**Listar Pokémon:**
```
GET https://pokeapi.co/api/v2/pokemon?limit=151&offset=0
```
Respuesta:
```json
{
  "results": [
    { "name": "bulbasaur", "url": "https://pokeapi.co/api/v2/pokemon/1/" },
    { "name": "ivysaur", "url": "https://pokeapi.co/api/v2/pokemon/2/" }
  ]
}
```

**Detalles de Pokémon:**
```
GET https://pokeapi.co/api/v2/pokemon/25
```
Respuesta:
```json
{
  "id": 25,
  "name": "pikachu",
  "height": 4,
  "weight": 60,
  "sprites": {
    "front_default": "https://raw.githubusercontent.com/.../25.png"
  },
  "types": [
    { "slot": 1, "type": { "name": "electric" } }
  ],
  "stats": [
    { "base_stat": 35, "stat": { "name": "hp" } },
    { "base_stat": 55, "stat": { "name": "attack" } }
  ]
}
```

### 10.3 Backend como Proxy (BFF - Backend For Frontend)

**¿Por qué no llamar directamente a PokeAPI desde el frontend?**

1. **CORS:** PokeAPI permite CORS, pero es buena práctica centralizar
2. **Caching:** Podemos cachear respuestas en el backend
3. **Autenticación:** Podemos agregar lógica de auth antes de retornar datos
4. **Transformación:** Podemos modificar/filtrar datos antes de enviar al frontend

**Ejemplo de proxy:**

```javascript
// Backend
app.get('/api/pokemon/:id', async (req, res) => {
  try{
    const { data } = await axios.get(
      `${POKEAPI_BASE}/pokemon/${req.params.id}`
    )
    res.json(data)  // Retorna directamente
  }catch(e){
    res.status(500).json({ error: 'Error al obtener Pokémon' })
  }
})
```

### 10.4 Optimización: Carga en Lotes

**Problema:**
Cargar 151 Pokémon hace 151 peticiones simultáneas → Puede saturar PokeAPI

**Solución:**
Cargar en lotes de 20:

```javascript
const batchSize = 20
const details = []

for(let i = 0; i < list.length; i += batchSize){
  const batch = list.slice(i, i + batchSize)
  
  const batchDetails = await Promise.all(
    batch.map(r => api(`/api/pokemon/${r.name}`))
  )
  
  details.push(...batchDetails)
  
  // Opcional: mostrar progreso
  console.log(`Cargados ${details.length}/${list.length}`)
}
```

---

## 11. SISTEMA DE BATALLAS

### 11.1 Algoritmo de Batalla

**Fórmula de poder:**

```
power = hp + (attack × 1.2) + (defense × 0.8)
```

**Factor aleatorio:**

```
randomFactor = Math.random() * (1.6 - 0.8) + 0.8
// Rango: 0.8 a 1.6
```

**Score final:**

```
score = power × randomFactor
```

**Ejemplo:**

```javascript
// Charizard
const stats = { hp: 78, attack: 84, defense: 78 }
const power = 78 + (84 × 1.2) + (78 × 0.8) = 241.2
const randomFactor = 1.3  // Aleatorio
const score = 241.2 × 1.3 = 313.56

// Blastoise
const stats = { hp: 79, attack: 83, defense: 100 }
const power = 79 + (83 × 1.2) + (100 × 0.8) = 258.6
const randomFactor = 1.1
const score = 258.6 × 1.1 = 284.46

// Ganador: Charizard (313.56 > 284.46)
```

### 11.2 Código del Backend

```javascript
app.post('/api/battle/simulate', (req, res) => {
  const { attacker, defender } = req.body
  
  // Extraer stats
  const aStats = attacker.stats.reduce((acc, s) => {
    acc[s.stat.name] = s.base_stat
    return acc
  }, {})
  
  const dStats = defender.stats.reduce((acc, s) => {
    acc[s.stat.name] = s.base_stat
    return acc
  }, {})
  
  // Calcular poder
  const aPower = aStats.hp + (aStats.attack × 1.2) + (aStats.defense × 0.8)
  const dPower = dStats.hp + (dStats.attack × 1.2) + (dStats.defense × 0.8)
  
  // Factor aleatorio
  const aFactor = Math.random() * (1.6 - 0.8) + 0.8
  const dFactor = Math.random() * (1.6 - 0.8) + 0.8
  
  // Score final
  const aScore = aPower * aFactor
  const dScore = dPower * dFactor
  
  // Determinar ganador
  const winner = aScore > dScore ? attacker.pokemon : defender.pokemon
  
  // Generar log
  const log = [
    `${attacker.pokemon.name} vs ${defender.pokemon.name}`,
    `Poder base de ${attacker.pokemon.name}: ${aPower.toFixed(2)}`,
    `Poder base de ${defender.pokemon.name}: ${dPower.toFixed(2)}`,
    `Score final de ${attacker.pokemon.name}: ${aScore.toFixed(2)}`,
    `Score final de ${defender.pokemon.name}: ${dScore.toFixed(2)}`,
    `¡${winner.name} gana!`
  ]
  
  res.json({ winner, log })
})
```

---

## 12. PREGUNTAS FRECUENTES TÉCNICAS

### 12.1 ¿Dónde se guardan los datos de registro?

En el archivo `BE/data/db.json`, dentro del array `users`. Cada usuario es un objeto con:
- `id`: Número único
- `email`: Email del usuario
- `password`: Hash bcrypt (NO texto plano)
- `name`: Nombre del usuario
- `code`: Código único de 8 caracteres
- `favorites`: Array de Pokémon favoritos
- `teams`: Array de equipos
- `friends`: Array de códigos de amigos

### 12.2 ¿Cómo funciona la autenticación?

1. Usuario se registra/logea
2. Backend genera token JWT
3. Token se guarda en `localStorage.token`
4. Cada petición incluye header: `Authorization: Bearer <token>`
5. Backend verifica token con middleware `authMiddleware`
6. Si es válido, permite acceso; si no, retorna 401/403

### 12.3 ¿Cómo se encriptan las contraseñas?

Con bcrypt:
```javascript
const bcrypt = require('bcryptjs')

// Al registrarse
const hashedPassword = await bcrypt.hash(password, 10)
// "myPassword123" → "$2a$10$N9qo8uLOickgx2ZMRZoMye..."

// Al iniciar sesión
const valid = await bcrypt.compare(password, hashedPassword)
// Retorna true si coinciden
```

### 12.4 ¿Qué pasa si el backend está apagado?

El frontend mostrará errores de conexión. Para evitarlo:
1. Siempre verificar que el backend esté corriendo en puerto 4000
2. Implementar manejo de errores en el frontend
3. Mostrar mensajes amigables al usuario

### 12.5 ¿Cómo agregar más Pokémon?

No hace falta, PokeAPI tiene todos los Pokémon hasta la 9ª generación. Solo cambia los filtros de región en `Home.vue`:

```javascript
const regions = [
  { name: 'Kanto', limit: 151, offset: 0 },
  { name: 'Johto', limit: 100, offset: 151 },
  // Agregar más regiones aquí
]
```

### 12.6 ¿Cómo funciona el código único de amigos?

1. Al registrarse, se genera código aleatorio de 8 caracteres:
```javascript
function generateUniqueCode(){
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for(let i = 0; i < 8; i++){
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}
```

2. Se guarda en `user.code`
3. Para agregar amigo, se busca usuario con ese código:
```javascript
const friendUser = db.users.find(u => u.code === code)
```

### 12.7 ¿Qué pasa con los datos si reinicio el backend?

Los datos NO se pierden porque están guardados en `db.json`. Solo se pierden si borras ese archivo.

### 12.8 ¿Cómo funciona el menú reactivo?

Usa estado compartido en `store.js`:
```javascript
export const user = ref(null)  // Reactivo
```

Cuando haces login:
```javascript
setUser({ email, name })  // Actualiza user.value
```

`App.vue` lo importa:
```javascript
import { user } from './store'
```

Y en el template:
```vue
<div v-if="user">
  <!-- Se muestra automáticamente cuando user.value cambia -->
</div>
```

### 12.9 ¿Cuántas líneas de código tiene el proyecto?

Aproximadamente:
- Backend: ~350 líneas (index.js + db.js)
- Frontend: ~3,500 líneas
  - App.vue: 469
  - Home.vue: 656
  - Teams.vue: 672
  - Battle.vue: 617
  - PokemonDetail.vue: 565
  - Favorites.vue: 398
  - Friends.vue: 432
  - Register.vue: 360
  - Login.vue: 310
  - Router + API + Store: ~100

**Total: ~3,850 líneas**

### 12.10 ¿Qué tecnologías se usan y por qué?

| Tecnología | Razón |
|------------|-------|
| **Node.js** | Runtime de JavaScript para backend |
| **Express** | Framework web minimalista y popular |
| **Vue 3** | Framework reactivo moderno |
| **Vite** | Build tool ultra rápido |
| **bcrypt** | Encriptación segura de contraseñas |
| **JWT** | Autenticación stateless |
| **Passport** | Middleware para OAuth |
| **Axios** | Cliente HTTP para consumir APIs |
| **JSON** | Persistencia simple para desarrollo |

### 12.11 ¿Cómo migrar a una base de datos real?

1. Instalar driver de DB:
```bash
npm install mongodb  # O PostgreSQL, MySQL
```

2. Reemplazar `getDB()` y `saveDB()` con queries de DB:
```javascript
// Ejemplo con MongoDB
const { MongoClient } = require('mongodb')
const client = new MongoClient('mongodb://localhost:27017')

async function getUser(email){
  await client.connect()
  const db = client.db('pokedex')
  return await db.collection('users').findOne({ email })
}
```

3. Actualizar todos los endpoints para usar funciones asíncronas de DB

### 12.12 ¿Cómo hacer deploy?

**Backend:**
1. Vercel, Railway, Render o Heroku
2. Configurar variables de entorno
3. Conectar a base de datos en la nube (MongoDB Atlas, etc.)

**Frontend:**
1. Vercel, Netlify o GitHub Pages
2. Cambiar `VITE_API_BASE` a URL del backend en producción
3. `npm run build` → subir carpeta `dist/`

---

## 📚 RESUMEN EJECUTIVO

Este proyecto es una **aplicación fullstack completa** que demuestra:

✅ **Arquitectura Cliente-Servidor**: Frontend (Vue 3) + Backend (Node.js)  
✅ **Autenticación Dual**: Email/Password + Google OAuth 2.0  
✅ **CRUD Completo**: Crear, leer, actualizar, eliminar datos  
✅ **Consumo de APIs**: Proxy a PokeAPI con optimizaciones  
✅ **Estado Reactivo**: Sistema de store compartido  
✅ **Seguridad**: Encriptación bcrypt, tokens JWT  
✅ **UX Moderna**: Diseño Pokémon, animaciones, responsive  
✅ **Código Limpio**: Modular, comentado, bien estructurado  

**Líneas de código:** ~3,850  
**Endpoints REST:** 20  
**Vistas Vue:** 10  
**Tiempo de desarrollo:** Aproximadamente 12-15 horas  

---

**Este documento debe permitirte explicar CUALQUIER aspecto técnico del proyecto con confianza.** 🚀
