import React from 'react';
import { Car, Calendar, Wrench, FileText, CheckCircle, Clock, AlertCircle, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface OrderCardProps {
  order: any;
  onViewMore?: (order: any) => void;
  adminFiles?: { [orderId: string]: any[] };
}

const OrderCard: React.FC<OrderCardProps> = ({ order, onViewMore, adminFiles = {} }) => {
  const { t } = useTranslation();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5" />;
      case 'in_progress':
        return <Clock className="w-5 h-5" />;
      case 'pending':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border-2 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105";
    switch (status) {
      case 'completed':
      case 'delivered':
        return `${baseClasses} bg-gradient-to-r from-green-500/30 to-emerald-500/30 text-green-300 border-green-400/60 shadow-green-500/25 hover:shadow-green-500/40`;
      case 'in_progress':
        return `${baseClasses} bg-gradient-to-r from-yellow-500/30 to-amber-500/30 text-yellow-300 border-yellow-400/60 shadow-yellow-500/25 hover:shadow-yellow-500/40`;
      case 'pending':
        return `${baseClasses} bg-gradient-to-r from-orange-500/30 to-red-500/30 text-orange-300 border-orange-400/60 shadow-orange-500/25 hover:shadow-orange-500/40`;
      default:
        return `${baseClasses} bg-gradient-to-r from-gray-500/30 to-slate-500/30 text-gray-300 border-gray-400/60 shadow-gray-500/25 hover:shadow-gray-500/40`;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return t('clientDashboard.orders.status.pending');
      case 'in_progress':
        return t('clientDashboard.orders.status.inProgress');
      case 'completed':
        return t('clientDashboard.orders.status.completed');
      case 'delivered':
        return t('clientDashboard.orders.status.delivered');
      case 'paid':
        return t('clientDashboard.orders.status.paid');
      default:
        return status;
    }
  };

  const handleDownload = async (fileUrl: string, fileName: string, file?: any) => {
    console.log('🔥 INICIO handleDownload - Botón clickeado');
    console.log('📁 Parámetros recibidos:', { fileUrl, fileName, file_category: file?.file_category });
    
    try {
      console.log('✅ Validando parámetros...');
      if (!fileUrl || fileUrl.trim() === '') {
        console.error('❌ ERROR: fileUrl está vacío o es inválido:', fileUrl);
        toast.error('URL de archivo inválida');
        return;
      }
      console.log('✅ Parámetros válidos');
      console.log('🔍 ANÁLISIS DETALLADO DE URL:', fileUrl);
      console.log('🏷️ Categoría del archivo:', file?.file_category || 'no especificada');

      // Para URLs completas, usar fetch directo
      if (fileUrl.startsWith('http')) {
        console.log('🌐 Detectada URL completa, usando fetch directo');
        const response = await fetch(fileUrl);
        console.log('📡 Respuesta del fetch:', response.status, response.statusText);
        
        if (!response.ok) {
          console.error('❌ ERROR en fetch:', response.status, response.statusText);
          throw new Error('Error al obtener el archivo');
        }
        
        console.log('📦 Convirtiendo respuesta a blob...');
        const blob = await response.blob();
        console.log('📦 Blob creado:', blob.size, 'bytes');
        
        const downloadUrl = URL.createObjectURL(blob);
        console.log('🔗 URL de descarga creada:', downloadUrl);
        
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = fileName;
        document.body.appendChild(link);
        console.log('🖱️ Simulando click en enlace de descarga...');
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);
        
        console.log('✅ Descarga HTTP completada exitosamente');
        toast.success(`Descargando ${fileName}...`);
        return;
      }

      // Para paths relativos o URLs de Supabase, extraer path y bucket
      console.log('🗂️ Procesando URL de Supabase, extrayendo path y bucket...');
      
      let bucketName = 'adminorders'; // Default bucket
      let filePath = fileUrl;
      
      // PRIORIDAD 1: Detectar bucket por file_category
      if (file?.file_category === 'invoice') {
        bucketName = 'invoices';
        console.log('🏷️ Bucket determinado por file_category=invoice:', bucketName);
      } else if (file?.file_category === 'map') {
        bucketName = 'adminorders';
        console.log('🏷️ Bucket determinado por file_category=map:', bucketName);
      }
      
      // Si es una URL completa de Supabase, extraer el path
      if (fileUrl.includes('supabase.co/storage/v1/object/public/')) {
        console.log('🔗 Detectada URL completa de Supabase, extrayendo path...');
        const urlParts = fileUrl.split('/storage/v1/object/public/');
        if (urlParts.length > 1) {
          const pathWithBucket = urlParts[1];
          const pathParts = pathWithBucket.split('/');
          const extractedBucket = pathParts[0]; // Primer parte es el bucket
          filePath = pathParts.slice(1).join('/'); // Resto es el path
          console.log('🗂️ Bucket extraído de URL:', extractedBucket);
          console.log('📂 Path extraído:', filePath);
          
          // Solo usar el bucket extraído si no se determinó por file_category
          if (!file?.file_category) {
            bucketName = extractedBucket;
            console.log('🗂️ Usando bucket extraído de URL:', bucketName);
          }
        }
      } else {
        // Para paths relativos, determinar bucket por contenido
        console.log('🗂️ Detectado path relativo, determinando bucket...');
        if (fileUrl.includes('clientordersprincipal/')) {
          bucketName = 'clientordersprincipal';
        } else if (fileUrl.includes('clientorderadicional/')) {
          bucketName = 'clientorderadicional';
        } else if (fileUrl.includes('invoices/')) {
          bucketName = 'invoices';
        }
        filePath = fileUrl;
      }
      
      // PRIORIDAD 2: Detectar bucket basándose en la URL completa para casos específicos
      if (fileUrl.includes('/invoices/') || fileUrl.includes('invoice')) {
        bucketName = 'invoices';
        console.log('🗂️ Bucket corregido a invoices por detección de URL/contenido');
      } else if (fileUrl.includes('/adminorders/')) {
        bucketName = 'adminorders';
        console.log('🗂️ Bucket confirmado como adminorders por detección de URL');
      }
      
      console.log('🗂️ BUCKET FINAL DETERMINADO:', bucketName);
      console.log('📂 PATH FINAL DEL ARCHIVO:', filePath);
      console.log('🔍 INTENTANDO DESCARGAR - Bucket:', bucketName, 'FilePath:', filePath, 'URL Original:', fileUrl);

      console.log('☁️ Creando URL firmada para descarga desde Supabase Storage...');
      console.log('📋 PARÁMETROS PARA createSignedUrl:', { bucket: bucketName, path: filePath });
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(filePath, 60); // URL válida por 60 segundos

      if (signedUrlError) {
        console.error('❌ ERROR al crear URL firmada:', signedUrlError);
        throw signedUrlError;
      }
      
      if (!signedUrlData?.signedUrl) {
        console.error('❌ ERROR: No se pudo obtener URL firmada');
        throw new Error('No se pudo generar la URL de descarga');
      }

      console.log('🔗 URL firmada creada exitosamente');
      
      // Descargar usando la URL firmada
      console.log('📡 Descargando archivo usando URL firmada...');
      const response = await fetch(signedUrlData.signedUrl);
      
      if (!response.ok) {
        console.error('❌ ERROR en respuesta HTTP:', response.status, response.statusText);
        throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      console.log('📦 Archivo descargado:', blob.size, 'bytes');
      
      const downloadUrl = URL.createObjectURL(blob);
      console.log('🔗 URL de descarga local creada:', downloadUrl);
      
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = fileName;
      document.body.appendChild(a);
      console.log('🖱️ Simulando click en enlace de descarga...');
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
      
      console.log('✅ Descarga de Supabase completada exitosamente');
      toast.success(`Descargando ${fileName}...`);
    } catch (error: any) {
      console.error('💥 ERROR COMPLETO en handleDownload:', error);
      console.error('💥 Mensaje del error:', error.message);
      console.error('💥 Stack del error:', error.stack);
      toast.error(`Error al descargar: ${error.message || 'Error desconocido'}`);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl overflow-hidden hover:border-primary/30 transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-primary/10 w-full max-w-none">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-gray-700/30">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-primary/20 p-2 rounded-lg flex-shrink-0">
                <Car className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold text-white truncate">Pedido #{order.id}</h3>
                <p className="text-sm text-gray-400">{new Date(order.order_date || order.created_at).toLocaleDateString('es-ES')}</p>
              </div>
            </div>
            <div className={getStatusBadge(order.status)}>
              {getStatusIcon(order.status)}
              <span className="truncate">{getStatusText(order.status)}</span>
            </div>
          </div>
          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 sm:text-right">
            <p className="text-xl sm:text-2xl font-bold text-primary">€{parseFloat(order.total_price || '0').toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Vehicle & Service Info */}
      <div className="p-4 sm:p-6 bg-gray-800/30">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="bg-blue-500/20 p-2 rounded-lg flex-shrink-0">
                <Car className="w-4 h-4 text-blue-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{t('clientDashboard.orders.card.vehicle')}</p>
                <p className="text-white font-medium break-words">{order.vehicle || `${order.vehicle_make || ''} ${order.vehicle_model || ''}`.trim()}</p>
                {order.vehicle_year && <p className="text-sm text-gray-400 mt-1">{t('clientDashboard.orders.card.year')} {order.vehicle_year}</p>}
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="bg-purple-500/20 p-2 rounded-lg flex-shrink-0">
                <Wrench className="w-4 h-4 text-purple-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{t('clientDashboard.orders.card.service')}</p>
                <p className="text-white font-medium break-words">{order.services?.title || order.service_name || order.service_type || 'Servicio no especificado'}</p>
                {order.additional_services_details && order.additional_services_details.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{t('clientDashboard.orders.card.additionalServices')}</p>
                    <div className="space-y-1">
                      {order.additional_services_details.map((service: any, index: number) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span className="text-gray-300">{service.title}</span>
                          <span className="text-primary font-medium">€{service.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content - Información básica */}
      <div className="border-t border-gray-700/30 p-6">
        {order.estimated_delivery && (
          <div className="bg-gray-700/30 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <p className="text-sm text-gray-300">
                Entrega estimada: {new Date(order.estimated_delivery).toLocaleDateString('es-ES')}
              </p>
            </div>
          </div>
        )}
        
        {/* Información adicional del pedido */}

        {/* Archivos Tuneados - Solo para pedidos completados */}
        {(order.status === 'completed' || order.status === 'delivered') && adminFiles[order.id] && Array.isArray(adminFiles[order.id]) && adminFiles[order.id].filter((file: any) => file.file_category === 'map').length > 0 && (
          <div className="bg-gray-700/20 rounded-lg p-4 mb-4">
            <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Archivos Tuneados
            </h4>
            <div className="space-y-2">
               {adminFiles[order.id].filter((file: any) => file.file_category === 'map').map((file: any, index: number) => (
                <div key={index} className="bg-green-900/20 border border-green-500/30 rounded-lg p-3 flex justify-between items-center">
                  <div className="flex-1">
                    <p className="text-white font-medium">{file.file_name}</p>
                    <div className="flex items-center gap-4 mt-1">
                       <p className="text-xs text-gray-400">
                         {new Date(file.upload_date || file.created_at).toLocaleDateString('es-ES')}
                       </p>
                       {file.file_size && (
                         <p className="text-xs text-gray-400">
                           {formatFileSize(file.file_size)}
                         </p>
                       )}
                     </div>
                     {file.admin_comments && (
                       <p className="text-green-200 text-sm mt-2 italic">
                         {file.admin_comments}
                       </p>
                     )}
                  </div>
                  <button
                    onClick={() => handleDownload(file.file_url, file.file_name, file)}
                    className="bg-green-600 hover:bg-green-500 text-white px-3 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Descargar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Facturas - Solo para pedidos completados */}
        {(order.status === 'completed' || order.status === 'delivered') && adminFiles[order.id] && Array.isArray(adminFiles[order.id]) && adminFiles[order.id].filter((file: any) => file.file_category === 'invoice').length > 0 && (
          <div className="bg-gray-700/20 rounded-lg p-4 mb-4">
            <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Facturas
            </h4>
            <div className="space-y-2">
               {adminFiles[order.id].filter((file: any) => file.file_category === 'invoice').map((file: any, index: number) => (
                <div key={index} className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 flex justify-between items-center">
                  <div className="flex-1">
                    <p className="text-white font-medium">{file.file_name}</p>
                    <div className="flex items-center gap-4 mt-1">
                       <p className="text-xs text-gray-400">
                         {new Date(file.upload_date || file.created_at).toLocaleDateString('es-ES')}
                       </p>
                       {file.file_size && (
                         <p className="text-xs text-gray-400">
                           {formatFileSize(file.file_size)}
                         </p>
                       )}
                     </div>
                     {file.admin_comments && (
                       <p className="text-blue-200 text-sm mt-2 italic">
                         {file.admin_comments}
                       </p>
                     )}
                  </div>
                  <button
                    onClick={() => handleDownload(file.file_url, file.file_name, file)}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Descargar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Botón Ver más */}
        {onViewMore && (
          <div className="flex justify-center pt-4">
            <button
              onClick={() => onViewMore(order)}
              className="bg-primary hover:bg-primary/80 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
            >
              Ver más
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderCard;