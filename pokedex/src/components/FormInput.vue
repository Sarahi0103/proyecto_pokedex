<template>
  <div class="form-input-wrapper">
    <label v-if="label" :for="id" class="input-label">
      {{ label }}
      <span v-if="required" class="required">*</span>
    </label>
    
    <div class="input-container" :class="{ 'has-error': hasError, 'has-value': modelValue, 'focused': isFocused }">
      <span v-if="icon" class="input-icon">{{ icon }}</span>
      
      <input
        :id="id"
        :type="inputType"
        :placeholder="placeholder"
        :value="modelValue"
        :disabled="disabled"
        :required="required"
        :autocomplete="autocomplete"
        class="input-field"
        @input="handleInput"
        @blur="handleBlur"
        @focus="isFocused = true"
      />
      
      <button
        v-if="type === 'password' && modelValue"
        type="button"
        class="toggle-password"
        :title="showPassword ? 'Ocultar' : 'Mostrar'"
        @click="togglePassword"
      >
        {{ showPassword ? '👁️' : '👁️‍🗨️' }}
      </button>
      
      <span v-if="showValidation && modelValue" class="validation-icon" :class="validationStatus">
        {{ validationStatus === 'valid' ? '✓' : '✗' }}
      </span>
    </div>
    
    <div v-if="hasError" class="input-error">
      {{ errorMessage }}
    </div>
    
    <div v-if="showStrength && type === 'password' && modelValue" class="strength-meter">
      <div class="strength-bar" :class="`strength-${passwordStrength}`"></div>
      <span class="strength-text">{{ strengthLabel }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'text',
    validator: (v) => ['text', 'email', 'password', 'number', 'tel'].includes(v)
  },
  label: String,
  placeholder: String,
  icon: String,
  id: String,
  disabled: Boolean,
  required: Boolean,
  autocomplete: String,
  validator: Function,
  showValidation: Boolean,
  showStrength: Boolean
})

const emit = defineEmits(['update:modelValue', 'change', 'blur'])

const showPassword = ref(false)
const isFocused = ref(false)

const inputType = computed(() => {
  if (props.type === 'password' && showPassword.value) return 'text'
  return props.type
})

const hasError = computed(() => {
  return props.modelValue && props.validator && !props.validator(props.modelValue)
})

const validationStatus = computed(() => {
  if (!props.modelValue) return null
  return props.validator && props.validator(props.modelValue) ? 'valid' : 'invalid'
})

const errorMessage = computed(() => {
  if (props.validator && !props.validator(props.modelValue)) {
    return `${props.label} inválido`
  }
  return ''
})

const passwordStrength = computed(() => {
  if (props.type !== 'password') return 'weak'
  const value = props.modelValue
  if (!value) return 'weak'
  
  let strength = 0
  if (value.length >= 8) strength++
  if (value.length >= 12) strength++
  if (/[A-Z]/.test(value)) strength++
  if (/[0-9]/.test(value)) strength++
  if (/[^A-Za-z0-9]/.test(value)) strength++
  
  if (strength <= 2) return 'weak'
  if (strength <= 3) return 'medium'
  return 'strong'
})

const strengthLabel = computed(() => {
  const labels = { weak: '🔴 Débil', medium: '🟡 Media', strong: '🟢 Fuerte' }
  return labels[passwordStrength.value]
})

function handleInput(e) {
  emit('update:modelValue', e.target.value)
  emit('change', e.target.value)
}

function handleBlur() {
  isFocused.value = false
  emit('blur')
}

function togglePassword() {
  showPassword.value = !showPassword.value
}
</script>

<style scoped>
.form-input-wrapper {
  margin-bottom: var(--space-5);
  width: 100%;
}

.input-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: var(--space-2);
  color: var(--gray-700);
  text-transform: capitalize;
}

.required {
  color: var(--error);
  margin-left: 2px;
}

.input-container {
  position: relative;
  display: flex;
  align-items: center;
  background: white;
  border: 2px solid var(--gray-300);
  border-radius: var(--radius-md);
  transition: all var(--transition-base);
  overflow: hidden;
}

.input-container:hover {
  border-color: var(--gray-400);
}

.input-container.focused {
  border-color: var(--blue);
  box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
}

.input-container.has-error {
  border-color: var(--error);
}

.input-icon {
  padding: 0 var(--space-3);
  font-size: 1.25rem;
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.input-field {
  flex: 1;
  padding: var(--space-3) var(--space-3);
  border: none;
  font-size: 1rem;
  font-family: inherit;
  outline: none;
  background: transparent;
  color: var(--gray-900);
}

.input-field::placeholder {
  color: var(--gray-500);
}

.input-field:disabled {
  background: var(--gray-100);
  color: var(--gray-500);
  cursor: not-allowed;
}

.toggle-password {
  padding: 0 var(--space-3);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.25rem;
  transition: transform var(--transition-base);
  display: flex;
  align-items: center;
}

.toggle-password:hover {
  transform: scale(1.1);
}

.validation-icon {
  padding: 0 var(--space-3);
  font-size: 1.25rem;
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.validation-icon.valid {
  color: var(--success);
}

.validation-icon.invalid {
  color: var(--error);
}

.input-error {
  margin-top: var(--space-2);
  font-size: 0.75rem;
  color: var(--error);
  font-weight: 500;
}

.strength-meter {
  margin-top: var(--space-3);
}

.strength-bar {
  height: 4px;
  background: var(--gray-200);
  border-radius: 2px;
  margin-bottom: var(--space-2);
  transition: all var(--transition-base);
}

.strength-weak {
  width: 33%;
  background: var(--error);
}

.strength-medium {
  width: 66%;
  background: #ffc107;
}

.strength-strong {
  width: 100%;
  background: var(--success);
}

.strength-text {
  font-size: 0.75rem;
  color: var(--gray-600);
  display: block;
}

/* Responsive */
@media (max-width: 640px) {
  .form-input-wrapper {
    margin-bottom: var(--space-4);
  }

  .input-label {
    font-size: 0.8125rem;
  }

  .input-field {
    font-size: 16px; /* Previene zoom en iOS */
  }

  .input-container {
    border-radius: var(--radius-sm);
  }
}
</style>
