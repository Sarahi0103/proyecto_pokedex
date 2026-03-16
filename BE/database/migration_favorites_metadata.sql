-- =======================
-- MIGRACION: Metadatos opcionales para favoritos
-- =======================

ALTER TABLE favorites
ADD COLUMN IF NOT EXISTS alias VARCHAR(60);

ALTER TABLE favorites
ADD COLUMN IF NOT EXISTS note TEXT;

-- Verificacion opcional
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'favorites'
  AND column_name IN ('alias', 'note')
ORDER BY column_name;
