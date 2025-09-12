import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.VITE_RESEND_API_KEY);

// Configurar Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Función para obtener datos del pedido desde Supabase
async function getOrderFromDatabase(orderId) {
  try {
    console.log('=== FETCHING ORDER FROM DATABASE ===');
    console.log('Order ID:', orderId);
    
    // Obtener el pedido con información del servicio usando la relación correcta
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        services!orders_service_id_fkey(id, title, description, price)
      `)
      .eq('id', orderId)
      .single();

    if (error) {
      console.error('❌ Error fetching order:', error);
      throw error;
    }

    if (!data) {
      console.error('❌ Order not found with ID:', orderId);
      throw new Error('Order not found');
    }

    // Obtener información del cliente desde profiles usando client_id
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('id', data.client_id)
      .single();

    if (profileError) {
       console.warn('⚠️ Error fetching profile:', profileError);
     }

    console.log('✅ Raw order data from Supabase:', JSON.stringify(data, null, 2));

    // Construir información del vehículo con más detalles
    let vehicle_parts = [];
    if (data.vehicle_make) vehicle_parts.push(data.vehicle_make);
    if (data.vehicle_model) vehicle_parts.push(data.vehicle_model);
    if (data.vehicle_year) vehicle_parts.push(data.vehicle_year);
    
    const vehicle_info = vehicle_parts.length > 0 
      ? vehicle_parts.join(' ').trim()
      : 'Información de vehículo no disponible';

    // Obtener el título del servicio desde la relación con services
    const service_title = data.services?.title || 'Servicio no especificado';
    
    // Obtener información del cliente desde profileData
    const client_name = profileData?.full_name || 'Cliente no especificado';
    const client_email = profileData?.email || 'Email no disponible';
    
    console.log('👤 Client info:', { client_name, client_email, profileData });

    const result = {
      ...data,
      service_title,
      vehicle_info,
      client_name,
      client_email
    };

    console.log('✅ Processed order data:', {
      id: result.id,
      service_title: result.service_title,
      vehicle_info: result.vehicle_info,
      vehicle_make: result.vehicle_make,
      vehicle_model: result.vehicle_model,
      vehicle_year: result.vehicle_year,
      total_price: result.total_price,
      status: result.status,
      service_id: result.service_id,
      client_name: result.client_name,
      client_email: result.client_email,
      services_data: result.services,
      profile_data: profileData
    });
    console.log('=== END FETCHING ORDER ===');

    return result;
  } catch (error) {
    console.error('❌ Database query error:', error);
    return null;
  }
}

// Funciones para templates multiidioma
function getTexts(language = 'es') {
  const texts = {
    es: {
      statusUpdate: 'Actualización de Pedido',
      orderDetails: 'Detalles del Pedido',
      orderId: 'ID del Pedido',
      client: 'Cliente',
      email: 'Email',
      service: 'Servicio',
      vehicle: 'Vehículo',
      total: 'Total a Pagar',
      status: 'Estado',
      currentStatus: 'Estado Actual',
      lastUpdate: 'Última Actualización',
      pending: 'Pendiente',
      processing: 'Procesando',
      inProgress: 'En Progreso',
      completed: 'Completado',
      ready: 'Listo',
      importantInfo: 'Información Importante',
      workingForYou: 'Seguimos trabajando para ofrecerte el mejor servicio. Si tienes alguna pregunta o necesitas más información, no dudes en contactarnos.',
      thanksForTrust: 'Gracias por tu confianza en FILESECUFB',
      excellenceCommitment: 'Estamos comprometidos con la excelencia en cada proyecto.'
    },
    en: {
      statusUpdate: 'Order Update',
      orderDetails: 'Order Details',
      orderId: 'Order ID',
      client: 'Client',
      email: 'Email',
      service: 'Service',
      vehicle: 'Vehicle',
      total: 'Total Amount',
      status: 'Status',
      currentStatus: 'Current Status',
      lastUpdate: 'Last Update',
      pending: 'Pending',
      processing: 'Processing',
      inProgress: 'In Progress',
      completed: 'Completed',
      ready: 'Ready',
      importantInfo: 'Important Information',
      workingForYou: 'We continue working to offer you the best service. If you have any questions or need more information, do not hesitate to contact us.',
      thanksForTrust: 'Thank you for your trust in FILESECUFB',
      excellenceCommitment: 'We are committed to excellence in every project.'
    }
  };
  
  return texts[language] || texts.es;
}

function createProfessionalTemplate(content, isAdmin = false, language = 'es') {
  const logoUrl = 'https://filesecufb.com/logo.png';
  const websiteUrl = 'https://filesecufb.com';
  
  return `
    <!DOCTYPE html>
    <html lang="${language}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>FILESECUFB</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f8fafc;
        }
        
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px 20px;
          text-align: center;
        }
        
        .logo {
          max-width: 150px;
          height: auto;
          margin-bottom: 15px;
        }
        
        .company-name {
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 8px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        
        .tagline {
          font-size: 14px;
          opacity: 0.9;
          font-weight: 300;
        }
        
        .content {
          padding: 40px 30px;
        }
        
        .title {
          font-size: 24px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 20px;
          text-align: center;
        }
        
        .card {
          background: #f8fafc;
          border-radius: 12px;
          padding: 24px;
          margin: 20px 0;
          border-left: 4px solid #3b82f6;
        }
        
        .card-title {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 16px;
        }
        
        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .info-row:last-child {
          border-bottom: none;
        }
        
        .info-label {
          font-weight: 500;
          color: #64748b;
          font-size: 14px;
        }
        
        .info-value {
          font-weight: 600;
          color: #1e293b;
          font-size: 14px;
        }
        
        .price {
          color: #059669;
          font-size: 16px;
        }
        
        .status {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }
        
        .status.pending {
          background: #fef3c7;
          color: #92400e;
        }
        
        .status.processing {
          background: #dbeafe;
          color: #1e40af;
        }
        
        .status.completed {
          background: #d1fae5;
          color: #065f46;
        }
        
        .footer {
          background: #1e293b;
          color: #94a3b8;
          padding: 30px 20px;
          text-align: center;
          font-size: 14px;
        }
        
        .footer-links {
          margin-bottom: 20px;
        }
        
        .footer-links a {
          color: #60a5fa;
          text-decoration: none;
          margin: 0 15px;
        }
        
        .footer-links a:hover {
          text-decoration: underline;
        }
        
        .social-links {
          margin: 20px 0;
        }
        
        .social-links a {
          display: inline-block;
          margin: 0 10px;
          color: #60a5fa;
          text-decoration: none;
        }
        
        @media (max-width: 600px) {
          .container {
            margin: 0;
            box-shadow: none;
          }
          
          .content {
            padding: 20px 15px;
          }
          
          .card {
            padding: 16px;
          }
          
          .info-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="company-name">FILESECUFB</div>
          <div class="tagline">Professional ECU Tuning Files</div>
        </div>
        
        ${content}
        
        <div class="footer">
          <div class="footer-links">
            <a href="${websiteUrl}">Sitio Web</a>
            <a href="${websiteUrl}/contact">Contacto</a>
            <a href="${websiteUrl}/support">Soporte</a>
          </div>
          
          <div class="social-links">
            <a href="#">WhatsApp</a>
            <a href="#">Email</a>
          </div>
          
          <p style="margin-top: 20px; font-size: 12px; opacity: 0.8;">
            © 2024 FILESECUFB. Todos los derechos reservados.<br>
            Paraje Narcisos, 21, MEDIALEGUA
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { orderData, language = 'es' } = req.body;
    
    if (!orderData || !orderData.id) {
      return res.status(400).json({ error: 'orderData with id is required' });
    }
    
    console.log('Sending status update for order:', orderData.id);
    
    // Obtener datos actualizados desde la base de datos
    const dbOrderData = await getOrderFromDatabase(orderData.id);
    
    if (!dbOrderData) {
      console.error('Order not found in database:', orderData.id);
      return res.status(404).json({ error: 'Order not found in database' });
    }
    
    const texts = getTexts(language);
    
    // Usar datos correctos desde la base de datos
    const serviceName = dbOrderData.service_title;
    const vehicleInfo = dbOrderData.vehicle_info;
    const totalPrice = dbOrderData.total_price || '0';
    
    const emailContent = `
        <div class="content">
          <h1 class="title">${texts.statusUpdate}</h1>
          <div class="card">
            <h3 class="card-title">${texts.orderDetails}</h3>
          <div class="info-row">
            <span class="info-label">${texts.orderId}:</span>
            <span class="info-value">#${dbOrderData.id}</span>
          </div>
          <div class="info-row">
            <span class="info-label">${texts.client}:</span>
            <span class="info-value">${dbOrderData.client_name}</span>
          </div>
          <div class="info-row">
            <span class="info-label">${texts.currentStatus}:</span>
            <span class="status ${dbOrderData.status}">${texts[dbOrderData.status] || dbOrderData.status.toUpperCase()}</span>
          </div>
          <div class="info-row">
            <span class="info-label">${texts.service}:</span>
            <span class="info-value">${serviceName}</span>
          </div>
          <div class="info-row">
            <span class="info-label">${texts.vehicle}:</span>
            <span class="info-value">${vehicleInfo}</span>
          </div>
          <div class="info-row">
            <span class="info-label">${texts.total}:</span>
            <span class="info-value price">€${totalPrice}</span>
          </div>
          <div class="info-row">
            <span class="info-label">${texts.lastUpdate}:</span>
            <span class="info-value">${new Date().toLocaleString(language === 'en' ? 'en-US' : 'es-ES')}</span>
          </div>
        </div>
        
        <div style="background: #f8fafc; border-radius: 8px; padding: 24px; margin: 20px 0; text-align: center;">
           <h4 style="color: #1e293b; margin-bottom: 12px; font-size: 16px;">${texts.importantInfo}</h4>
          <p style="color: #475569; font-size: 14px; margin: 0; line-height: 1.6;">
            ${texts.workingForYou}
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding: 20px; background: #f0fdf4; border-radius: 8px; border-left: 4px solid #10b981;">
           <p style="color: #065f46; font-size: 14px; margin: 0;">
             <strong>${texts.thanksForTrust}</strong><br>
             ${texts.excellenceCommitment}
           </p>
         </div>
      </div>
    `;
    
    const { data, error } = await resend.emails.send({
      from: 'Filesecufb <noreply@filesecufb.com>',
      to: dbOrderData.client_email,
      subject: `${texts.statusUpdate} #${dbOrderData.id} - ${dbOrderData.status.toUpperCase()}`,
      html: createProfessionalTemplate(emailContent, false, language)
    });

    if (error) {
      console.error('Error enviando actualización de estado:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error en /api/send-status-update:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}