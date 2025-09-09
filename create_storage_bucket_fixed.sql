-- ============================================
-- CREAR STORAGE BUCKET CON PERMISOS DE ADMIN
-- ============================================
-- IMPORTANTE: Este SQL debe ejecutarse como superusuario (dashboard admin)

-- 1. Crear bucket order-files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'order-files',
  'order-files', 
  false,
  52428800, -- 50MB
  ARRAY[
    'application/octet-stream',
    'application/zip', 
    'application/x-zip-compressed',
    'application/rar',
    'text/plain',
    'application/pdf',
    'image/png',
    'image/jpeg'
  ]
) ON CONFLICT (id) DO NOTHING;

-- 2. Políticas para storage.objects (archivos)
-- IMPORTANTE: Ejecutar una por una para evitar conflictos

-- Política: Usuarios autenticados pueden subir archivos
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
CREATE POLICY "Authenticated users can upload files" ON storage.objects
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'order-files' 
    AND auth.role() = 'authenticated'
  );

-- Política: Admins pueden hacer todo en order-files
DROP POLICY IF EXISTS "Admins can manage order files" ON storage.objects;
CREATE POLICY "Admins can manage order files" ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'order-files' 
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Política: Clientes pueden ver/descargar sus propios archivos
DROP POLICY IF EXISTS "Clients can view their order files" ON storage.objects;
CREATE POLICY "Clients can view their order files" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'order-files' 
    AND EXISTS (
      SELECT 1 FROM order_files
      WHERE order_files.file_url LIKE '%' || storage.objects.name || '%'
      AND order_files.client_id = auth.uid()
    )
  );

-- 3. Verificar que el bucket se creó correctamente
SELECT 
  'Bucket creado:' as status,
  id, 
  name, 
  public, 
  file_size_limit,
  array_length(allowed_mime_types, 1) as mime_types_count,
  created_at
FROM storage.buckets 
WHERE id = 'order-files';