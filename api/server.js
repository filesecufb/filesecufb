import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Configurar CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));

app.use(express.json());

// Inicializar Resend con la API key
const resend = new Resend(process.env.VITE_RESEND_API_KEY);

// Configurar Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('API Key loaded:', process.env.VITE_RESEND_API_KEY ? 'Yes' : 'No');
console.log('Supabase configured:', supabaseUrl ? 'Yes' : 'No');

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
      newOrder: 'Nuevo Pedido Recibido',
      orderConfirmed: 'Pedido Confirmado',
      orderCompleted: 'Pedido Completado',
      statusUpdate: 'Actualización de Pedido',
      orderDetails: 'Detalles del Pedido',
      orderSummary: 'Resumen de tu Pedido',
      orderId: 'ID del Pedido',
      client: 'Cliente',
      email: 'Email',
      service: 'Servicio',
      vehicle: 'Vehículo',
      total: 'Total a Pagar',
      totalPaid: 'Total Pagado',
      status: 'Estado',
      currentStatus: 'Estado Actual',
      date: 'Fecha del Pedido',
      completionDate: 'Fecha de Finalización',
      lastUpdate: 'Última Actualización',
      pending: 'Pendiente',
      processing: 'Procesando',
      inProgress: 'En Progreso',
      completed: 'Completado',
      ready: 'Listo',
      whatNext: '¿Qué sigue ahora?',
      technicalReview: 'Revisión técnica: Analizaremos los detalles de tu vehículo',
      preparation: 'Preparación: Configuraremos el software específico',
      notification: 'Notificación: Te informaremos cuando esté listo',
      questions: '¿Tienes dudas? Contáctanos en cualquier momento.',
      keepInformed: 'Te mantendremos informado sobre cada paso del proceso.',
      importantInfo: 'Información Importante',
      workingForYou: 'Seguimos trabajando para ofrecerte el mejor servicio. Si tienes alguna pregunta o necesitas más información, no dudes en contactarnos.',
      thanksForTrust: 'Gracias por tu confianza en FILESECUFB',
      excellenceCommitment: 'Estamos comprometidos con la excelencia en cada proyecto.',
      orderCompleted: 'Pedido Completado',
      excellentNews: '¡Excelentes noticias',
      orderCompletedSuccessfully: 'Tu pedido ha sido completado exitosamente',
      completedOrderSummary: 'Resumen del Pedido Completado',
      servicePerformed: 'Servicio Realizado',
      totalPaid: 'Total Pagado',
      completed: 'Completado',
      completionDate: 'Fecha de Finalización',
      filesIncluded: 'Archivos Incluidos',
      perfect: '<strong>¡Perfecto!</strong> Hemos incluido todos los archivos de tu reprogramación ECU en este email. Descárgalos y guárdalos en un lugar seguro.',
      filesAttached: 'archivo(s) adjunto(s)',
      fileAccess: 'Acceso a Archivos',
      filesAvailable: 'Los archivos de tu reprogramación ECU están disponibles para descarga en tu <strong>panel de cliente</strong> en nuestra web.',
      technicalInfo: 'Información Técnica',
      warranty: '12 meses en el software instalado',
      support: 'Asistencia técnica incluida',
      backup: 'Copia de seguridad del archivo original guardada',
      excellentNews: 'Excelentes noticias',
      orderCompletedSuccessfully: 'Tu pedido ha sido completado exitosamente',
      completedOrderSummary: 'Resumen del Pedido Completado',
      servicePerformed: 'Servicio Realizado',
      filesIncluded: 'Archivos Incluidos',
      perfect: 'Perfecto! Hemos incluido todos los archivos de tu reprogramación ECU en este email. Descárgalos y guárdalos en un lugar seguro.',
      filesAttached: 'archivo(s) adjunto(s)',
      fileAccess: 'Acceso a Archivos',
      filesAvailable: 'Los archivos de tu reprogramación ECU están disponibles para descarga en tu panel de cliente en nuestra web.',
      technicalInfo: 'Información Técnica',
      warranty: 'Garantía: 12 meses en el software instalado',
      support: 'Soporte: Asistencia técnica incluida',
      backup: 'Backup: Copia de seguridad del archivo original guardada',
      thanksForChoosing: 'Gracias por confiar en FILESECUFB!',
      supportAvailable: 'Si tienes alguna pregunta o necesitas soporte, estamos aquí para ayudarte.',
      contactUs: 'No dudes en contactarnos. Estamos aquí para ayudarte.'
    },
    en: {
      newOrder: 'New Order Received',
      orderConfirmed: 'Order Confirmed',
      orderCompleted: 'Order Completed',
      statusUpdate: 'Order Update',
      orderDetails: 'Order Details',
      orderSummary: 'Your Order Summary',
      orderId: 'Order ID',
      client: 'Client',
      email: 'Email',
      service: 'Service',
      vehicle: 'Vehicle',
      total: 'Total to Pay',
      totalPaid: 'Total Paid',
      status: 'Status',
      currentStatus: 'Current Status',
      date: 'Order Date',
      completionDate: 'Completion Date',
      lastUpdate: 'Last Update',
      pending: 'Pending',
      processing: 'Processing',
      inProgress: 'In Progress',
      completed: 'Completed',
      ready: 'Ready',
      whatNext: 'What happens next?',
      technicalReview: 'Technical review: We will analyze your vehicle details',
      preparation: 'Preparation: We will configure the specific software',
      notification: 'Notification: We will inform you when it\'s ready',
      questions: 'Have questions? Contact us anytime.',
      keepInformed: 'We will keep you informed about every step of the process.',
      importantInfo: 'Important Information',
      workingForYou: 'We continue working to offer you the best service. If you have any questions or need more information, don\'t hesitate to contact us.',
      thanksForTrust: 'Thank you for your trust in FILESECUFB',
      excellenceCommitment: 'We are committed to excellence in every project.',
      orderCompleted: 'Order Completed',
      excellentNews: 'Excellent news',
      orderCompletedSuccessfully: 'Your order has been completed successfully',
      completedOrderSummary: 'Completed Order Summary',
      servicePerformed: 'Service Performed',
      totalPaid: 'Total Paid',
      completed: 'Completed',
      completionDate: 'Completion Date',
      filesIncluded: 'Files Included',
      perfect: '<strong>Perfect!</strong> We have included all your ECU reprogramming files in this email. Download them and save them in a safe place.',
      filesAttached: 'file(s) attached',
      fileAccess: 'File Access',
      filesAvailable: 'Your ECU reprogramming files are available for download in your <strong>client panel</strong> on our website.',
      technicalInfo: 'Technical Information',
      warranty: '12 months on installed software',
      support: 'Technical assistance included',
      backup: 'Original file backup saved',
      excellentNews: 'Excellent news',
      orderCompletedSuccessfully: 'Your order has been completed successfully',
      completedOrderSummary: 'Completed Order Summary',
      servicePerformed: 'Service Performed',
      filesIncluded: 'Files Included',
      perfect: 'Perfect! We have included all your ECU reprogramming files in this email. Download them and save them in a safe place.',
      filesAttached: 'file(s) attached',
      fileAccess: 'File Access',
      filesAvailable: 'Your ECU reprogramming files are available for download in your client panel on our website.',
      technicalInfo: 'Technical Information',
      warranty: 'Warranty: 12 months on installed software',
      support: 'Support: Technical assistance included',
      backup: 'Backup: Original file backup saved',
      thanksForChoosing: 'Thank you for choosing FILESECUFB!',
      supportAvailable: 'If you have any questions or need support, we are here to help you.',
      contactUs: 'Feel free to contact us. We are here to help you.'
    }
  };
  
  return texts[language] || texts.es;
}

