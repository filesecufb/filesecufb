import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://njxyatnhizjyzoisceuw.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qeHlhdG5oaXpqeXpvaXNjZXV3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzM0MDEzMywiZXhwIjoyMDcyOTE2MTMzfQ.hTmy5Kcbd_RmJZWlDsKrOF9_L2NoaP4ptXppHaiLwY8';

// Use service role to bypass RLS
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkInvoices() {
  console.log('Checking invoices table with service role...');
  
  // Check total invoices with service role (bypasses RLS)
  const { data: invoices, error: invoicesError, count } = await supabase
    .from('invoices')
    .select('*', { count: 'exact' });
    
  if (invoicesError) {
    console.error('Error fetching invoices:', invoicesError);
    return;
  }
  
  console.log(`Total invoices found: ${count}`);
  console.log('Invoices data:', invoices);
  
  // If no invoices, let's create them directly
  if (!invoices || invoices.length === 0) {
    console.log('No invoices found. Creating sample invoices...');
    
    // Get completed orders first
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, client_id')
      .eq('status', 'completed');
      
    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      return;
    }
    
    console.log('Completed orders:', orders);
    
    // Create invoices for each completed order
    if (orders && orders.length > 0) {
      const invoicesToCreate = orders.map((order, index) => ({
        order_id: order.id,
        client_id: order.client_id,
        file_name: `factura_${String(index + 1).padStart(3, '0')}.pdf`,
        file_url: `https://filesecufb.com/sample-invoice-${index + 1}.pdf`,
        file_size: Math.floor(Math.random() * 300000 + 150000),
        file_type: 'application/pdf',
        admin_comments: `Factura procesada correctamente para el pedido ${order.id.substring(0, 8)}...`,
        uploaded_by: null // We'll set this to null for now
      }));
      
      const { data: createdInvoices, error: createError } = await supabase
        .from('invoices')
        .insert(invoicesToCreate)
        .select();
        
      if (createError) {
        console.error('Error creating invoices:', createError);
      } else {
        console.log(`Successfully created ${createdInvoices.length} invoices:`);
        console.log(createdInvoices);
      }
    }
  }
}

checkInvoices().catch(console.error);