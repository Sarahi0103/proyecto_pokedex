# 🎮 Sistema de Batallas en Tiempo Real - Pokédex

## ✨ Características Implementadas

### 🔌 Socket.io - Comunicación en Tiempo Real
- ✅ Conexión bidireccional entre cliente y servidor
- ✅ Sincronización automática de estados de batalla
- ✅ Sistema de eventos para cada acción de batalla
- ✅ Reconexión automática en caso de desconexión

### ⚔️ Sistema de Batallas
1. **Validación del Lado del Servidor**
   - Los equipos se validan en el servidor antes de iniciar
   - Los datos de Pokémon se obtienen de la PokéAPI
   - Cache de datos para evitar peticiones repetitivas
   - Validación de movimientos y estadísticas

2. **Cálculo de Daño Oficial**
   - Fórmula oficial de Pokémon Gen 6+:
   ```
   Daño = ((2 × Nivel / 5 + 2) × Poder × Ataque/Defensa / 50 + 2) × Modificadores
   ```
   - Modificadores incluyen:
     - STAB (Same Type Attack Bonus): 1.5x
     - Efectividad de tipo: 0.5x - 2x
     - Golpes críticos: 6.25% de probabilidad, 2x daño
     - Variación aleatoria: 0.85 - 1.0

3. **Sistema de Turnos**
   - Los turnos se determinan por la estadística de Speed
   - Ambos jugadores eligen su movimiento simultáneamente
   - El servidor calcula quién ataca primero
   - Resultados se envían a ambos jugadores en tiempo real

### 🎨 Interfaz de Usuario

1. **Componente HealthBar.vue**
   - Barra de vida animada con transiciones suaves
   - Cambio de color según HP (Verde > Amarillo > Rojo)
   - Animación de brillo constante
   - Animación de pulso cuando HP es bajo

2. **Componente BattleArena.vue**
   - Vista completa de la arena de batalla
   - Sprites de Pokémon con animaciones
   - Animaciones de ataque
   - Animaciones de daño
   - Animaciones de debilitamiento
   - Efectos visuales para golpes críticos

3. **Vista Battle.vue Mejorada**
   - Interfaz de batalla en tiempo real
   - Selector de movimientos
   - Estado de conexión en vivo
   - Log de batalla en tiempo real
   - Notificaciones de eventos

## 📚 Cómo Usar el Sistema

### Para el Usuario:

1. **Crear un Equipo**
   - Ve a la sección "Equipos"
   - Crea un equipo de 1-6 Pokémon
   - Guarda tu equipo

2. **Agregar Amigos**
   - Ve a "Amigos"
   - Agrega amigos usando sus códigos
   - Espera que acepten tu solicitud

3. **Desafiar a un Amigo**
   - Ve a "Batallas"
   - Selecciona tu equipo
   - Selecciona un amigo
   - Envía el desafío

4. **Aceptar un Desafío**
   - Verás notificaciones de nuevos desafíos
   - Selecciona tu equipo
   - Haz clic en "Aceptar"
   - ¡La batalla comenzará automáticamente!

5. **Durante la Batalla**
   - Espera tu turno
   - Selecciona uno de los 4 movimientos disponibles
   - Confirma tu movimiento
   - Observa las animaciones
   - ¡Espera los resultados!

### Estados de Batalla:

- 🟢 **Waiting**: Esperando que ambos jugadores elijan
- ⚙️ **Calculating**: Servidor procesando el turno
- 🎬 **Animating**: Mostrando resultados
- 🏆 **Completed**: Batalla finalizada

## 🔧 Arquitectura Técnica

### Backend (Node.js + Socket.io)

```
BE/
├── index.js              # Servidor Express + Socket.io
└── lib/
    ├── db.js            # Funciones de base de datos
    └── battle-socket.js # Lógica de batallas en tiempo real
```

**Funciones Clave:**
- `setupBattleSocket(io)`: Configura eventos de Socket.io
- `initializeBattle()`: Inicializa estado de batalla
- `calculateDamage()`: Calcula daño con fórmula oficial
- `processTurn()`: Procesa el turno completo
- `checkBattleEnd()`: Verifica si la batalla terminó

