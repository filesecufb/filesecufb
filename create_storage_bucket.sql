-- Create storage bucket for order files
INSERT INTO storage.buckets (id, name, public, allowed_mime_types, file_size_limit)
VALUES (
  'order-files',
  'order-files',
  false, -- private bucket
  ARRAY['application/octet-stream', 'application/zip', 'text/plain', 'application/pdf', 'image/png', 'image/jpeg'],
  52428800 -- 50MB limit
) ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Authenticated users can upload files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'order-files' AND auth.role() = 'authenticated');

CREATE POLICY "Admins can access all order files" ON storage.objects
  FOR ALL USING (
    bucket_id = 'order-files' AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Clients can access their own order files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'order-files' AND
    EXISTS (
      SELECT 1 FROM order_files
      WHERE order_files.file_url LIKE '%' || name || '%'
      AND order_files.client_id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete order files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'order-files' AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );