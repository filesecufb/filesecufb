-- Create order_files table for storing file metadata
CREATE TABLE IF NOT EXISTS order_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  file_type VARCHAR(100),
  admin_comments TEXT,
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE order_files ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can do everything
CREATE POLICY "Admins can manage order files" ON order_files
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Policy: Clients can view their own order files  
CREATE POLICY "Clients can view their own order files" ON order_files
  FOR SELECT USING (client_id = auth.uid());

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