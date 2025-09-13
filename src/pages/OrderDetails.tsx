import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, User, Car, FileText, Settings, CheckCircle, Clock, AlertCircle, ChevronDown, FileDown, Upload, MapPin, Wrench, CreditCard, Trash2 } from 'lucide-react';
import jsPDF from 'jspdf';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { handleStatusChange as sendStatusChangeEmail, OrderData as EmailOrderData } from '../services/emailService';

interface OrderData {
  id: string;
  client_id: string;
  service_id: string;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_generation?: string;
  vehicle_engine?: string;
  vehicle_ecu?: string;
  vehicle_year?: string;
  vehicle_gearbox?: string;
  engine_hp?: string;
  engine_kw?: string;
  vin?: string;
  read_method?: string;
  hardware_number?: string;
  software_number?: string;
  main_file_url?: string;
  optional_attachments_urls?: string[];
  has_modified_parts?: boolean;
  aftermarket_exhaust?: boolean;
  aftermarket_exhaust_remarks?: string;
  aftermarket_intake_manifold?: boolean;
  aftermarket_intake_manifold_remarks?: string;
  cold_air_intake?: boolean;
  cold_air_intake_remarks?: string;
  decat?: boolean;
  decat_remarks?: string;
  additional_info?: string;
  additional_services?: any[];
  additional_services_details?: any[];
  base_price?: number;
  additional_services_price?: number;
  total_price?: number;
  status: string;
  created_at: string;
  updated_at: string;
  services?: {
    id: string;
    title: string;
    category: string;
    price: number;
  };
  profiles?: {
    id: string;
    full_name: string;
    email: string;
    phone?: string;
    billing_address?: string;
    billing_city?: string;
    billing_postal_code?: string;
    billing_country?: string;
  };
  order_files?: AdminFile[];
  invoices?: AdminInvoice[];
}

interface AdminFile {
  id: string;
  order_id: string;
  file_name: string;
  file_url: string;
  file_size?: number;
  file_type?: string;
  file_category?: 'map' | 'invoice' | 'other';
  admin_comments?: string;
  created_at: string;
}

interface AdminInvoice {
  id: string;
  order_id: string;
  client_id: string;
  file_name: string;
  file_url: string;
  file_size?: number;
  file_type?: string;
  admin_comments?: string;
  created_at: string;
}

const OrderDetails: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { t } = useTranslation();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingInvoice, setUploadingInvoice] = useState(false);
  const [editingComments, setEditingComments] = useState<{[key: string]: boolean}>({});
  const [tempComments, setTempComments] = useState<{[key: string]: string}>({});
  const [mapComment, setMapComment] = useState('');
  const [invoiceComment, setInvoiceComment] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{[key: string]: boolean}>({});
  const [deletingFile, setDeletingFile] = useState<{[key: string]: boolean}>({});
  const [downloadingAllFiles, setDownloadingAllFiles] = useState(false);

  // Protección de rutas: Solo admins pueden acceder
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        toast.error('Debes iniciar sesión para acceder a esta página.');
        navigate('/login', { replace: true });
        return;
      }
      if (!isAdmin) {
        toast.error('Acceso denegado. Esta página es solo para administradores.');
        navigate('/', { replace: true });
        return;
      }
    }
  }, [authLoading, user, isAdmin, navigate]);

  // Cargar datos del pedido desde Supabase
  useEffect(() => {
    const loadOrder = async () => {
      if (!orderId) {
        setError('ID de pedido no proporcionado');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Obtener el pedido con archivos admin e invoices
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            services (
              id,
              title,
              category,
              price
            ),
            order_files (
              id,
              order_id,
              file_name,
              file_url,
              file_size,
              file_type,
              file_category,
              admin_comments,
              created_at
            ),
            invoices (
              id,
              order_id,
              client_id,
              file_name,
              file_url,
              file_size,
              file_type,
              admin_comments,
              created_at
            )
          `)
          .eq('id', orderId)
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          // Obtener datos reales del perfil del cliente usando función admin
          let profileData = null;
          try {
            const { data: profile, error: profileError } = await supabase
              .rpc('admin_get_profile', { target_user_id: data.client_id });

            if (profileError) {
              console.error('Error fetching profile:', profileError);
            } else {
              profileData = profile?.[0] || null;
            }
          } catch (profileErr) {
            console.error('Error calling admin_get_profile:', profileErr);
          }

          // Obtener servicios adicionales si existen
          let additionalServicesDetails = [];
          if (data.additional_services && data.additional_services.length > 0) {
            try {
              const { data: servicesData, error: servicesError } = await supabase
                .from('services')
                .select('id, title, price')
                .in('id', data.additional_services);

              if (servicesError) {
                console.error('Error fetching additional services:', servicesError);
              } else {
                additionalServicesDetails = servicesData || [];
              }
            } catch (servicesErr) {
              console.error('Error loading additional services:', servicesErr);
            }
          }

          const orderWithProfile = {
            ...data,
            profiles: profileData,
            additional_services_details: additionalServicesDetails
          };

          setOrder(orderWithProfile);
        }
      } catch (err: any) {
        console.error('Error loading order:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [orderId]);

  const handleStatusChange = async (newStatus: string) => {
    if (!order) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);

      if (error) {
        throw error;
      }

      setOrder(prev => prev ? { ...prev, status: newStatus } : null);
      setIsStatusDropdownOpen(false);
      toast.success('Estado del pedido actualizado correctamente');

      // Enviar email de cambio de estado
      try {
        const emailOrderData: EmailOrderData = {
          id: order.id,
          client_email: order.profiles?.email || '',
          client_name: order.profiles?.full_name || 'Cliente',
          service_name: order.services?.title || 'Servicio',
          status: newStatus,
          vehicle_info: `${order.vehicle_make || ''} ${order.vehicle_model || ''} ${order.vehicle_year || ''}`.trim(),
          total_price: order.total_price || 0,
          created_at: order.created_at,
          order_files: order.order_files || [],
          invoices: order.invoices || []
        };

        await sendStatusChangeEmail(emailOrderData);
      } catch (emailError) {
        console.warn('Error sending status change email:', emailError);
        // No mostramos error al usuario para no interrumpir el flujo
      }
    } catch (err: any) {
      console.error('Error updating order status:', err);
      toast.error(`Error al actualizar estado: ${err.message}`);
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'pending':
        return t('orderDetails.orderStatus.pending');
      case 'in_progress':
        return t('orderDetails.orderStatus.inProgress');
      case 'completed':
        return t('orderDetails.orderStatus.completed');
      case 'cancelled':
        return t('orderDetails.orderStatus.cancelled');
      default:
        return t('orderDetails.orderStatus.pending');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5" />;
      case 'in_progress':
        return <AlertCircle className="w-5 h-5" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5" />;
      case 'cancelled':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'in_progress':
        return 'text-blue-400 bg-blue-500/20';
      case 'completed':
        return 'text-green-400 bg-green-500/20';
      case 'cancelled':
        return 'text-red-400 bg-red-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !order) return;

    try {
      setUploading(true);
      
      // Crear un nombre único para el archivo
      const fileName = `tuned-map-${order.id}-${Date.now()}.${file.name.split('.').pop()}`;
      
      const { error: uploadError } = await supabase.storage
        .from('order-files')
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      // Obtener URL pública del archivo
      const { data: { publicUrl } } = supabase.storage
        .from('order-files')
        .getPublicUrl(fileName);

      // Guardar información del archivo en la base de datos
      const { error: dbError } = await supabase
        .from('order_files')
        .insert({
          order_id: order.id,
          client_id: order.client_id,
          uploaded_by: user?.id || null,
          file_name: file.name,
          file_url: publicUrl,
          file_size: file.size,
          file_type: file.type,
          file_category: 'map',
          admin_comments: mapComment
        });

      if (dbError) {
        console.error('Error saving file info:', dbError);
        throw dbError;
      }

      toast.success('Mapa tuneado subido correctamente');
      setMapComment('');
      
      // Recargar datos de la orden
      window.location.reload();
      
    } catch (err: any) {
      console.error('Error uploading file:', err);
      toast.error(`Error al subir archivo: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleInvoiceUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !order) return;

    try {
      setUploadingInvoice(true);
      
      // Crear un nombre único para la factura
      const fileName = `invoice-${order.id}-${Date.now()}.${file.name.split('.').pop()}`;
      
      const { error: uploadError } = await supabase.storage
        .from('order-files')
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      // Obtener URL pública del archivo
      const { data: { publicUrl } } = supabase.storage
        .from('order-files')
        .getPublicUrl(fileName);

      // Guardar información de la factura en la base de datos
      const { error: dbError } = await supabase
        .from('invoices')
        .insert({
          order_id: order.id,
          client_id: order.client_id,
          file_name: file.name,
          file_url: publicUrl,
          file_size: file.size,
          file_type: file.type,
          admin_comments: invoiceComment
        });

      if (dbError) {
        console.error('Error saving invoice info:', dbError);
        throw dbError;
      }

      toast.success('Factura subida correctamente');
      setInvoiceComment('');
      
      // Recargar datos de la orden
      window.location.reload();
      
    } catch (err: any) {
      console.error('Error uploading invoice:', err);
      toast.error(`Error al subir factura: ${err.message}`);
    } finally {
      setUploadingInvoice(false);
    }
  };

  const startEditingComment = (fileId: string, currentComment: string) => {
    setEditingComments(prev => ({ ...prev, [fileId]: true }));
    setTempComments(prev => ({ ...prev, [fileId]: currentComment || '' }));
  };

  const cancelEditingComment = (fileId: string) => {
    setEditingComments(prev => ({ ...prev, [fileId]: false }));
    setTempComments(prev => ({ ...prev, [fileId]: '' }));
  };

  const saveComment = async (fileId: string, table: 'order_files' | 'invoices') => {
    try {
      const comment = tempComments[fileId];
      
      const { error } = await supabase
        .from(table)
        .update({ admin_comments: comment })
        .eq('id', fileId);

      if (error) {
        throw error;
      }

      // Actualizar el estado local
      if (order) {
        if (table === 'order_files') {
          setOrder(prev => ({
            ...prev!,
            order_files: prev!.order_files?.map(file => 
              file.id === fileId ? { ...file, admin_comments: comment } : file
            )
          }));
        } else {
          setOrder(prev => ({
            ...prev!,
            invoices: prev!.invoices?.map(invoice => 
              invoice.id === fileId ? { ...invoice, admin_comments: comment } : invoice
            )
          }));
        }
      }

      setEditingComments(prev => ({ ...prev, [fileId]: false }));
      setTempComments(prev => ({ ...prev, [fileId]: '' }));
      toast.success('Comentario actualizado correctamente');
    } catch (err: any) {
      console.error('Error updating comment:', err);
      toast.error(`Error al actualizar comentario: ${err.message}`);
    }
  };

  const confirmDelete = (fileId: string) => {
    setShowDeleteConfirm(prev => ({ ...prev, [fileId]: true }));
  };

  const cancelDelete = (fileId: string) => {
    setShowDeleteConfirm(prev => ({ ...prev, [fileId]: false }));
  };

  const deleteFile = async (fileId: string, table: 'order_files' | 'invoices') => {
    try {
      setDeletingFile(prev => ({ ...prev, [fileId]: true }));
      
      // Primero eliminar de la base de datos
      const { error: dbError } = await supabase
        .from(table)
        .delete()
        .eq('id', fileId);

      if (dbError) {
        throw dbError;
      }

      // Luego eliminar del storage
      // Extraer el nombre del archivo del file_url para eliminarlo del storage
      const fileData = table === 'order_files' 
        ? order?.order_files?.find(f => f.id === fileId)
        : order?.invoices?.find(f => f.id === fileId);
      
      if (fileData && fileData.file_url) {
        // Extraer el nombre del archivo del URL
        const urlParts = fileData.file_url.split('/');
        const storageFileName = urlParts[urlParts.length - 1];
        
        const { error: storageError } = await supabase.storage
          .from('order-files')
          .remove([storageFileName]);

        if (storageError) {
          console.warn('Error deleting from storage (file may not exist):', storageError);
        }
      }

      // Actualizar el estado local
      if (order) {
        if (table === 'order_files') {
          setOrder(prev => ({
            ...prev!,
            order_files: prev!.order_files?.filter(file => file.id !== fileId)
          }));
        } else {
          setOrder(prev => ({
            ...prev!,
            invoices: prev!.invoices?.filter(invoice => invoice.id !== fileId)
          }));
        }
      }

      setShowDeleteConfirm(prev => ({ ...prev, [fileId]: false }));
      toast.success(`${table === 'order_files' ? 'Mapa' : 'Factura'} eliminado correctamente`);
    } catch (err: any) {
      console.error('Error deleting file:', err);
      toast.error(`Error al eliminar archivo: ${err.message}`);
    } finally {
      setDeletingFile(prev => ({ ...prev, [fileId]: false }));
    }
  };

  // Función para extraer el path del archivo desde una URL completa de Supabase Storage
  const extractFilePathFromUrl = (url: string): string => {
    try {
      // Si ya es un path relativo (no contiene http), devolverlo tal como está
      if (!url.startsWith('http')) {
        return url;
      }
      
      // Extraer el path después de '/object/'
      const objectIndex = url.indexOf('/object/');
      if (objectIndex !== -1) {
        return url.substring(objectIndex + 8); // +8 para saltar '/object/'
      }
      
      // Si no encuentra el patrón, intentar extraer después del bucket name
      const bucketPattern = '/order-files/';
      const bucketIndex = url.indexOf(bucketPattern);
      if (bucketIndex !== -1) {
        return url.substring(bucketIndex + bucketPattern.length);
      }
      
      return url;
    } catch (error) {
      console.error('Error extracting file path:', error);
      return url;
    }
  };

  // Función para extraer el nombre original del archivo desde una URL de Supabase Storage
  const extractFileNameFromUrl = (url: string): string => {
    try {
      if (!url) return 'archivo-sin-nombre';
      
      // Extraer el path del archivo
      const filePath = extractFilePathFromUrl(url);
      
      // Obtener solo el nombre del archivo (última parte del path)
      const fileName = filePath.split('/').pop() || 'archivo-sin-nombre';
      
      // Decodificar URL para manejar caracteres especiales
      const decodedFileName = decodeURIComponent(fileName);
      
      // Remover el timestamp del inicio del nombre si existe (formato: timestamp_nombreoriginal)
      const timestampPattern = /^\d{13}_/; // 13 dígitos seguidos de guión bajo
      const originalName = decodedFileName.replace(timestampPattern, '');
      
      return originalName || 'archivo-sin-nombre';
    } catch (error) {
      console.error('Error extracting file name:', error);
      return 'archivo-sin-nombre';
    }
  };

  const downloadFile = async (url: string, fileName: string) => {
    try {
      // Validar que la URL no esté vacía
      if (!url || url.trim() === '') {
        toast.error('URL de archivo no válida');
        return;
      }

      // Usar la URL directamente para la descarga
      // Si es una URL completa de Supabase, usarla tal como está
      // Si es un path relativo, construir la URL pública
      let downloadUrl = url;
      
      if (!url.startsWith('http')) {
        // Es un path relativo, construir URL pública
        const { data } = supabase.storage
          .from('order-files')
          .getPublicUrl(url);
        downloadUrl = data.publicUrl;
      }

      // Crear elemento temporal para descarga
      const response = await fetch(downloadUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
      
      toast.success('Descarga iniciada correctamente');
    } catch (err: any) {
      console.error('Error downloading file:', err);
      
      // Manejo de errores más específico
      if (err.message.includes('404') || err.message.includes('not found')) {
        toast.error('El archivo no existe o ha sido eliminado');
      } else if (err.message.includes('403') || err.message.includes('permission')) {
        toast.error('No tienes permisos para descargar este archivo');
      } else if (err.message.includes('network') || err.message.includes('fetch')) {
        toast.error('Error de conexión al descargar el archivo');
      } else {
        toast.error('Error al descargar el archivo. Inténtalo de nuevo.');
      }
    }
  };

  const generatePDF = async () => {
    if (!order) return;

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 20;
      let yPosition = 25;

      // Colores corporativos
      const primaryColor = [59, 130, 246]; // Azul primario
      const darkColor = [31, 41, 55]; // Gris oscuro
      const lightColor = [107, 114, 128]; // Gris claro
      const accentColor = [16, 185, 129]; // Verde accent

      // Función para verificar si necesitamos una nueva página
      const checkNewPage = (requiredSpace: number) => {
        if (yPosition + requiredSpace > pageHeight - 30) {
          doc.addPage();
          yPosition = 30;
          return true;
        }
        return false;
      };

      // Función para agregar logo (simulado con texto estilizado)
      const addLogo = () => {
        // Logo simulado con texto estilizado
        doc.setFontSize(24);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setFont('helvetica', 'bold');
        doc.text('FILESECUFB', margin, yPosition);
        
        // Subtítulo del logo
        doc.setFontSize(10);
        doc.setTextColor(lightColor[0], lightColor[1], lightColor[2]);
        doc.setFont('helvetica', 'normal');
        doc.text('Professional ECU Services', margin, yPosition + 8);
        
        yPosition += 20;
      };

      // Función para agregar header con información de la empresa
      const addCompanyHeader = () => {
        // Línea decorativa superior
        doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setLineWidth(2);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 10;

        // Información de la empresa (lado derecho)
        const companyInfo = [
          'www.filesecufb.com',
          'info@filesecufb.com',
          '+34 630 84 10 47'
        ];
        
        doc.setFontSize(9);
        doc.setTextColor(lightColor[0], lightColor[1], lightColor[2]);
        companyInfo.forEach((info, index) => {
          doc.text(info, pageWidth - margin, yPosition + (index * 5), { align: 'right' });
        });
        
        yPosition += 25;
      };

      // Función para agregar título del documento
      const addDocumentTitle = () => {
        doc.setFontSize(28);
        doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
        doc.setFont('helvetica', 'bold');
        doc.text('DETALLE DEL PEDIDO', pageWidth / 2, yPosition, { align: 'center' });
        
        // Línea decorativa bajo el título
        yPosition += 8;
        doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setLineWidth(1);
        doc.line(pageWidth / 2 - 40, yPosition, pageWidth / 2 + 40, yPosition);
        yPosition += 20;
      };

      // Función para agregar información básica del pedido
      const addOrderBasicInfo = () => {
        // Fondo gris claro para la información básica
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 25, 'F');
        
        doc.setFontSize(12);
        doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
        doc.setFont('helvetica', 'bold');
        
        // Primera fila
        doc.text(`Pedido #${order.id.slice(-8).toUpperCase()}`, margin + 5, yPosition + 5);
        doc.text(`Fecha: ${formatDate(order.created_at)}`, pageWidth / 2, yPosition + 5, { align: 'center' });
        doc.text(`Total: €${parseFloat(order.total_price?.toString() || '0').toFixed(2)}`, pageWidth - margin - 5, yPosition + 5, { align: 'right' });
        
        // Segunda fila
        doc.text(`Servicio: ${order.services?.title || 'N/A'}`, margin + 5, yPosition + 15);
        
        yPosition += 35;
      };

      // Función para agregar sección con título
      const addSection = (title: string, content: () => void) => {
        checkNewPage(30);
        
        // Título de sección
        doc.setFontSize(16);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setFont('helvetica', 'bold');
        doc.text(title, margin, yPosition);
        
        // Línea bajo el título
        yPosition += 3;
        doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setLineWidth(0.5);
        doc.line(margin, yPosition, margin + 60, yPosition);
        yPosition += 12;
        
        content();
        yPosition += 18;
      };

      // Función para agregar información del cliente
      const addClientInfo = () => {
        doc.setFontSize(11);
        doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
        doc.setFont('helvetica', 'normal');
        
        const clientData = [
          { label: 'Nombre Completo:', value: order.profiles?.full_name || 'N/A' },
          { label: 'Email:', value: order.profiles?.email || 'N/A' },
          { label: 'Teléfono:', value: order.profiles?.phone || 'N/A' },
          { label: 'Dirección:', value: order.profiles?.billing_address || 'N/A' },
          { label: 'Ciudad:', value: order.profiles?.billing_city || 'N/A' },
          { label: 'Código Postal:', value: order.profiles?.billing_postal_code || 'N/A' },
          { label: 'País:', value: order.profiles?.billing_country || 'N/A' }
        ];
        
        clientData.forEach((item, index) => {
          if (item.value !== 'N/A') {
            doc.setFont('helvetica', 'bold');
            doc.text(item.label, margin, yPosition);
            doc.setFont('helvetica', 'normal');
            doc.text(item.value, margin + 40, yPosition);
            yPosition += 8;
          }
        });
      };

      // Función para agregar información del vehículo
      const addVehicleInfo = () => {
        doc.setFontSize(11);
        doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
        
        const vehicleData = [
          { label: 'Marca:', value: order.vehicle_make },
          { label: 'Modelo:', value: order.vehicle_model },
          { label: 'Generación:', value: order.vehicle_generation },
          { label: 'Motor:', value: order.vehicle_engine },
          { label: 'Año:', value: order.vehicle_year },
          { label: 'ECU:', value: order.vehicle_ecu },
          { label: 'Transmisión:', value: order.vehicle_gearbox },
          { label: 'Potencia:', value: order.engine_hp ? `${order.engine_hp} HP${order.engine_kw ? ` (${order.engine_kw} kW)` : ''}` : null },
          { label: 'Lectura:', value: order.read_method },
          { label: 'Hardware:', value: order.hardware_number },
          { label: 'Software:', value: order.software_number }
        ];
        
        let col1Y = yPosition;
        let col2Y = yPosition;
        const colWidth = (pageWidth - 2 * margin) / 2;
        
        vehicleData.forEach((item, index) => {
          if (item.value) {
            const isLeftColumn = index % 2 === 0;
            const xPos = isLeftColumn ? margin : margin + colWidth;
            const currentY = isLeftColumn ? col1Y : col2Y;
            
            doc.setFont('helvetica', 'bold');
            doc.text(item.label, xPos, currentY);
            doc.setFont('helvetica', 'normal');
            doc.text(item.value, xPos + 35, currentY);
            
            if (isLeftColumn) {
              col1Y += 8;
            } else {
              col2Y += 8;
            }
          }
        });
        
        yPosition = Math.max(col1Y, col2Y);
      };

      // Función para agregar modificaciones del vehículo
      const addVehicleModifications = () => {
        const modifications = [
          { key: 'aftermarket_exhaust', label: 'Escape Aftermarket', remarks: 'aftermarket_exhaust_remarks' },
          { key: 'aftermarket_intake_manifold', label: 'Colector de Admisión Aftermarket', remarks: 'aftermarket_intake_manifold_remarks' },
          { key: 'cold_air_intake', label: 'Admisión de Aire Frío', remarks: 'cold_air_intake_remarks' },
          { key: 'decat', label: 'Decat', remarks: 'decat_remarks' }
        ];
        
        const hasAnyModification = modifications.some(({ key }) => order[key as keyof OrderData]);
        
        if (!hasAnyModification) {
          doc.setFontSize(11);
          doc.setTextColor(lightColor[0], lightColor[1], lightColor[2]);
          doc.setFont('helvetica', 'italic');
          doc.text('No se han reportado modificaciones en el vehículo.', margin, yPosition);
          yPosition += 8;
          return;
        }
        
        doc.setFontSize(11);
        doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
        
        modifications.forEach(({ key, label, remarks }) => {
          const hasModification = order[key as keyof OrderData] as boolean;
          const remarkText = order[remarks as keyof OrderData] as string;
          
          if (hasModification) {
            doc.setFont('helvetica', 'bold');
            doc.text(`• ${label}`, margin, yPosition);
            doc.setFont('helvetica', 'normal');
            yPosition += 8;
            
            if (remarkText && remarkText.trim()) {
              doc.setTextColor(lightColor[0], lightColor[1], lightColor[2]);
              doc.setFont('helvetica', 'italic');
              const lines = doc.splitTextToSize(`  Observaciones: ${remarkText}`, pageWidth - 2 * margin - 10);
              lines.forEach((line: string) => {
                doc.text(line, margin + 5, yPosition);
                yPosition += 7;
              });
              yPosition += 3;
            }
            
            doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
          }
        });
      };

      // Función para agregar servicios adicionales
      const addAdditionalServices = () => {
        if (!order.additional_services_details || order.additional_services_details.length === 0) return;
        
        doc.setFontSize(11);
        doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
        
        let totalAdditional = 0;
        
        order.additional_services_details.forEach((service: any, index: number) => {
          const price = parseFloat(service.price || 0);
          totalAdditional += price;
          
          doc.setFont('helvetica', 'normal');
          doc.text(`• ${service.title}`, margin, yPosition);
          doc.setFont('helvetica', 'bold');
          doc.text(`€${price.toFixed(2)}`, pageWidth - margin, yPosition, { align: 'right' });
          yPosition += 8;
        });
        
        // Total de servicios adicionales
        if (totalAdditional > 0) {
          yPosition += 5;
          doc.setDrawColor(lightColor[0], lightColor[1], lightColor[2]);
          doc.line(margin, yPosition, pageWidth - margin, yPosition);
          yPosition += 8;
          
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
          doc.text('Total Servicios Adicionales:', margin, yPosition);
          doc.text(`€${totalAdditional.toFixed(2)}`, pageWidth - margin, yPosition, { align: 'right' });
        }
      };

      // Función para agregar archivos del cliente
      const addClientFiles = () => {
        const parseMainFileUrl = (mainFileUrl: string | null): string[] => {
          if (!mainFileUrl) return [];
          if (mainFileUrl.startsWith('[')) {
            try {
              const parsed = JSON.parse(mainFileUrl);
              return Array.isArray(parsed) ? parsed : [mainFileUrl];
            } catch (error) {
              return [mainFileUrl];
            }
          }
          return [mainFileUrl];
        };
        
        const mainFileUrls = parseMainFileUrl(order.main_file_url);
        const additionalFiles = order.optional_attachments_urls || [];
        
        doc.setFontSize(11);
        doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
        
        if (mainFileUrls.length > 0) {
          doc.setFont('helvetica', 'bold');
          doc.text('Archivos Principales:', margin, yPosition);
          yPosition += 8;
          
          doc.setFont('helvetica', 'normal');
          mainFileUrls.forEach((url, index) => {
            if (url && url.trim() !== '') {
              const fileName = extractFileNameFromUrl(url);
              doc.text(`• ${fileName}`, margin + 5, yPosition);
              yPosition += 7;
            }
          });
          yPosition += 8;
        }
        
        if (additionalFiles.length > 0) {
          doc.setFont('helvetica', 'bold');
          doc.text('Archivos Adicionales:', margin, yPosition);
          yPosition += 8;
          
          doc.setFont('helvetica', 'normal');
          additionalFiles.forEach((url, index) => {
            if (url && url.trim() !== '') {
              const fileName = extractFileNameFromUrl(url);
              doc.text(`• ${fileName}`, margin + 5, yPosition);
              yPosition += 7;
            }
          });
        }
      };

      // Función para agregar información adicional
      const addAdditionalInfo = () => {
        if (!order.additional_info) return;
        
        doc.setFontSize(11);
        doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
        doc.setFont('helvetica', 'normal');
        
        const lines = doc.splitTextToSize(order.additional_info, pageWidth - 2 * margin - 10);
        lines.forEach((line: string) => {
          checkNewPage(10);
          doc.text(line, margin, yPosition);
          yPosition += 7;
        });
      };

      // Función para agregar resumen financiero
      const addFinancialSummary = () => {
        checkNewPage(40);
        
        // Fondo para el resumen
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 35, 'F');
        
        doc.setFontSize(14);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setFont('helvetica', 'bold');
        doc.text('RESUMEN FINANCIERO', margin + 5, yPosition + 8);
        
        yPosition += 20;
        
        // Detalles financieros
        const basePrice = parseFloat(order.base_price?.toString() || '0');
        const additionalPrice = order.additional_services_details?.reduce((sum: number, service: any) => 
          sum + parseFloat(service.price || 0), 0) || 0;
        const totalPrice = parseFloat(order.total_price?.toString() || '0');
        
        doc.setFontSize(12);
        doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
        doc.setFont('helvetica', 'normal');
        
        if (basePrice > 0) {
          doc.text('Precio Base:', margin + 5, yPosition);
          doc.text(`€${basePrice.toFixed(2)}`, pageWidth - margin - 5, yPosition, { align: 'right' });
          yPosition += 8;
        }
        
        if (additionalPrice > 0) {
          doc.text('Servicios Adicionales:', margin + 5, yPosition);
          doc.text(`€${additionalPrice.toFixed(2)}`, pageWidth - margin - 5, yPosition, { align: 'right' });
          yPosition += 8;
        }
        
        // Línea separadora
        doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setLineWidth(1);
        doc.line(margin + 5, yPosition, pageWidth - margin - 5, yPosition);
        yPosition += 8;
        
        // Total final
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text('TOTAL:', margin + 5, yPosition);
        doc.text(`€${totalPrice.toFixed(2)}`, pageWidth - margin - 5, yPosition, { align: 'right' });
      };

      // Función para agregar footer
      const addFooter = () => {
        const footerY = pageHeight - 20;
        
        doc.setFontSize(8);
        doc.setTextColor(lightColor[0], lightColor[1], lightColor[2]);
        doc.setFont('helvetica', 'normal');
        
        // Línea separadora
        doc.setDrawColor(lightColor[0], lightColor[1], lightColor[2]);
        doc.setLineWidth(0.5);
        doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
        
        // Texto del footer
        doc.text('Este documento ha sido generado automáticamente por FilesECUFB', pageWidth / 2, footerY, { align: 'center' });
        doc.text(`Generado el: ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}`, pageWidth / 2, footerY + 5, { align: 'center' });
      };

      // Construir el PDF
      addLogo();
      addCompanyHeader();
      addDocumentTitle();
      addOrderBasicInfo();
      
      addSection('INFORMACIÓN DEL CLIENTE', addClientInfo);
      addSection('INFORMACIÓN DEL VEHÍCULO', addVehicleInfo);
      addSection('MODIFICACIONES DEL VEHÍCULO', addVehicleModifications);
      addSection('SERVICIOS ADICIONALES', addAdditionalServices);
      addSection('ARCHIVOS DEL CLIENTE', addClientFiles);
      addSection('INFORMACIÓN ADICIONAL', addAdditionalInfo);
      addFinancialSummary();
      addFooter();

      // Guardar el PDF
      doc.save(`pedido-${order.id.slice(-8)}-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF generado correctamente');
    } catch (error) {
      console.error('Error al generar PDF:', error);
      toast.error('Error al generar el PDF');
    }
  };

  // Función para verificar si hay archivos del cliente
  const hasClientFiles = (): boolean => {
    if (!order) return false;
    
    // Función para parsear main_file_url que puede ser string simple o JSON array
    const parseMainFileUrl = (mainFileUrl: string | null): string[] => {
      if (!mainFileUrl) return [];
      
      // Si es un string que empieza con '[', es un JSON array
      if (mainFileUrl.startsWith('[')) {
        try {
          const parsed = JSON.parse(mainFileUrl);
          return Array.isArray(parsed) ? parsed : [mainFileUrl];
        } catch (error) {
          console.error('Error parsing main_file_url JSON:', error);
          return [mainFileUrl];
        }
      }
      
      // Si no, es un string simple
      return [mainFileUrl];
    };
    
    // Verificar archivos principales
    const mainFileUrls = parseMainFileUrl(order.main_file_url);
    const hasMainFiles = mainFileUrls.length > 0;
    
    // Verificar archivos adicionales
    const hasAdditionalFiles = order.optional_attachments_urls && order.optional_attachments_urls.length > 0;
    
    return hasMainFiles || hasAdditionalFiles;
  };

  // Función para descargar todos los archivos del cliente
  const downloadAllClientFiles = async () => {
    if (!order || downloadingAllFiles) return;
    
    setDownloadingAllFiles(true);
    
    try {
      const downloadPromises: Promise<void>[] = [];
      let downloadCount = 0;
      
      // Función para parsear main_file_url que puede ser string simple o JSON array
      const parseMainFileUrl = (mainFileUrl: string | null): string[] => {
        if (!mainFileUrl) return [];
        
        // Si es un string que empieza con '[', es un JSON array
        if (mainFileUrl.startsWith('[')) {
          try {
            const parsed = JSON.parse(mainFileUrl);
            return Array.isArray(parsed) ? parsed : [mainFileUrl];
          } catch (error) {
            console.error('Error parsing main_file_url JSON:', error);
            return [mainFileUrl];
          }
        }
        
        // Si no, es un string simple
        return [mainFileUrl];
      };
      
      // Descargar archivos principales
      const mainFileUrls = parseMainFileUrl(order.main_file_url);
      if (mainFileUrls.length > 0) {
        mainFileUrls.forEach((url, index) => {
          if (url && url.trim() !== '') {
            downloadPromises.push(
              downloadFile(url, extractFileNameFromUrl(url))
            );
            downloadCount++;
          }
        });
      }
      
      // Descargar archivos adicionales
      if (order.optional_attachments_urls && order.optional_attachments_urls.length > 0) {
        order.optional_attachments_urls.forEach((url, index) => {
          if (url && url.trim() !== '') {
            downloadPromises.push(
              downloadFile(url, extractFileNameFromUrl(url))
            );
            downloadCount++;
          }
        });
      }
      
      // Generar y descargar PDF del pedido
      downloadPromises.push(
        new Promise<void>((resolve) => {
          try {
            generatePDF();
            resolve();
          } catch (error) {
            console.error('Error generando PDF:', error);
            resolve(); // No fallar toda la descarga por el PDF
          }
        })
      );
      downloadCount++;
      
      // Ejecutar todas las descargas
      await Promise.allSettled(downloadPromises);
      
      toast.success(`Se han descargado ${downloadCount} archivos del cliente`);
      
    } catch (error) {
      console.error('Error descargando archivos:', error);
      toast.error('Error al descargar algunos archivos');
    } finally {
      setDownloadingAllFiles(false);
    }
  };

  // Mostrar loading mientras se verifica la autenticación
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-white mb-2">Verificando acceso...</h2>
          <p className="text-gray-400">Comprobando permisos de administrador</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-white mb-2">Cargando pedido...</h2>
          <p className="text-gray-400">Obteniendo los detalles del pedido</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-4">
            {error || 'Pedido no encontrado'}
          </h1>
          <p className="text-gray-400 mb-6">No se pudieron cargar los detalles del pedido</p>
          <button
            onClick={() => navigate('/admin?section=orders')}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors"
          >
            Volver a Pedidos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="container mx-auto px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-6 sm:mb-8">
          {/* Botón de volver y título */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <button
              onClick={() => navigate('/admin?section=orders')}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-gray-800/50 backdrop-blur-sm border border-gray-700 text-white rounded-xl hover:bg-gray-800/70 hover:border-primary/50 transition-all min-h-[48px] text-sm sm:text-base font-medium active:scale-95 w-full sm:w-auto"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="sm:hidden">{t('orderDetails.backToOrders')}</span>
              <span className="hidden sm:inline">{t('orderDetails.backToOrders')}</span>
            </button>
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white break-words leading-tight">{t('orderDetails.title', { id: order.id.slice(-8).toUpperCase() })}</h1>
              <p className="text-gray-400 mt-1 text-sm sm:text-base">{formatDate(order.created_at)}</p>
            </div>
          </div>
          
          {/* Estado del pedido */}
          <div className="flex justify-center sm:justify-end">
            <div className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-xl min-h-[48px] font-medium ${getStatusColor(order.status)}`}>
              {getStatusIcon(order.status)}
              <span className="font-semibold text-sm sm:text-base">{getStatusDisplay(order.status)}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col xl:grid xl:grid-cols-3 gap-4 sm:gap-6 xl:gap-8">
          {/* Información Principal - Aparece primero en móviles */}
          <div className="order-1 xl:order-1 xl:col-span-2 space-y-4 sm:space-y-6">
            {/* Cliente */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-4 sm:p-6">
              <div className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
                <User className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                <h2 className="text-lg sm:text-xl font-bold text-white">{t('orderDetails.customerInfo.title')}</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="text-gray-400 text-xs sm:text-sm font-medium">{t('orderDetails.customerInfo.fullName')}</label>
                    <p className="text-white text-base sm:text-lg font-medium break-words">{order.profiles?.full_name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs sm:text-sm font-medium">{t('orderDetails.customerInfo.email')}</label>
                    <p className="text-white font-medium text-sm sm:text-base break-all">{order.profiles?.email || 'N/A'}</p>
                  </div>
                </div>
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="text-gray-400 text-xs sm:text-sm font-medium">{t('orderDetails.customerInfo.phone')}</label>
                    <p className="text-white font-medium text-sm sm:text-base">{order.profiles?.phone || t('orderDetails.customerInfo.noPhone')}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs sm:text-sm font-medium">{t('orderDetails.customerInfo.clientId')}</label>
                    <p className="text-gray-300 text-xs sm:text-sm font-mono">{order.client_id.slice(-8)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Servicio */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-4 sm:p-6">
              <div className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
                <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                <h2 className="text-lg sm:text-xl font-bold text-white">{t('orderDetails.serviceInfo.title')}</h2>
              </div>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
                  <div className="flex-1">
                    <h3 className="text-white text-base sm:text-lg font-semibold break-words">{order.services?.title || 'N/A'}</h3>
                    <p className="text-gray-400 text-sm sm:text-base">{order.services?.category || ''}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-2xl sm:text-3xl font-bold text-primary">€{parseFloat(order.total_price?.toString() || '0').toFixed(2)}</p>
                    <p className="text-gray-400 text-xs sm:text-sm">{t('orderDetails.serviceInfo.totalPrice')}</p>
                  </div>
                </div>
                {order.additional_services_details && order.additional_services_details.length > 0 && (
                  <div className="border-t border-gray-700 pt-4">
                    <h4 className="text-white font-medium mb-3">{t('orderDetails.serviceInfo.additionalServices')}</h4>
                    <div className="space-y-2">
                      {order.additional_services_details.map((service: any, index: number) => (
                        <div key={service.id || index} className="flex justify-between items-center py-2">
                          <span className="text-gray-300">{service.title}</span>
                          <span className="text-primary font-medium">€{parseFloat(service.price || 0).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Vehículo */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-4 sm:p-6">
              <div className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
                <Car className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                <h2 className="text-lg sm:text-xl font-bold text-white">{t('orderDetails.vehicleInfo.title')}</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="text-gray-400 text-xs sm:text-sm font-medium">{t('orderDetails.vehicleInfo.brandModel')}</label>
                    <p className="text-white font-semibold text-sm sm:text-base break-words">
                      {order.vehicle_make} {order.vehicle_model}
                    </p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs sm:text-sm font-medium">{t('orderDetails.vehicleInfo.generation')}</label>
                    <p className="text-white font-medium text-sm sm:text-base">{order.vehicle_generation || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs sm:text-sm font-medium">{t('orderDetails.vehicleInfo.year')}</label>
                    <p className="text-white font-medium text-sm sm:text-base">{order.vehicle_year || 'N/A'}</p>
                  </div>
                </div>
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="text-gray-400 text-xs sm:text-sm font-medium">{t('orderDetails.vehicleInfo.engine')}</label>
                    <p className="text-white font-medium text-sm sm:text-base break-words">{order.vehicle_engine || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs sm:text-sm font-medium">{t('orderDetails.vehicleInfo.ecu')}</label>
                    <p className="text-white font-medium text-sm sm:text-base break-words">{order.vehicle_ecu || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs sm:text-sm font-medium">{t('orderDetails.vehicleInfo.transmission')}</label>
                    <p className="text-white font-medium text-sm sm:text-base">{order.vehicle_gearbox || 'N/A'}</p>
                  </div>
                </div>
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="text-gray-400 text-xs sm:text-sm font-medium">{t('orderDetails.vehicleInfo.power')}</label>
                    <p className="text-white font-medium text-sm sm:text-base">
                      {order.engine_hp ? `${order.engine_hp} HP` : 'N/A'}
                      {order.engine_kw && ` (${order.engine_kw} kW)`}
                    </p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs sm:text-sm font-medium">{t('orderDetails.vehicleInfo.readingMethod')}</label>
                    <p className="text-white font-medium text-sm sm:text-base break-words">{order.read_method || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs sm:text-sm font-medium">{t('orderDetails.vehicleInfo.hardwareNumber')}</label>
                    <p className="text-white font-medium text-xs sm:text-sm font-mono break-all">{order.hardware_number || 'N/A'}</p>
                  </div>
                </div>
                {(order.vin || order.software_number) && (
                  <div className="sm:col-span-2 lg:col-span-3 space-y-3 sm:space-y-4">
                    {order.vin && (
                      <div>
                        <label className="text-gray-400 text-xs sm:text-sm font-medium">{t('orderDetails.vehicleInfo.vin')}</label>
                        <p className="text-white font-mono text-xs sm:text-sm break-all">{order.vin}</p>
                      </div>
                    )}
                    {order.software_number && (
                      <div>
                        <label className="text-gray-400 text-xs sm:text-sm font-medium">{t('orderDetails.vehicleInfo.softwareNumber')}</label>
                        <p className="text-white font-mono text-xs sm:text-sm break-all">{order.software_number}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Modificaciones */}
            {order.has_modified_parts && (
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-4 sm:p-6">
                <div className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
                  <Wrench className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  <h2 className="text-lg sm:text-xl font-bold text-white">{t('orderDetails.modifications.title')}</h2>
                </div>
                <div className="space-y-3 sm:space-y-4">
                  {[
                    { key: 'aftermarket_exhaust', label: t('orderDetails.modifications.aftermarketExhaust'), remarks: 'aftermarket_exhaust_remarks' },
                    { key: 'aftermarket_intake_manifold', label: t('orderDetails.modifications.aftermarketIntake'), remarks: 'aftermarket_intake_manifold_remarks' },
                    { key: 'cold_air_intake', label: t('orderDetails.modifications.coldAirIntake'), remarks: 'cold_air_intake_remarks' },
                    { key: 'decat', label: t('orderDetails.modifications.decat'), remarks: 'decat_remarks' }
                  ].map(({ key, label, remarks }) => {
                    const hasModification = order[key as keyof OrderData] as boolean;
                    const remarkText = order[remarks as keyof OrderData] as string;
                    
                    return (
                      <div key={key} className="border border-gray-600/50 rounded-lg p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-2">
                          <h3 className="text-white font-medium text-sm sm:text-base break-words">{label}</h3>
                          <span className={`px-2 sm:px-3 py-1 text-xs font-semibold rounded-full self-start sm:self-auto ${
                            hasModification ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                          }`}>
                            {hasModification ? t('orderDetails.common.yes') : t('orderDetails.common.no')}
                          </span>
                        </div>
                        {hasModification && remarkText && (
                          <p className="text-gray-300 text-xs sm:text-sm mt-2 break-words">{remarkText}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Información Adicional */}
            {order.additional_info && (
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">{t('orderDetails.additionalInfo.title')}</h2>
                <div className="bg-gray-900/50 rounded-lg p-3 sm:p-4">
                  <p className="text-gray-300 leading-relaxed text-sm sm:text-base break-words">{order.additional_info}</p>
                </div>
              </div>
            )}
          </div>

          {/* Panel Lateral - Aparece segundo en móviles, después del contenido principal */}
          <div className="order-2 xl:order-2 space-y-4 sm:space-y-6">
            {/* Acciones Rápidas */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">{t('orderDetails.actions.title')}</h2>
              <div className="space-y-3 sm:space-y-4">
                <button
                  onClick={generatePDF}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-600/20 text-green-400 border border-green-600/30 rounded-xl hover:bg-green-600/30 transition-colors min-h-[44px] text-sm sm:text-base"
                >
                  <FileDown className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="font-medium">{t('orderDetails.actions.downloadInfo')}</span>
                </button>

                <button
                  onClick={downloadAllClientFiles}
                  disabled={!hasClientFiles()}
                  className={`w-full flex items-center justify-center space-x-2 px-4 py-3 border rounded-xl transition-colors font-medium min-h-[44px] text-sm sm:text-base ${
                    hasClientFiles()
                      ? 'bg-primary/20 text-primary border-primary/30 hover:bg-primary/30' 
                      : 'bg-gray-600/20 text-gray-500 border-gray-600/30 cursor-not-allowed'
                  }`}
                >
                  {downloadingAllFiles ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-primary"></div>
                      <span>{t('orderDetails.actions.downloading')}</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>{t('orderDetails.actions.downloadAll')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Archivos */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-4 sm:p-6">
              <div className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                <h2 className="text-lg sm:text-xl font-bold text-white">{t('orderDetails.files.title')}</h2>
              </div>
              
              {/* Archivo principal */}
              <div className="mb-4 sm:mb-6">
                <h3 className="text-white font-medium mb-2 sm:mb-3 text-sm sm:text-base">{t('orderDetails.files.mainFile.title')}</h3>
                {(() => {
                  // Función para parsear main_file_url que puede ser string simple o JSON array
                  const parseMainFileUrl = (mainFileUrl: string | null): string[] => {
                    if (!mainFileUrl) return [];
                    
                    // Si es un string que empieza con '[', es un JSON array
                    if (mainFileUrl.startsWith('[')) {
                      try {
                        const parsed = JSON.parse(mainFileUrl);
                        return Array.isArray(parsed) ? parsed : [mainFileUrl];
                      } catch (error) {
                        console.error('Error parsing main_file_url JSON:', error);
                        return [mainFileUrl];
                      }
                    }
                    
                    // Si no, es un string simple
                    return [mainFileUrl];
                  };
                  
                  // Manejar tanto main_file_url (string/JSON) como main_file_urls (array) para compatibilidad
                  const mainFileUrls = parseMainFileUrl(order.main_file_url);
                  
                  return mainFileUrls.length > 0 ? (
                    <div className="space-y-3">
                      {mainFileUrls.map((url, index) => (
                        <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 p-3 bg-gray-700/50 rounded-lg border border-gray-600/50">
                          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-white font-medium text-sm sm:text-base truncate">{extractFileNameFromUrl(url)}</p>
                              <p className="text-gray-400 text-xs sm:text-sm">{t('orderDetails.files.mainFile.ecuFile')}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => downloadFile(url, extractFileNameFromUrl(url))}
                            className="flex items-center justify-center space-x-2 px-3 py-2 bg-primary/20 text-primary border border-primary/30 rounded-lg hover:bg-primary/30 transition-colors min-h-[44px] text-sm font-medium self-start sm:self-auto"
                          >
                            <Download className="w-4 h-4" />
                            <span>{t('orderDetails.common.download')}</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center p-4 sm:p-6 bg-gray-700/30 rounded-lg border border-gray-600/30 border-dashed">
                      <div className="text-center">
                        <FileText className="w-8 h-8 sm:w-12 sm:h-12 text-gray-500 mx-auto mb-2" />
                        <p className="text-gray-400 font-medium text-sm sm:text-base">{t('orderDetails.files.mainFile.noFiles')}</p>
                        <p className="text-gray-500 text-xs sm:text-sm">{t('orderDetails.files.mainFile.noFilesDescription')}</p>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Archivos adicionales del cliente */}
              <div className="mb-4 sm:mb-6">
                <h3 className="text-white font-medium mb-2 sm:mb-3 text-sm sm:text-base">{t('orderDetails.files.additionalFiles.title')}</h3>
                {order.optional_attachments_urls && order.optional_attachments_urls.length > 0 ? (
                  <div className="space-y-3">
                    {order.optional_attachments_urls.map((url, index) => (
                      <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 p-3 bg-gray-700/50 rounded-lg border border-gray-600/50">
                        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                          <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-white font-medium text-sm sm:text-base truncate">{extractFileNameFromUrl(url)}</p>
                            <p className="text-gray-400 text-xs sm:text-sm">Documento adjunto</p>
                          </div>
                        </div>
                        <button
                          onClick={() => downloadFile(url, extractFileNameFromUrl(url))}
                          className="flex items-center justify-center space-x-2 px-3 py-2 bg-primary/20 text-primary border border-primary/30 rounded-lg hover:bg-primary/30 transition-colors min-h-[44px] text-sm font-medium self-start sm:self-auto"
                        >
                          <Download className="w-4 h-4" />
                          <span>{t('orderDetails.common.download')}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center p-4 sm:p-6 bg-gray-700/30 rounded-lg border border-gray-600/30 border-dashed">
                    <div className="text-center">
                      <FileText className="w-8 h-8 sm:w-12 sm:h-12 text-gray-500 mx-auto mb-2" />
                      <p className="text-gray-400 font-medium text-sm sm:text-base">{t('orderDetails.files.additionalFiles.noFiles')}</p>
                      <p className="text-gray-500 text-xs sm:text-sm">{t('orderDetails.files.additionalFiles.noFilesDescription')}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Mapas tuneados subidos por admin */}
              <div className="mb-4 sm:mb-6">
                <h3 className="text-white font-medium mb-2 sm:mb-3 text-sm sm:text-base">{t('orderDetails.files.tunedMaps.title')}</h3>
                {order.order_files && order.order_files.filter(f => f.file_category === 'map').length > 0 ? (
                  <div className="space-y-3">
                    {order.order_files.filter(f => f.file_category === 'map').map((file) => (
                      <div key={file.id} className="p-3 bg-green-900/20 rounded-lg border border-green-600/30">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-2">
                          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                            <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-white font-medium text-sm sm:text-base truncate">{file.file_name}</p>
                              <p className="text-gray-400 text-xs sm:text-sm">
                                {t('orderDetails.files.tunedMaps.uploaded')}: {new Date(file.created_at).toLocaleDateString('es-ES')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 self-start sm:self-auto">
                            <button
                              onClick={() => window.open(file.file_url, '_blank')}
                              className="flex items-center justify-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 bg-green-600/20 text-green-400 border border-green-600/30 rounded-lg hover:bg-green-600/30 transition-colors min-h-[44px] text-xs sm:text-sm font-medium"
                            >
                              <Download className="w-4 h-4" />
                              <span className="hidden sm:inline">{t('orderDetails.common.download')}</span>
                            </button>
                            <button
                              onClick={() => confirmDelete(file.id)}
                              disabled={deletingFile[file.id]}
                              className="flex items-center justify-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 bg-red-600/20 text-red-400 border border-red-600/30 rounded-lg hover:bg-red-600/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] text-xs sm:text-sm font-medium"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span className="hidden sm:inline">
                                {deletingFile[file.id] ? t('orderDetails.files.tunedMaps.deleting') : 'Eliminar'}
                              </span>
                            </button>
                          </div>
                        </div>
                        
                        {/* Comentarios editables */}
                        <div className="mt-3">
                          <label className="text-gray-400 text-xs sm:text-sm font-medium">{t('orderDetails.files.tunedMaps.adminComments')}:</label>
                          {editingComments[file.id] ? (
                            <div className="mt-2 space-y-2">
                              <textarea
                                value={tempComments[file.id] || ''}
                                onChange={(e) => setTempComments(prev => ({ ...prev, [file.id]: e.target.value }))}
                                className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none text-sm"
                                rows={3}
                                placeholder={t('orderDetails.files.tunedMaps.addComments')}
                              />
                              <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2 sm:gap-0">
                                <button
                                  onClick={() => saveComment(file.id, 'order_files')}
                                  className="px-3 py-2 bg-green-600/20 text-green-400 border border-green-600/30 rounded-lg hover:bg-green-600/30 transition-colors text-sm min-h-[44px]"
                                >
                                  {t('orderDetails.files.tunedMaps.save')}
                                </button>
                                <button
                                  onClick={() => cancelEditingComment(file.id)}
                                  className="px-3 py-2 bg-gray-600/20 text-gray-400 border border-gray-600/30 rounded-lg hover:bg-gray-600/30 transition-colors text-sm min-h-[44px]"
                                >
                                  {t('orderDetails.files.tunedMaps.cancel')}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-2">
                              <div className="flex items-center justify-between">
                                <p className="text-gray-300 text-xs sm:text-sm">
                                  {file.admin_comments || 'Sin comentarios'}
                                </p>
                                <button
                                  onClick={() => startEditingComment(file.id, file.admin_comments || '')}
                                  className="text-primary hover:text-primary/80 text-xs sm:text-sm font-medium min-h-[44px] flex items-center"
                                >
                                  Editar
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Diálogo de confirmación de eliminación */}
                        {showDeleteConfirm[file.id] && (
                          <div className="mt-3 p-3 bg-red-900/30 border border-red-600/50 rounded-lg">
                            <div className="flex items-start space-x-3">
                              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-red-400 font-medium text-sm">{t('orderDetails.files.tunedMaps.deleteConfirm')}</p>
                                <p className="text-gray-300 text-xs mt-1">
                                  {t('orderDetails.files.tunedMaps.deleteDescription')}
                                </p>
                                <div className="flex space-x-2 mt-3">
                                  <button
                                    onClick={() => deleteFile(file.id, 'order_files')}
                                    disabled={deletingFile[file.id]}
                                    className="px-3 py-1 bg-red-600/20 text-red-400 border border-red-600/30 rounded-lg hover:bg-red-600/30 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {deletingFile[file.id] ? t('orderDetails.files.tunedMaps.deleting') : t('orderDetails.files.tunedMaps.confirm')}
                                  </button>
                                  <button
                                    onClick={() => cancelDelete(file.id)}
                                    className="px-3 py-1 bg-gray-600/20 text-gray-400 border border-gray-600/30 rounded-lg hover:bg-gray-600/30 transition-colors text-sm font-medium"
                                  >
                                    {t('orderDetails.files.tunedMaps.cancel')}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center p-4 sm:p-6 bg-gray-700/30 rounded-lg border border-gray-600/30 border-dashed">
                    <div className="text-center">
                      <MapPin className="w-8 h-8 sm:w-12 sm:h-12 text-gray-500 mx-auto mb-2" />
                      <p className="text-gray-400 font-medium text-sm sm:text-base">{t('orderDetails.files.tunedMaps.noMaps')}</p>
                      <p className="text-gray-500 text-xs sm:text-sm">{t('orderDetails.files.tunedMaps.noMapsDescription')}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Facturas subidas por admin */}
              <div className="mb-4 sm:mb-6">
                <h3 className="text-white font-medium mb-2 sm:mb-3 text-sm sm:text-base">{t('orderDetails.files.invoices.title')}</h3>
                {order.invoices && order.invoices.length > 0 ? (
                  <div className="space-y-3">
                    {order.invoices.map((invoice) => (
                      <div key={invoice.id} className="p-3 bg-blue-900/20 rounded-lg border border-blue-600/30">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-2">
                          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                            <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-white font-medium text-sm sm:text-base truncate">{invoice.file_name}</p>
                              <p className="text-gray-400 text-xs sm:text-sm">
                                {t('orderDetails.files.tunedMaps.uploaded')}: {new Date(invoice.created_at).toLocaleDateString('es-ES')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 self-start sm:self-auto">
                            <button
                              onClick={() => window.open(invoice.file_url, '_blank')}
                              className="flex items-center justify-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 bg-blue-600/20 text-blue-400 border border-blue-600/30 rounded-lg hover:bg-blue-600/30 transition-colors min-h-[44px] text-xs sm:text-sm font-medium"
                            >
                              <Download className="w-4 h-4" />
                              <span className="hidden sm:inline">{t('orderDetails.common.download')}</span>
                            </button>
                            <button
                              onClick={() => confirmDelete(invoice.id)}
                              disabled={deletingFile[invoice.id]}
                              className="flex items-center justify-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 bg-red-600/20 text-red-400 border border-red-600/30 rounded-lg hover:bg-red-600/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] text-xs sm:text-sm font-medium"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span className="hidden sm:inline">
                                {deletingFile[invoice.id] ? 'Eliminando...' : 'Eliminar'}
                              </span>
                            </button>
                          </div>
                        </div>
                        
                        {/* Comentarios editables */}
                        <div className="mt-3">
                          <label className="text-gray-400 text-xs sm:text-sm font-medium">Comentarios del Admin:</label>
                          {editingComments[invoice.id] ? (
                            <div className="mt-2 space-y-2">
                              <textarea
                                value={tempComments[invoice.id] || ''}
                                onChange={(e) => setTempComments(prev => ({ ...prev, [invoice.id]: e.target.value }))}
                                className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none text-sm"
                                rows={3}
                                placeholder={t('orderDetails.files.invoices.addComments')}
                              />
                              <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2 sm:gap-0">
                                <button
                                  onClick={() => saveComment(invoice.id, 'invoices')}
                                  className="px-3 py-2 bg-blue-600/20 text-blue-400 border border-blue-600/30 rounded-lg hover:bg-blue-600/30 transition-colors text-sm min-h-[44px]"
                                >
                                  Guardar
                                </button>
                                <button
                                  onClick={() => cancelEditingComment(invoice.id)}
                                  className="px-3 py-2 bg-gray-600/20 text-gray-400 border border-gray-600/30 rounded-lg hover:bg-gray-600/30 transition-colors text-sm min-h-[44px]"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-2">
                              <div className="flex items-center justify-between">
                                <p className="text-gray-300 text-xs sm:text-sm">
                                  {invoice.admin_comments || t('orderDetails.files.invoices.noComments')}
                                </p>
                                <button
                                  onClick={() => startEditingComment(invoice.id, invoice.admin_comments || '')}
                                  className="text-primary hover:text-primary/80 text-xs sm:text-sm font-medium min-h-[44px] flex items-center"
                                >
                                  {t('orderDetails.files.invoices.edit')}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Diálogo de confirmación de eliminación */}
                        {showDeleteConfirm[invoice.id] && (
                          <div className="mt-3 p-3 bg-red-900/30 border border-red-600/50 rounded-lg">
                            <div className="flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-3">
                              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 sm:mt-0.5" />
                              <div className="flex-1">
                                <p className="text-red-400 font-medium text-sm">{t('orderDetails.files.invoices.deleteConfirm')}</p>
                                <p className="text-gray-300 text-xs mt-1">
                                  {t('orderDetails.files.invoices.deleteDescription')}
                                </p>
                                <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2 sm:gap-0 mt-3">
                                  <button
                                    onClick={() => deleteFile(invoice.id, 'invoices')}
                                    disabled={deletingFile[invoice.id]}
                                    className="px-3 py-2 bg-red-600/20 text-red-400 border border-red-600/30 rounded-lg hover:bg-red-600/30 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                                  >
                                    {deletingFile[invoice.id] ? 'Eliminando...' : 'Confirmar'}
                                  </button>
                                  <button
                                    onClick={() => cancelDelete(invoice.id)}
                                    className="px-3 py-2 bg-gray-600/20 text-gray-400 border border-gray-600/30 rounded-lg hover:bg-gray-600/30 transition-colors text-sm font-medium min-h-[44px]"
                                  >
                                    {t('orderDetails.files.invoices.cancel')}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center p-4 sm:p-6 bg-gray-700/30 rounded-lg border border-gray-600/30 border-dashed">
                    <div className="text-center">
                      <CreditCard className="w-8 h-8 sm:w-12 sm:h-12 text-gray-500 mx-auto mb-2" />
                      <p className="text-gray-400 font-medium text-sm sm:text-base">{t('orderDetails.files.invoices.noInvoices')}</p>
                      <p className="text-gray-500 text-xs sm:text-sm">{t('orderDetails.files.invoices.noInvoicesDescription')}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Subir mapa tuneado */}
              <div className="mb-4 sm:mb-6">
                <h3 className="text-white font-medium mb-2 sm:mb-3 text-sm sm:text-base">{t('orderDetails.upload.tunedMap.title')}</h3>
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 sm:p-6">
                  <div className="space-y-3 sm:space-y-4">
                    <textarea
                      value={mapComment}
                      onChange={(e) => setMapComment(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none text-sm"
                      rows={3}
                      placeholder={t('orderDetails.upload.tunedMap.comments')}
                    />
                    
                    <div className="text-center">
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="map-upload"
                      />
                      <label
                        htmlFor="map-upload"
                        className="cursor-pointer flex flex-col items-center space-y-2 sm:space-y-3 min-h-[44px] justify-center py-3"
                      >
                        <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                        <div>
                          <p className="text-white font-medium text-sm sm:text-base">{t('orderDetails.upload.tunedMap.uploadText')}</p>
                          <p className="text-gray-400 text-xs sm:text-sm">{t('orderDetails.upload.tunedMap.formatText')}</p>
                        </div>
                      </label>
                    </div>
                    
                    {uploading && (
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-primary mx-auto"></div>
                        <p className="text-gray-400 text-xs sm:text-sm mt-2">{t('orderDetails.upload.tunedMap.uploading')}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Subir factura */}
              <div>
                <h3 className="text-white font-medium mb-2 sm:mb-3 text-sm sm:text-base">{t('orderDetails.upload.invoice.title')}</h3>
                <div className="border-2 border-dashed border-blue-600/30 rounded-lg p-4 sm:p-6">
                  <div className="space-y-3 sm:space-y-4">
                    <textarea
                      value={invoiceComment}
                      onChange={(e) => setInvoiceComment(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none text-sm"
                      rows={3}
                      placeholder={t('orderDetails.upload.invoice.comments')}
                    />
                    
                    <div className="text-center">
                      <input
                        type="file"
                        onChange={handleInvoiceUpload}
                        className="hidden"
                        id="invoice-upload"
                        accept=".pdf,.jpg,.png,.doc,.docx"
                      />
                      <label
                        htmlFor="invoice-upload"
                        className="cursor-pointer flex flex-col items-center space-y-2 sm:space-y-3 min-h-[44px] justify-center py-3"
                      >
                        <CreditCard className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
                        <div>
                          <p className="text-white font-medium text-sm sm:text-base">{t('orderDetails.upload.invoice.uploadText')}</p>
                          <p className="text-gray-400 text-xs sm:text-sm">{t('orderDetails.upload.invoice.formatText')}</p>
                        </div>
                      </label>
                    </div>
                    
                    {uploadingInvoice && (
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-blue-500 mx-auto"></div>
                        <p className="text-gray-400 text-xs sm:text-sm mt-2">{t('orderDetails.upload.invoice.uploading')}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Estado del Pedido */}
            <div className="relative bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-4 sm:p-6 z-10">
              <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">{t('orderDetails.orderStatus.title')}</h2>
              <div className="relative">
                <button
                  onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                  className={`w-full flex items-center justify-between px-3 sm:px-4 py-3 rounded-xl border transition-colors min-h-[44px] ${
                    isStatusDropdownOpen 
                      ? 'bg-gray-700 border-primary/50' 
                      : 'bg-gray-700/50 border-gray-600 hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(order.status)}
                    <span className={`font-semibold text-sm sm:text-base ${
                      order.status === 'pending' ? 'text-yellow-400' :
                      order.status === 'in_progress' ? 'text-blue-400' :
                      order.status === 'completed' ? 'text-green-400' :
                      'text-red-400'
                    }`}>
                      {getStatusDisplay(order.status)}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${
                    isStatusDropdownOpen ? 'rotate-180' : ''
                  }`} />
                </button>
                
                {isStatusDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-600 rounded-xl shadow-lg z-50">
                    {(['pending', 'in_progress', 'completed', 'cancelled'] as const).map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(status)}
                        className={`w-full flex items-center space-x-2 px-3 sm:px-4 py-3 text-left hover:bg-gray-700 transition-colors first:rounded-t-xl last:rounded-b-xl min-h-[44px] ${
                          order.status === status ? 'bg-gray-700' : ''
                        }`}
                      >
                        {getStatusIcon(status)}
                        <span className={`font-medium text-sm sm:text-base ${
                          status === 'pending' ? 'text-yellow-400' :
                          status === 'in_progress' ? 'text-blue-400' :
                          status === 'completed' ? 'text-green-400' :
                          'text-red-400'
                        }`}>
                          {getStatusDisplay(status)}
                        </span>
                        {order.status === status && (
                          <CheckCircle className="w-4 h-4 text-primary ml-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Resumen */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">{t('orderDetails.summary.title')}</h2>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                  <span className="text-gray-400 text-sm sm:text-base">{t('orderDetails.summary.orderDate')}:</span>
                  <span className="text-white font-medium text-sm sm:text-base">{formatDate(order.created_at)}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                  <span className="text-gray-400 text-sm sm:text-base">{t('orderDetails.summary.lastUpdate')}:</span>
                  <span className="text-white font-medium text-sm sm:text-base">{formatDate(order.updated_at)}</span>
                </div>
                <div className="border-t border-gray-600 pt-3 sm:pt-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                    <span className="text-white font-bold text-base sm:text-lg">{t('orderDetails.summary.total')}:</span>
                    <span className="text-primary font-bold text-xl sm:text-2xl">€{parseFloat(order.total_price?.toString() || '0').toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;