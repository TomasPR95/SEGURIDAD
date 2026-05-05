-- SCHEMA PARA SUPABASE
-- Ejecuta este código en el SQL Editor de Supabase

-- Tabla de reportes
CREATE TABLE IF NOT EXISTS reportes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('acto_inseguro', 'apercibimiento', 'falla_calidad', 'otro')),
  area VARCHAR(255) NOT NULL,
  empleado VARCHAR(255) NOT NULL,
  descripcion TEXT NOT NULL,
  gravedad VARCHAR(20) NOT NULL CHECK (gravedad IN ('baja', 'media', 'alta')),
  estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_proceso', 'resuelto')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_reportes_tipo ON reportes(tipo);
CREATE INDEX IF NOT EXISTS idx_reportes_estado ON reportes(estado);
CREATE INDEX IF NOT EXISTS idx_reportes_created_at ON reportes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reportes_area ON reportes(area);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
CREATE TRIGGER update_reportes_updated_at 
  BEFORE UPDATE ON reportes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Habilitar Row Level Security (RLS)
ALTER TABLE reportes ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura a todos (puedes ajustar según tus necesidades)
CREATE POLICY "Enable read access for all users" ON reportes
  FOR SELECT
  USING (true);

-- Política para permitir inserción a todos
CREATE POLICY "Enable insert for all users" ON reportes
  FOR INSERT
  WITH CHECK (true);

-- Política para permitir actualización a todos
CREATE POLICY "Enable update for all users" ON reportes
  FOR UPDATE
  USING (true);

-- OPCIONAL: Si quieres datos de prueba, descomenta lo siguiente:
/*
INSERT INTO reportes (tipo, area, empleado, descripcion, gravedad, estado) VALUES
  ('acto_inseguro', 'Producción Línea 1', 'Juan Pérez', 'No utilizaba guantes de seguridad al manipular piezas calientes', 'alta', 'resuelto'),
  ('apercibimiento', 'Almacén', 'María González', 'Llegada tardía reiterada (3ra vez en el mes)', 'media', 'en_proceso'),
  ('falla_calidad', 'Control de Calidad', 'Carlos Rodríguez', 'Piezas con dimensiones fuera de tolerancia detectadas en lote #4521', 'alta', 'pendiente'),
  ('acto_inseguro', 'Mantenimiento', 'Roberto Silva', 'Trabajando en altura sin arnés de seguridad', 'alta', 'pendiente'),
  ('otro', 'Administración', 'Laura Martínez', 'Incumplimiento de protocolo de registro de entrada', 'baja', 'resuelto');
*/
