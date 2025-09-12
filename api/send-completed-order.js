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
      orderCompleted: 'Pedido Completado',
      orderReady: 'Tu pedido está listo',
      downloadReady: 'Descarga disponible',
      orderSummary: 'Resumen de tu Pedido',
      orderId: 'ID del Pedido',
      client: 'Cliente',
      email: 'Email',
      service: 'Servicio',
      vehicle: 'Vehículo',
      total: 'Total Pagado',
      status: 'Estado',
      date: 'Fecha de Finalización',
      completed: 'Completado',
      ready: 'Listo para Descarga',
      downloadInstructions: 'Instrucciones de Descarga',
      downloadStep1: 'Haz clic en el enlace de descarga adjunto',
      downloadStep2: 'Guarda el archivo en un lugar seguro',
      downloadStep3: 'Sigue las instrucciones de instalación incluidas',
      importantNotes: 'Notas Importantes',
      backupOriginal: 'Siempre haz una copia de seguridad del archivo original antes de la instalación',
      professionalInstall: 'Recomendamos instalación profesional para mejores resultados',
      warranty: 'Este archivo incluye garantía de funcionamiento',
      support: 'Soporte técnico disponible durante 30 días',
      thanksForTrust: 'Gracias por confiar en FILESECUFB',
      excellenceCommitment: 'Esperamos que disfrutes de los resultados.',
      viewMyOrders: 'Ver Mis Pedidos',
      accessDashboard: 'Accede a tu dashboard para ver todos tus pedidos'
    },
    en: {
      orderCompleted: 'Order Completed',
      orderReady: 'Your order is ready',
      downloadReady: 'Download available',
      orderSummary: 'Your Order Summary',
      orderId: 'Order ID',
      client: 'Client',
      email: 'Email',
      service: 'Service',
      vehicle: 'Vehicle',
      total: 'Total Paid',
      status: 'Status',
      date: 'Completion Date',
      completed: 'Completed',
      ready: 'Ready for Download',
      downloadInstructions: 'Download Instructions',
      downloadStep1: 'Click on the attached download link',
      downloadStep2: 'Save the file in a secure location',
      downloadStep3: 'Follow the included installation instructions',
      importantNotes: 'Important Notes',
      backupOriginal: 'Always backup the original file before installation',
      professionalInstall: 'We recommend professional installation for best results',
      warranty: 'This file includes functionality warranty',
      support: 'Technical support available for 30 days',
      thanksForTrust: 'Thank you for trusting FILESECUFB',
      excellenceCommitment: 'We hope you enjoy the results.',
      viewMyOrders: 'View My Orders',
      accessDashboard: 'Access your dashboard to view all your orders'
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
        
        .download-button {
          display: inline-block;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          margin: 10px 0;
          text-align: center;
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
  res.setHeader('Access-Control-Allow-Origin', 'https://filesecufb.com');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { orderData, downloadUrl, language = 'es' } = req.body;
    
    if (!orderData || !orderData.id) {
      return res.status(400).json({ error: 'orderData with id is required' });
    }
    
    console.log('Sending completed order email for order:', orderData.id);
    
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
          <h1 class="title">🎉 ${texts.orderCompleted}</h1>
          <div style="text-align: center; margin: 20px 0; padding: 20px; background: #d1fae5; border-radius: 8px; border-left: 4px solid #10b981;">
            <p style="color: #065f46; font-size: 18px; margin: 0; font-weight: 600;">
              ✅ ${texts.orderReady}
            </p>
            <p style="color: #065f46; font-size: 14px; margin: 8px 0 0 0;">
              ${texts.downloadReady}
            </p>
          </div>
          
          ${downloadUrl ? `
          <div style="text-align: center; margin: 20px 0;">
            <a href="${downloadUrl}" class="download-button" style="color: white; text-decoration: none;">
              📥 Descargar Archivo ECU
            </a>
          </div>
          ` : ''}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://filesecufb.com/client-dashboard?section=orders" 
               style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3); transition: all 0.3s ease;">
              🏠 ${texts.viewMyOrders}
            </a>
            <p style="margin-top: 10px; font-size: 14px; color: #64748b;">
              ${texts.accessDashboard}
            </p>
          </div>
          
          <div class="card">
            <h3 class="card-title">${texts.orderSummary}</h3>
          <div class="info-row">
            <span class="info-label">${texts.orderId}:</span>
            <span class="info-value">#${dbOrderData.id}</span>
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
            <span class="info-label">${texts.status}:</span>
            <span class="status completed">${texts.completed.toUpperCase()}</span>
          </div>
          <div class="info-row">
            <span class="info-label">${texts.date}:</span>
            <span class="info-value">${new Date().toLocaleString(language === 'en' ? 'en-US' : 'es-ES')}</span>
          </div>
        </div>
        
        <div style="background: #f0f9ff; border-radius: 8px; padding: 24px; margin: 20px 0; border-left: 4px solid #2563eb;">
           <h4 style="color: #1e40af; margin-bottom: 16px; font-size: 16px;">📋 ${texts.downloadInstructions}</h4>
           <div style="color: #1e40af; font-size: 14px; line-height: 1.6;">
             <p style="margin: 8px 0;">1. ${texts.downloadStep1}</p>
             <p style="margin: 8px 0;">2. ${texts.downloadStep2}</p>
             <p style="margin: 8px 0;">3. ${texts.downloadStep3}</p>
           </div>
         </div>
        
        <div style="background: #fef3c7; border-radius: 8px; padding: 24px; margin: 20px 0; border-left: 4px solid #f59e0b;">
           <h4 style="color: #92400e; margin-bottom: 16px; font-size: 16px;">⚠️ ${texts.importantNotes}</h4>
           <div style="color: #92400e; font-size: 14px; line-height: 1.6;">
             <p style="margin: 8px 0;">• ${texts.backupOriginal}</p>
             <p style="margin: 8px 0;">• ${texts.professionalInstall}</p>
             <p style="margin: 8px 0;">• ${texts.warranty}</p>
             <p style="margin: 8px 0;">• ${texts.support}</p>
           </div>
         </div>
        
        <div style="text-align: center; margin-top: 30px; padding: 20px; background: #f0fdf4; border-radius: 8px; border-left: 4px solid #10b981;">
           <p style="color: #065f46; font-size: 14px; margin: 0;">
             <strong>${texts.thanksForTrust}</strong><br>
             ${texts.excellenceCommitment}
           </p>
         </div>
      </div>
    `;
    
    const attachments = [];
    
    // Si hay un archivo adjunto, agregarlo
    if (req.body.fileBuffer && req.body.fileName) {
      attachments.push({
        filename: req.body.fileName,
        content: req.body.fileBuffer
      });
    }
    
    const emailData = {
      from: 'Filesecufb <noreply@filesecufb.com>',
      to: dbOrderData.client_email,
      subject: `🎉 ${texts.orderCompleted} #${dbOrderData.id} - ${serviceName}`,
      html: createProfessionalTemplate(emailContent, false, language)
    };
    
    // Solo agregar attachments si existen
    if (attachments.length > 0) {
      emailData.attachments = attachments;
    }
    
    const { data, error } = await resend.emails.send(emailData);

    if (error) {
      console.error('Error enviando pedido completado:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error en /api/send-completed-order:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}