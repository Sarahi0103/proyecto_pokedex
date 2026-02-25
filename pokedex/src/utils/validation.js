// Validaciones comunes
export function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

export function validatePassword(password) {
  // Minimo 8 caracteres, al menos 1 mayuscula y 1 numero
  return password.length >= 8 && /[A-Z]/.test(password) && /\d/.test(password)
}

export function validateUsername(username) {
  // 3-20 caracteres, solo letras, numeros y guiones
  return /^[a-zA-Z0-9_-]{3,20}$/.test(username)
}

export function validateCode(code) {
  // Código de amigo: 6-9 caracteres alfanuméricos (case insensitive)
  return /^[a-zA-Z0-9]{6,9}$/.test(code)
}

export function validateTeamName(name) {
  return name && name.trim().length >= 2 && name.trim().length <= 30
}

export function validateName(name) {
  // Nombre: 2-30 caracteres, solo letras y espacios
  return name && name.trim().length >= 2 && name.trim().length <= 30 && /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(name.trim())
}

export function validatePokemonCount(count) {
  return count >= 1 && count <= 6
}

// Objeto con mensajes de error personalizados
export const validationMessages = {
  email: {
    required: 'El email es requerido',
    invalid: 'Por favor ingresa un email válido'
  },
  password: {
    required: 'La contraseña es requerida',
    weak: 'La contraseña debe tener al menos 8 caracteres, 1 mayúscula y 1 número',
    mismatch: 'Las contraseñas no coinciden'
  },
  username: {
    required: 'El nombre es requerido',
    invalid: 'El nombre debe tener 3-20 caracteres (letras, números, guiones)'
  },
  code: {
    required: 'El código es requerido',
    invalid: 'El código es inválido',
    notFound: 'No se encontró usuario con ese código'
  },
  teamName: {
    required: 'El nombre del equipo es requerido',
    tooShort: 'El nombre debe tener al menos 2 caracteres',
    tooLong: 'El nombre no puede tener más de 30 caracteres'
  },
  team: {
    required: 'Debe haber al menos 1 Pokémon',
    maxSize: 'No puedes tener más de 6 Pokémon en un equipo'
  }
}

// Función para validar formulario de registro
export function validateRegisterForm(email, password, confirmPassword, name) {
  const errors = []

  if (!email.trim()) {
    errors.push({ field: 'email', message: validationMessages.email.required })
  } else if (!validateEmail(email)) {
    errors.push({ field: 'email', message: validationMessages.email.invalid })
  }

  if (!password) {
    errors.push({ field: 'password', message: validationMessages.password.required })
  } else if (!validatePassword(password)) {
    errors.push({ field: 'password', message: validationMessages.password.weak })
  }

  if (password !== confirmPassword) {
    errors.push({ field: 'confirmPassword', message: validationMessages.password.mismatch })
  }

  if (!name.trim()) {
    errors.push({ field: 'name', message: validationMessages.username.required })
  }

  return errors
}

// Función para validar formulario de login
export function validateLoginForm(email, password) {
  const errors = []

  if (!email.trim()) {
    errors.push({ field: 'email', message: validationMessages.email.required })
  } else if (!validateEmail(email)) {
    errors.push({ field: 'email', message: validationMessages.email.invalid })
  }

  if (!password) {
    errors.push({ field: 'password', message: validationMessages.password.required })
  }

  return errors
}
