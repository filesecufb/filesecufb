-- =======================================
-- CREAR TABLA DE FACTURAS
-- =======================================

-- 1. Crear tabla invoices
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invoice_number VARCHAR(100) NOT NULL UNIQUE,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  file_type VARCHAR(100),
  amount DECIMAL(10,2) NOT NULL,
  issue_date DATE NOT NULL,
  due_date DATE,
  status VARCHAR(50) DEFAULT 'issued' CHECK (status IN ('issued', 'paid', 'overdue', 'cancelled')),
  notes TEXT,
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON invoices(issue_date);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);

-- 4. RLS Policies

-- Política: Admins pueden hacer todo
CREATE POLICY "Admins can manage invoices" ON invoices
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Política: Clientes pueden ver sus propias facturas
CREATE POLICY "Clients can view their own invoices" ON invoices
  FOR SELECT USING (client_id = auth.uid());

-- 5. Storage policies para facturas (usando el bucket order-files)
-- Las facturas se guardarán en order-files/invoices/

-- Ya tenemos las políticas del bucket, solo necesitamos asegurar que funcionen para invoices también
CREATE POLICY IF NOT EXISTS "Admins can manage invoice files" ON storage.objects
  FOR ALL USING (
    bucket_id = 'order-files' 
    AND name LIKE 'invoices/%'
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY IF NOT EXISTS "Clients can view their invoice files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'order-files' 
    AND name LIKE 'invoices/%'
    AND EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.file_url LIKE '%' || storage.objects.name || '%'
      AND invoices.client_id = auth.uid()
    )
  );

-- 6. Trigger para updated_at
CREATE OR REPLACE FUNCTION update_invoices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_invoices_updated_at();

-- 7. Verificar creación
SELECT 
  'Tabla invoices creada:' as status,
  COUNT(*) as count
FROM invoices;