// Función para crear template HTML profesional
const createProfessionalTemplate = (content, isAdmin = false, language = 'es') => {
  const texts = getTexts(language);
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>FILESECUFB</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 30px 40px; text-align: center; }
        .logo { color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: 1px; margin-bottom: 8px; }
        .tagline { color: #e2e8f0; font-size: 14px; font-weight: 400; }
        .content { padding: 40px; }
        .title { color: #1e293b; font-size: 24px; font-weight: 600; margin-bottom: 20px; text-align: center; }
        .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; margin: 20px 0; }
        .card-title { color: #374151; font-size: 18px; font-weight: 600; margin-bottom: 16px; border-bottom: 2px solid #2563eb; padding-bottom: 8px; }
        .info-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
        .info-row:last-child { border-bottom: none; }
        .info-label { font-weight: 500; color: #6b7280; }
        .info-value { font-weight: 600; color: #1f2937; }
        .price { color: #059669; font-size: 18px; font-weight: 700; }
        .status { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
        .status.pending { background: #fef3c7; color: #92400e; }
        .status.processing { background: #dbeafe; color: #1e40af; }
        .status.completed { background: #d1fae5; color: #065f46; }
        .footer { background: #1e293b; color: #94a3b8; padding: 30px 40px; text-align: center; }
        .footer-title { color: #ffffff; font-size: 18px; font-weight: 600; margin-bottom: 16px; }
        .contact-info { margin: 8px 0; font-size: 14px; }
        .contact-info a { color: #2563eb; text-decoration: none; }
        .divider { height: 1px; background: #e2e8f0; margin: 20px 0; }
        @media (max-width: 600px) {
          .container { margin: 10px; }
          .header, .content, .footer { padding: 20px; }
          .info-row { flex-direction: column; align-items: flex-start; gap: 4px; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">FILESECUFB</div>
          <div class="tagline">Especialistas en Reprogramación ECU</div>
        </div>
        ${content}
        <div class="footer">
          <div class="footer-title">FILESECUFB</div>
          <div class="contact-info"><a href="https://filesecufb.com">www.filesecufb.com</a></div>
          <div class="contact-info"><a href="mailto:info@filesecufb.com">info@filesecufb.com</a></div>
          <div class="contact-info">+34 630 84 10 47</div>
          <div style="margin-top: 16px; font-size: 12px; color: #64748b;">
            © 2025 FILESECUFB. Todos los derechos reservados.
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Endpoint para enviar nuevo pedido al admin
app.post('/api/send-new-order', async (req, res) => {
  try {
    const { orderData, attachments, language = 'es' } = req.body;
    
    if (!orderData || !orderData.id) {
      return res.status(400).json({ error: 'orderData with id is required' });
    }
    
    console.log('Sending email to admin for order:', orderData.id);
    
    // Obtener datos actualizados desde la base de datos
    const dbOrderData = await getOrderFromDatabase(orderData.id);
    
    if (!dbOrderData) {
      console.error('Order not found in database:', orderData.id);
      return res.status(404).json({ error: 'Order not found in database' });
    }
    
    console.log('Order data from database:', JSON.stringify(dbOrderData, null, 2));
    
    const texts = getTexts(language);
    
    // Usar datos correctos desde la base de datos
    const serviceName = dbOrderData.service_title;
    const vehicleInfo = dbOrderData.vehicle_info;
    const totalPrice = dbOrderData.total_price || '0';
    const orderStatus = dbOrderData.status || 'pending';
    
    const emailContent = `
      <div class="content">
        <h1 class="title">${texts.newOrder}</h1>
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
            <span class="info-label">${texts.email}:</span>
            <span class="info-value">${dbOrderData.client_email}</span>
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
            <span class="status pending">${orderStatus}</span>
          </div>
          <div class="info-row">
            <span class="info-label">${texts.date}:</span>
            <span class="info-value">${new Date(dbOrderData.created_at).toLocaleString(language === 'en' ? 'en-US' : 'es-ES')}</span>
          </div>
        </div>
        <div style="text-align: center; margin-top: 30px; padding: 20px; background: #f1f5f9; border-radius: 8px;">
          <p style="color: #475569; font-size: 14px; margin: 0;">
            <strong>Acción requerida:</strong> Revisa y procesa este nuevo pedido en el panel de administración.
          </p>
        </div>
        
        <div style="text-align: center; margin: 25px 0;">
          <a href="https://filesecufb.com/admin?section=orders" 
             style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); 
                    color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; 
                    font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3); 
                    transition: all 0.3s ease;">
            ${language === 'en' ? '⚡ Manage Order' : '⚡ Gestionar Pedido'}
          </a>
          <p style="color: #1e40af; font-size: 14px; margin: 10px 0 0 0; font-weight: 500;">
            ${language === 'en' ? 'Access the admin panel to process this order' : 'Accede al panel de administración para procesar este pedido'}
          </p>
        </div>
      </div>
    `;
    
    const { data, error } = await resend.emails.send({
      from: 'Filesecufb <noreply@filesecufb.com>',
      to: 'filesecufb@gmail.com',
      subject: `${texts.newOrder} #${dbOrderData.id} - ${serviceName}`,
      html: createProfessionalTemplate(emailContent, true, language)
    });

    if (error) {
      console.error('Error enviando email al admin:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error en /api/send-new-order:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Endpoint para enviar confirmación al cliente
app.post('/api/send-confirmation', async (req, res) => {
  try {
    const { orderData, language = 'es' } = req.body;
    
    if (!orderData || !orderData.id) {
      return res.status(400).json({ error: 'orderData with id is required' });
    }
    
    console.log('Sending confirmation email to client for order:', orderData.id);
    
    // Obtener datos actualizados desde la base de datos
    const dbOrderData = await getOrderFromDatabase(orderData.id);
    
    if (!dbOrderData) {
      console.error('Order not found in database:', orderData.id);
      return res.status(404).json({ error: 'Order not found in database' });
    }
    
    console.log('Order data from database:', JSON.stringify(dbOrderData, null, 2));
    
    const texts = getTexts(language);
    
    // Usar datos correctos desde la base de datos
    const serviceName = dbOrderData.service_title;
    const vehicleInfo = dbOrderData.vehicle_info;
    const totalPrice = dbOrderData.total_price || '0';
    const orderStatus = dbOrderData.status || 'pending';
    
    const emailContent = `
      <div class="content">
        <h1 class="title">${texts.orderConfirmed}!</h1>
        <div style="text-align: center; margin: 20px 0; padding: 20px; background: #ecfdf5; border-radius: 8px; border-left: 4px solid #10b981;">
          <p style="color: #065f46; font-size: 16px; margin: 0; font-weight: 500;">
            <strong>${language === 'en' ? `Thank you ${dbOrderData.client_name}!` : `¡Gracias ${dbOrderData.client_name}!`}</strong><br>
            ${language === 'en' ? 'We have received your order and our technical team is processing it.' : 'Hemos recibido tu pedido y nuestro equipo técnico lo está procesando.'}
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
            <span class="info-label">${texts.currentStatus}:</span>
            <span class="status pending">${orderStatus}</span>
          </div>
          <div class="info-row">
            <span class="info-label">${texts.date}:</span>
            <span class="info-value">${new Date(dbOrderData.created_at).toLocaleString(language === 'en' ? 'en-US' : 'es-ES')}</span>
          </div>
        </div>
        
        <div style="background: #f1f5f9; border-radius: 8px; padding: 24px; margin: 20px 0; text-align: center;">
          <h4 style="color: #1e293b; margin-bottom: 12px; font-size: 16px;">${texts.whatNext}</h4>
          <div style="text-align: left; color: #475569; font-size: 14px; line-height: 1.6;">
            <p style="margin: 8px 0;">• <strong>${language === 'en' ? 'Technical review' : 'Revisión técnica'}:</strong> ${texts.technicalReview}</p>
            <p style="margin: 8px 0;">• <strong>${language === 'en' ? 'Preparation' : 'Preparación'}:</strong> ${texts.preparation}</p>
            <p style="margin: 8px 0;">• <strong>${language === 'en' ? 'Notification' : 'Notificación'}:</strong> ${texts.notification}</p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding: 20px; background: #fef7cd; border-radius: 8px; border-left: 4px solid #f59e0b;">
          <p style="color: #92400e; font-size: 14px; margin: 0;">
            <strong>${texts.questions}</strong><br>
            ${texts.keepInformed}
          </p>
        </div>
      </div>
    `;
    
    const { data, error } = await resend.emails.send({
      from: 'Filesecufb <noreply@filesecufb.com>',
      to: dbOrderData.client_email,
      subject: `${texts.statusUpdate} #${dbOrderData.id} - ${serviceName}`,
      html: createProfessionalTemplate(emailContent, false, language)
    });

    if (error) {
      console.error('Error enviando confirmación al cliente:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error en /api/send-confirmation:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Endpoint para enviar actualización de estado
app.post('/api/send-status-update', async (req, res) => {
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
    
    // Determinar el mensaje según el estado
    let statusMessage = '';
    let statusColor = '#2563eb';
    
    switch(dbOrderData.status) {
      case 'processing':
        statusMessage = language === 'en' ? 'Your order is being processed by our technical team.' : 'Tu pedido está siendo procesado por nuestro equipo técnico.';
        statusColor = '#2563eb';
        break;
      case 'in_progress':
        statusMessage = language === 'en' ? 'We are actively working on your ECU reprogramming.' : 'Estamos trabajando activamente en la reprogramación de tu ECU.';
        statusColor = '#f59e0b';
        break;
      case 'completed':
        statusMessage = language === 'en' 
          ? 'Excellent! Your order has been completed successfully.' 
          : '¡Excelente! Tu pedido ha sido completado exitosamente.';
        statusColor = '#10b981';
        break;
      case 'ready':
        statusMessage = language === 'en' ? 'Your order is ready for delivery or download.' : 'Tu pedido está listo para entrega o descarga.';
        statusColor = '#10b981';
        break;
      default:
        statusMessage = language === 'en' ? 'Your order status has been updated.' : 'El estado de tu pedido ha sido actualizado.';
        statusColor = '#6b7280';
    }
    
    // Crear botón para pedidos completados
    const completedButton = dbOrderData.status === 'completed' ? `
      <div style="text-align: center; margin: 25px 0;">
        <a href="https://filesecufb.com/client-dashboard?section=orders" 
           style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
                  color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; 
                  font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); 
                  transition: all 0.3s ease;">
          ${language === 'en' ? '🔍 View My Orders' : '🔍 Ver Mis Pedidos'}
        </a>
        <p style="color: #065f46; font-size: 14px; margin: 10px 0 0 0; font-weight: 500;">
          ${language === 'en' ? 'Access your client panel to download your files' : 'Accede a tu panel de cliente para descargar tus archivos'}
        </p>
      </div>
    ` : '';

    const emailContent = `
      <div class="content">
        <h1 class="title">${texts.statusUpdate}</h1>
        <div style="text-align: center; margin: 20px 0; padding: 20px; background: #f0f9ff; border-radius: 8px; border-left: 4px solid ${statusColor};">
           <p style="color: #0c4a6e; font-size: 16px; margin: 0; font-weight: 500;">
             <strong>${language === 'en' ? `Hello ${orderData.client_name}` : `Hola ${orderData.client_name}`},</strong><br>
             ${statusMessage}
           </p>
         </div>
         ${completedButton}
        
        <div class="card">
          <h3 class="card-title">${texts.currentStatus}</h3>
          <div class="info-row">
            <span class="info-label">${texts.orderId}:</span>
            <span class="info-value">#${dbOrderData.id}</span>
          </div>
          <div class="info-row">
            <span class="info-label">${texts.status}:</span>
            <span class="status ${orderData.status}" style="background-color: ${statusColor}20; color: ${statusColor};">${orderData.status.toUpperCase()}</span>
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
      to: orderData.client_email,
      subject: `${texts.statusUpdate} #${orderData.id} - ${orderData.status.toUpperCase()}`,
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
});

// Endpoint para enviar pedido completado
app.post('/api/send-completed-order', async (req, res) => {
  try {
    const { orderData, attachments, language = 'es' } = req.body;
    
    if (!orderData || !orderData.id) {
      return res.status(400).json({ error: 'orderData with id is required' });
    }
    
    console.log('Sending completed order for order:', orderData.id);
    
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
    
    const hasAttachments = attachments && attachments.length > 0;
    
    const emailContent = `
        <div class="content">
          <h1 class="title">${texts.orderCompleted}!</h1>
          <div style="text-align: center; margin: 20px 0; padding: 24px; background: #ecfdf5; border-radius: 12px; border: 2px solid #10b981;">
            <p style="color: #065f46; font-size: 18px; margin: 0; font-weight: 600;">
              ${texts.excellentNews}, ${dbOrderData.client_name}!
            </p>
            <p style="color: #047857; font-size: 16px; margin: 8px 0 0 0; font-weight: 500;">
              ${texts.orderCompletedSuccessfully}
            </p>
          </div>
          
          <div class="card">
            <h3 class="card-title">${texts.completedOrderSummary}</h3>
          <div class="info-row">
            <span class="info-label">${texts.orderId}:</span>
            <span class="info-value">#${dbOrderData.id}</span>
          </div>
          <div class="info-row">
            <span class="info-label">${texts.servicePerformed}:</span>
            <span class="info-value">${serviceName}</span>
          </div>
          <div class="info-row">
            <span class="info-label">${texts.vehicle}:</span>
            <span class="info-value">${vehicleInfo}</span>
          </div>
          <div class="info-row">
            <span class="info-label">${texts.totalPaid}:</span>
            <span class="info-value price">€${totalPrice}</span>
          </div>
          <div class="info-row">
            <span class="info-label">${texts.status}:</span>
            <span class="status completed">${texts.completed.toUpperCase()}</span>
          </div>
          <div class="info-row">
            <span class="info-label">${texts.completionDate}:</span>
            <span class="info-value">${new Date().toLocaleString(language === 'en' ? 'en-US' : 'es-ES')}</span>
          </div>
        </div>
        
        ${hasAttachments ? `
         <div style="background: #f0f9ff; border-radius: 8px; padding: 24px; margin: 20px 0; border-left: 4px solid #2563eb;">
           <h4 style="color: #1e40af; margin-bottom: 12px; font-size: 16px;">${texts.filesIncluded}</h4>
           <p style="color: #1e40af; font-size: 14px; margin: 0; line-height: 1.6;">
             ${texts.perfect}
           </p>
           <div style="margin-top: 12px; padding: 12px; background: #dbeafe; border-radius: 6px;">
             <p style="color: #1e40af; font-size: 13px; margin: 0; font-weight: 500;">
               ${attachments.length} ${texts.filesAttached}
             </p>
           </div>
         </div>
         ` : `
         <div style="background: #f0f9ff; border-radius: 8px; padding: 24px; margin: 20px 0; border-left: 4px solid #2563eb;">
           <h4 style="color: #1e40af; margin-bottom: 12px; font-size: 16px;">${texts.fileAccess}</h4>
           <p style="color: #1e40af; font-size: 14px; margin: 0; line-height: 1.6;">
             ${texts.filesAvailable}
           </p>
         </div>
         `}
        
        <div style="background: #f8fafc; border-radius: 8px; padding: 24px; margin: 20px 0; text-align: center;">
           <h4 style="color: #1e293b; margin-bottom: 16px; font-size: 16px;">${texts.technicalInfo}</h4>
           <div style="text-align: left; color: #475569; font-size: 14px; line-height: 1.6;">
             <p style="margin: 8px 0;">• <strong>${language === 'en' ? 'Warranty' : 'Garantía'}:</strong> ${texts.warranty}</p>
             <p style="margin: 8px 0;">• <strong>${language === 'en' ? 'Support' : 'Soporte'}:</strong> ${texts.support}</p>
             <p style="margin: 8px 0;">• <strong>${language === 'en' ? 'Backup' : 'Backup'}:</strong> ${texts.backup}</p>
           </div>
         </div>
         
         <div style="text-align: center; margin-top: 30px; padding: 24px; background: #fef7cd; border-radius: 8px; border-left: 4px solid #f59e0b;">
           <p style="color: #92400e; font-size: 16px; margin: 0; font-weight: 600;">
             ${texts.thanksForChoosing}
           </p>
           <p style="color: #92400e; font-size: 14px; margin: 8px 0 0 0;">
             ${texts.supportAvailable}
           </p>
         </div>
      </div>
    `;
    
    const emailOptions = {
      from: 'Filesecufb <noreply@filesecufb.com>',
      to: dbOrderData.client_email,
      subject: `${texts.orderCompleted} #${dbOrderData.id} - ${serviceName}`,
      html: createProfessionalTemplate(emailContent, false, language)
    };
    
    // Agregar adjuntos si existen
    if (hasAttachments) {
      emailOptions.attachments = attachments.map(attachment => ({
        filename: attachment.filename,
        content: attachment.content,
        encoding: 'base64'
      }));
    }
    
    const { data, error } = await resend.emails.send(emailOptions);

    if (error) {
      console.error('Error enviando pedido completado:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error en /api/send-completed-order:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Endpoint de salud
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Email API is running' });
});

app.listen(PORT, () => {
  console.log(`Email API server running on port ${PORT}`);
});

export default app;