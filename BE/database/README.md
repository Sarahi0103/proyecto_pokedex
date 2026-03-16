# 🗄️ Configuración de Base de Datos PostgreSQL - Pokedex

## 📋 Pasos para configurar la base de datos

### **1. Abrir pgAdmin 4**
Ya tienes pgAdmin abierto, perfecto!

### **2. Conectar al servidor PostgreSQL 15**
- En el panel izquierdo, expande "Servers (3)"
- Clic en "PostgreSQL 15"
- Ingresa la contraseña: `123`

### **3. Crear la base de datos "pokedex"**
Veo que ya creaste la base de datos "pokedex" ✅

### **4. Ejecutar el script SQL**
1. **Haz clic derecho** en la base de datos `pokedex`
2. Selecciona **"Query Tool"** (Herramienta de consultas)
3. **Abre el archivo**: `BE/database/schema.sql`
4. **Copia todo el contenido** del archivo
5. **Pégalo** en el Query Tool de pgAdmin
6. **Haz clic en el botón Execute** (▶ icono de play) o presiona `F5`

### **5. Verificar que las tablas se crearon**
Ejecuta esta consulta en el Query Tool:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

Deberías ver:
- ✅ users
- ✅ favorites
- ✅ teams
- ✅ friends

---

## 🔧 Configuración del Backend

El backend ya está configurado con:

### **Variables de entorno** (`.env`)
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pokedex
DB_USER=postgres
DB_PASSWORD=123
```

### **Dependencias instaladas**
✅ `pg` (driver de PostgreSQL)

---

## 🚀 Reiniciar el servidor

Una vez que ejecutes el script SQL en pgAdmin:

1. **Detener el servidor backend** (Ctrl + C en la terminal donde corre)
2. **Reiniciarlo**:
   ```bash
   cd BE
   npm start
   ```

3. Deberías ver:
   ```
   ✅ Conectado a PostgreSQL
   BFF listening on 4000
   ```

---

## 📊 Estructura de la Base de Datos

### **Tabla: users**
- `id` - ID único (auto-incrementable)
- `email` - Email único del usuario
- `password` - Contraseña hasheada (bcrypt)
- `name` - Nombre del usuario
- `code` - Código único para agregar amigos
- `created_at` - Fecha de registro

### **Tabla: favorites**
- `id` - ID único
- `user_id` - Referencia al usuario
- `pokemon_id` - ID del Pokémon
- `pokemon_name` - Nombre del Pokémon
- `pokemon_sprite` - URL de la imagen
- `pokemon_types` - Tipos en formato JSON
- `alias` - Alias opcional personalizado del favorito
- `note` - Nota opcional del favorito
- `created_at` - Fecha de agregado

### **Migraciones disponibles**
- `BE/database/migration_friends_push.sql` - status de amigos + tabla push_subscriptions
- `BE/database/migration_favorites_metadata.sql` - columnas alias y note en favorites

### **Tabla: teams**
- `id` - ID único
- `user_id` - Referencia al usuario
- `team_name` - Nombre del equipo
- `pokemons` - Array de Pokémon en formato JSON
- `created_at` - Fecha de creación

### **Tabla: friends**
- `id` - ID único
- `user_id` - Usuario que agregó
- `friend_id` - Usuario agregado como amigo
- `created_at` - Fecha de amistad
- Restricción: No puedes agregarte a ti mismo
- Relación bidireccional automática

---

## ✅ ¿Todo funcionó?

Prueba registrándote en la aplicación:
1. Ve a `http://localhost:5173/register`
2. Crea un usuario nuevo
3. Agrega favoritos
4. Crea equipos
5. Agrega amigos usando códigos

¡Todo se guardará en PostgreSQL! 🎯