### Frontend (Vue 3 + Socket.io Client)

```
pokedex/src/
├── views/
│   └── Battle.vue        # Vista principal de batallas
└── components/
    ├── HealthBar.vue     # Barra de vida animada
    └── BattleArena.vue   # Arena de batalla
```

**Funciones Clave:**
- `initializeSocket()`: Conecta al servidor
- `joinRealtimeBattle()`: Une a una batalla
- `selectMove()`: Selecciona movimiento
- `submitMove()`: Envía movimiento al servidor
- `animateTurnResults()`: Anima resultados

## 🎯 Flujo de Batalla Completo

```
1. Jugador 1 desafía a Jugador 2
   ↓
2. Jugador 2 acepta el desafío
   ↓
3. Ambos se conectan vía Socket.io
   ↓
4. Servidor carga equipos desde PokéAPI
   ↓
5. Servidor envía estado inicial
   ↓
6. TURNO:
   - Ambos eligen movimiento
   - Servidor recibe ambas acciones
   - Servidor calcula daño
   - Servidor determina orden por Speed
   - Servidor ejecuta ataques
   - Servidor envía resultados
   - Clientes animan resultados
   ↓
7. ¿Batalla terminada?
   - NO → Volver a paso 6
   - SÍ → Mostrar ganador
```

## 🚀 Optimizaciones Implementadas

1. **Cache de PokéAPI**
   - Los datos se cachean en memoria
   - Evita peticiones repetidas
   - Mejora rendimiento

2. **Validación del Servidor**
   - Toda lógica crítica en el servidor
   - Imposible hacer trampa
   - Datos seguros y consistentes

3. **Animaciones Eficientes**
   - CSS animations en lugar de JavaScript
   - Transiciones suaves
   - Sin bloqueo del renderizado

4. **Manejo de Desconexiones**
   - Reconexión automática
   - Estado persistente
   - Notificaciones de desconexión

## 🎮 Próximas Mejoras Sugeridas

1. **Tipos y Efectividad**
   - Implementar tabla completa de tipos
   - Calcular efectividad real (2x, 0.5x, 0x)

2. **Más Detalles de Batalla**
   - Efectos de estado (paralizado, quemado, etc.)
   - Habilidades especiales
   - Objetos equipados

3. **Sistema de Rankings**
   - Puntos ELO
   - Tabla de clasificación
   - Historial de batallas

4. **Modos de Juego**
   - Batallas 1v1
   - Batallas 2v2 (Dobles)
   - Torneo automático

5. **Replay de Batallas**
   - Guardar logs completos
   - Reproducir batallas pasadas
   - Compartir replays

## 📝 Notas Técnicas

### Puertos Utilizados:
- Backend: `4000` (HTTP + WebSocket)
- Frontend: `3000` (Desarrollo)

### Dependencias Nuevas:
- **Backend**: `socket.io`
- **Frontend**: `socket.io-client`

### Variables de Entorno:
No se requieren variables adicionales, todo funciona con configuración por defecto.

## 🐛 Debugging

Para ver logs detallados, abre la consola del navegador (F12):
- Eventos de Socket.io
- Estados de batalla
- Acciones de jugadores
- Resultados de turnos

En el servidor, verás:
- Conexiones de jugadores
- Batallas activas
- Cálculos de daño
- Errores

## ✅ Testing

Para probar el sistema:

1. Abre dos ventanas de navegador (o una normal y una incógnita)
2. Inicia sesión con dos usuarios diferentes
3. Crea equipos en ambos
4. Agrégense como amigos
5. Envía un desafío desde uno
6. Acepta desde el otro
7. ¡Disfruta la batalla en tiempo real!

---

## 🎉 ¡Sistema Completo y Funcional!

El sistema de batallas en tiempo real está completamente implementado y listo para usar. Las batallas son justas, animadas, y en tiempo real gracias a Socket.io.

**Desarrollado con:**
- Node.js + Express
- Socket.io
- Vue 3
- PostgreSQL
- PokéAPI
