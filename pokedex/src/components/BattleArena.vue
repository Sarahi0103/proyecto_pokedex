<template>
  <div class="battle-arena">
    <!-- Pokemon del oponente -->
    <div class="pokemon-container opponent">
      <HealthBar
        v-if="opponentPokemon"
        :pokemonName="opponentPokemon.name"
        :currentHP="opponentPokemon.currentHP"
        :maxHP="opponentPokemon.maxHP"
        :level="50"
      />
      <div 
        class="pokemon-sprite opponent-sprite"
        :class="{ 
          'attacking': isAttacking && !isPlayerTurn,
          'damaged': isDamaged && isPlayerTurn,
          'fainted': opponentPokemon && opponentPokemon.fainted
        }"
      >
        <img 
          v-if="opponentPokemon" 
          :src="opponentPokemon.sprite" 
          :alt="opponentPokemon.name"
        />
      </div>
    </div>

    <!-- Pokemon del jugador -->
    <div class="pokemon-container player">
      <div 
        class="pokemon-sprite player-sprite"
        :class="{ 
          'attacking': isAttacking && isPlayerTurn,
          'damaged': isDamaged && !isPlayerTurn,
          'fainted': playerPokemon && playerPokemon.fainted
        }"
      >
        <img 
          v-if="playerPokemon" 
          :src="playerPokemon.sprite" 
          :alt="playerPokemon.name"
        />
      </div>
      <HealthBar
        v-if="playerPokemon"
        :pokemonName="playerPokemon.name"
        :currentHP="playerPokemon.currentHP"
        :maxHP="playerPokemon.maxHP"
        :level="50"
      />
    </div>

    <!-- Efectos de batalla -->
    <div v-if="showEffect" class="battle-effect" :class="effectType">
      <span v-if="effectType === 'critical'">¡Golpe crítico!</span>
      <span v-if="effectType === 'damage'">-{{ damageAmount }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import HealthBar from './HealthBar.vue'

const props = defineProps({
  playerPokemon: {
    type: Object,
    default: null
  },
  opponentPokemon: {
    type: Object,
    default: null
  },
  isPlayerTurn: {
    type: Boolean,
    default: false
  },
  battleResult: {
    type: Object,
    default: null
  }
})

const isAttacking = ref(false)
const isDamaged = ref(false)
const showEffect = ref(false)
const effectType = ref('')
const damageAmount = ref(0)

// Observar resultados de batalla para activar animaciones
watch(() => props.battleResult, (newResult) => {
  if (!newResult) return
  
  // Animación de ataque
  isAttacking.value = true
  
  setTimeout(() => {
    isAttacking.value = false
    isDamaged.value = true
    
    // Mostrar efecto de daño
    if (newResult.damage) {
      damageAmount.value = newResult.damage
      effectType.value = newResult.critical ? 'critical' : 'damage'
      showEffect.value = true
      
      setTimeout(() => {
        showEffect.value = false
      }, 1000)
    }
    
    setTimeout(() => {
      isDamaged.value = false
    }, 500)
  }, 600)
}, { deep: true })
</script>

<style scoped>
.battle-arena {
  position: relative;
  width: 100%;
  max-width: 800px;
  height: 500px;
  background: linear-gradient(to bottom, 
    #87ceeb 0%, 
    #87ceeb 60%, 
    #90EE90 60%, 
    #228B22 100%
  );
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  margin: 0 auto;
}

.pokemon-container {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.pokemon-container.opponent {
  top: 40px;
  right: 80px;
}

.pokemon-container.player {
  bottom: 40px;
  left: 80px;
}

.pokemon-sprite {
  width: 160px;
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
  transition: all 0.3s ease;
}

.pokemon-sprite img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  image-rendering: pixelated;
}

.opponent-sprite img {
  transform: scaleX(-1);
}

/* Animaciones de ataque */
.attacking {
  animation: attack 0.6s ease-out;
}

@keyframes attack {
  0% {
    transform: translateX(0) scale(1);
  }
  50% {
    transform: translateX(-30px) scale(1.1);
  }
  100% {
    transform: translateX(0) scale(1);
  }
}

.player-sprite.attacking {
  animation: attack-player 0.6s ease-out;
}

@keyframes attack-player {
  0% {
    transform: translateX(0) scale(1);
  }
  50% {
    transform: translateX(30px) scale(1.1);
  }
  100% {
    transform: translateX(0) scale(1);
  }
}

/* Animación de daño */
.damaged {
  animation: damage 0.5s ease-out;
}

@keyframes damage {
  0%, 100% {
    transform: translateX(0);
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
  }
  25% {
    transform: translateX(-5px);
    filter: drop-shadow(0 4px 8px rgba(255, 0, 0, 0.8));
  }
  75% {
    transform: translateX(5px);
    filter: drop-shadow(0 4px 8px rgba(255, 0, 0, 0.8));
  }
}

/* Animación de debilitado */
.fainted {
  animation: faint 1s ease-out forwards;
}

@keyframes faint {
  0% {
    opacity: 1;
    transform: translateY(0) rotate(0deg);
  }
  100% {
    opacity: 0;
    transform: translateY(30px) rotate(-90deg);
  }
}

/* Efectos de batalla */
.battle-effect {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 32px;
  font-weight: bold;
  color: white;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
  animation: effect-popup 1s ease-out forwards;
  pointer-events: none;
  z-index: 10;
}

.battle-effect.critical {
  color: #f39c12;
  font-size: 40px;
}

.battle-effect.damage {
  color: #e74c3c;
}

@keyframes effect-popup {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.5);
  }
  50% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.2);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -70%) scale(1);
  }
}
</style>
