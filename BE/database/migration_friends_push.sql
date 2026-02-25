-- =======================
-- MIGRACIÓN: Sistema de Amigos Mejorado + Push Notifications Persistentes
-- =======================

-- 1. Agregar columna 'status' a la tabla friends
ALTER TABLE friends 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'accepted';

-- Actualizar amigos existentes a 'accepted'
UPDATE friends SET status = 'accepted' WHERE status IS NULL;

-- 2. Crear tabla para almacenar suscripciones push
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  keys_p256dh TEXT NOT NULL,
  keys_auth TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

-- 3. Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_friends_status ON friends(status);
CREATE INDEX IF NOT EXISTS idx_friends_user_status ON friends(user_id, status);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);

-- 4. Ver resultado
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN ('friends', 'push_subscriptions');

-- Verificar estructura de friends
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'friends'
ORDER BY ordinal_position;
