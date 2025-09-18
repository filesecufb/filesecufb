import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, User, Car, FileText, Settings, CheckCircle, Clock, AlertCircle, ChevronDown, FileDown, Upload, MapPin, Wrench, CreditCard, Trash2 } from 'lucide-react';
import JSZip from 'jszip';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { getServiceTitle, getServiceSubtitle, getServiceDescription } from '../hooks/useServices';
import toast from 'react-hot-toast';
import { generatePDF, generatePDFBlob } from '../lib/pdfGenerator';
import { handleStatusChange as sendStatusChangeEmail, OrderData as EmailOrderData } from '../services/emailService';
import { translateText } from '../lib/geminiTranslation';

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
  bucket_name?: string;
  admin_comments?: string;
  admin_comments_en?: string;
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
  const { user, profile, isAdmin, loading: authLoading } = useAuth();
  const { t, i18n } = useTranslation();
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
  const [adminFiles, setAdminFiles] = useState<AdminFile[]>([]);
  const [adminInvoices, setAdminInvoices] = useState<AdminFile[]>([]);
  const [adminFilesLoading, setAdminFilesLoading] = useState(false);
  
  // Estados para traducción automática
  const [mapCommentEn, setMapCommentEn] = useState('');
  const [invoiceCommentEn, setInvoiceCommentEn] = useState('');
  const [isTranslatingMap, setIsTranslatingMap] = useState(false);
  const [isTranslatingInvoice, setIsTranslatingInvoice] = useState(false);
  const [showMapTranslation, setShowMapTranslation] = useState(false);
  const [showInvoiceTranslation, setShowInvoiceTranslation] = useState(false);
  const [translationError, setTranslationError] = useState<{map?: string, invoice?: string}>({});


  // Protección de rutas: Solo admins pueden acceder
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        toast.error('Debes iniciar sesión para acceder a esta página.');
        navigate('/login', { replace: true });
        return;
      }
      
      // Solo verificar el rol si el perfil está cargado
      if (profile && profile.role !== 'admin') {
        toast.error('Acceso denegado. Esta página es solo para administradores.');
        navigate('/', { replace: true });
        return;
      }
    }
  }, [authLoading, user, profile, navigate]);

  // NUEVA LÓGICA: Cargar datos del pedido desde Supabase
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

        // Obtener el pedido básico
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            services (
              id,
              title,
              category,
              price
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
                .select('id, title, price, translations')
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

          // NUEVA LÓGICA: Cargar archivos del cliente desde order_files
          const clientFiles = await loadClientFiles(data.client_id, orderId);

          const orderWithProfile = {
            ...data,
            profiles: profileData,
            additional_services_details: additionalServicesDetails,
            order_files: [...clientFiles.mainFiles, ...clientFiles.additionalFiles],
            optional_attachments_urls: clientFiles.additionalFiles.map(f => f.file_url)
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

  // NUEVA FUNCIÓN: Cargar archivos del cliente desde order_files
  const loadClientFiles = async (clientId: string, orderId: string) => {
    try {
      console.log('🔍 Cargando archivos del cliente:', { clientId, orderId });
      
      // Cargar todos los archivos del cliente (file_category = 'map')
      const { data: clientFilesData, error: clientError } = await supabase
        .from('order_files')
        .select('*')
        .eq('order_id', orderId)
        .eq('uploaded_by', clientId)
        .eq('file_category', 'map')
        .order('created_at', { ascending: false });

      if (clientError) {
        console.error('Error loading client files:', clientError);
        return { mainFiles: [], additionalFiles: [] };
      }

      console.log('📁 Archivos encontrados en BD:', clientFilesData?.length || 0, clientFilesData);

      // Procesar todos los archivos del cliente
      const processedClientFiles = (clientFilesData || []).map(file => ({
        id: file.id,
        order_id: file.order_id,
        file_name: file.file_name,
        file_url: file.file_url,
        file_size: file.file_size,
        file_type: file.file_type,
        file_category: file.file_category,
        admin_comments: file.admin_comments,
        created_at: file.created_at
      }));

      // Separar archivos principales y adicionales por bucket usando file_url
      const processedMainFiles = processedClientFiles.filter(file => 
        file.file_url.includes('clientordersprincipal')
      );
      
      const processedAdditionalFiles = processedClientFiles.filter(file => 
        file.file_url.includes('clientorderadicional')
      );

      console.log('✅ Archivos del cliente separados por bucket:', {
        mainFiles: processedMainFiles.length,
        additionalFiles: processedAdditionalFiles.length,
        mainFilesList: processedMainFiles.map(f => f.file_name),
        additionalFilesList: processedAdditionalFiles.map(f => f.file_name)
      });

      return {
        mainFiles: processedMainFiles,
        additionalFiles: processedAdditionalFiles
      };
    } catch (error) {
      console.error('Error loading client files:', error);
      return { mainFiles: [], additionalFiles: [] };
    }
  };

  // NUEVA FUNCIÓN: Descargar archivos del cliente
  const downloadFile = async (file: any, fileName?: string) => {
    try {
      console.log('📥 Descargando archivo:', file);
      
      // Manejar tanto objetos de archivo como URLs directas
      let downloadUrl: string;
      let downloadFileName: string;
      
      if (typeof file === 'string') {
        // Es una URL directa (para compatibilidad con archivos admin)
        downloadUrl = file;
        downloadFileName = fileName || extractFileNameFromUrl(file);
      } else {
        // Es un objeto de archivo
        downloadUrl = file.file_url;
        downloadFileName = file.file_name;
      }

      // Usar directamente la URL almacenada (ya es pública)

      // Crear enlace de descarga
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = downloadFileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log('✅ Archivo descargado exitosamente desde:', downloadUrl);
      toast.success('Archivo descargado correctamente');
    } catch (error) {
      console.error('❌ Error descargando archivo:', error);
      toast.error(`Error al descargar el archivo: ${error.message}`);
    }
  };

  // NUEVA FUNCIÓN: Cargar archivos subidos por admin
  const loadAdminFiles = async () => {
    if (!order?.id || !order?.client_id) return;

    try {
      setAdminFilesLoading(true);
      console.log('🔍 Cargando archivos del admin para orden:', order.id);
      
      // Obtener archivos tuneados del admin (file_category = 'map')
      const { data: mapFilesData, error: mapFilesError } = await supabase
        .from('order_files')
        .select('*, admin_comments_en')
        .eq('order_id', order.id)
        .eq('file_category', 'map')
        .is('uploaded_by', null) // Admin files have null uploaded_by
        .order('created_at', { ascending: false });

      if (mapFilesError) {
        console.error('Error loading map files:', mapFilesError);
      }

      // Obtener facturas del admin (file_category = 'invoice')
      const { data: invoiceFilesData, error: invoiceFilesError } = await supabase
        .from('order_files')
        .select('*, admin_comments_en')
        .eq('order_id', order.id)
        .eq('file_category', 'invoice')
        .is('uploaded_by', null) // Admin files have null uploaded_by
        .order('created_at', { ascending: false });

      if (invoiceFilesError) {
        console.error('Error loading invoice files:', invoiceFilesError);
      }

      // Procesar archivos tuneados del admin
      const processedAdminFiles: AdminFile[] = (mapFilesData || []).map(file => {
        const { data: { publicUrl } } = supabase.storage
          .from('adminorders')
          .getPublicUrl(file.file_url);

        return {
          id: file.id,
          order_id: file.order_id,
          file_name: file.file_name,
          file_url: publicUrl,
          file_size: file.file_size,
          file_type: file.file_type,
          file_category: file.file_category,
          admin_comments: file.admin_comments,
          admin_comments_en: file.admin_comments_en,
          created_at: file.created_at,
          uploaded_by: file.uploaded_by
        };
      });

      // Procesar facturas del admin
      const processedInvoiceFiles: AdminFile[] = (invoiceFilesData || []).map(file => {
        const { data: { publicUrl } } = supabase.storage
          .from('invoices')
          .getPublicUrl(file.file_url);

        return {
          id: file.id,
          order_id: file.order_id,
          file_name: file.file_name,
          file_url: publicUrl,
          file_size: file.file_size,
          file_type: file.file_type,
          file_category: file.file_category,
          admin_comments: file.admin_comments,
          admin_comments_en: file.admin_comments_en,
          created_at: file.created_at,
          uploaded_by: file.uploaded_by
        };
      });

      setAdminFiles(processedAdminFiles);
      setAdminInvoices(processedInvoiceFiles);

      console.log('✅ Archivos del admin cargados:', {
        mapFiles: mapFilesData?.length || 0,
        invoiceFiles: invoiceFilesData?.length || 0,
        totalAdminFiles: processedAdminFiles.length,
        totalInvoices: processedInvoiceFiles.length
      });
    } catch (err: any) {
      console.error('Error loading admin files:', err);
    } finally {
      setAdminFilesLoading(false);
    }
  };

  // Cargar archivos del admin cuando se monta el componente
  useEffect(() => {
    loadAdminFiles();
  }, [order?.id, order?.client_id]);

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

  // NUEVA FUNCIÓN: Función para limpiar nombres de archivo
  const sanitizeFileName = (fileName: string): string => {
    return fileName
      .replace(/[^a-zA-Z0-9.-]/g, '_') // Reemplazar caracteres especiales con _
      .replace(/_{2,}/g, '_') // Reemplazar múltiples _ con uno solo
      .replace(/^_|_$/g, ''); // Remover _ al inicio y final
  };

  // NUEVA FUNCIÓN: Subir archivos tuneados del admin
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !order) {
      console.log('❌ No file selected or no order:', { file: !!file, order: !!order });
      return;
    }

    console.log('🚀 NUEVA LÓGICA - Starting tuned file upload:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      orderId: order.id,
      clientId: order.client_id,
      mapComment
    });

    try {
      setUploading(true);
      
      // Limpiar nombre del archivo
      const sanitizedFileName = sanitizeFileName(file.name);
      
      // NUEVA ESTRUCTURA: adminorders/clientId/orderId/filename
      const filePath = `${order.client_id}/${order.id}/${sanitizedFileName}`;
      
      console.log('📁 NUEVA ESTRUCTURA - Upload path:', filePath);
      
      // Subir a bucket 'adminorders'
      const { error: uploadError } = await supabase.storage
        .from('adminorders')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true // Permitir sobrescribir archivos existentes
        });

      if (uploadError) {
        console.error('❌ Storage upload error:', uploadError);
        throw uploadError;
      }

      console.log('✅ File uploaded to adminorders bucket successfully');

      // NUEVA LÓGICA: Insertar en 'order_files' con file_category = 'map'
      const insertData = {
        order_id: order.id,
        client_id: order.client_id, // Incluir client_id para evitar error de constraint
        uploaded_by: null, // Admin files have null uploaded_by
        file_name: sanitizedFileName,
        file_url: filePath, // Guardar el path relativo
        file_size: file.size,
        file_type: file.type,
        file_category: 'map', // Categoría para archivos tuneados
        admin_comments: mapComment || null,
        admin_comments_en: mapCommentEn || null // Traducción en inglés
      };

      console.log('💾 NUEVA LÓGICA - Inserting to order_files:', insertData);

      // Insertar registro en order_files
      const { data: insertResult, error: dbError } = await supabase
        .from('order_files')
        .insert(insertData)
        .select();

      if (dbError) {
        console.error('❌ Database insert error:', dbError);
        throw dbError;
      }

      console.log('✅ Database insert successful:', insertResult);

      toast.success('Archivo tuneado subido correctamente');
      setMapComment('');
      setMapCommentEn('');
      setShowMapTranslation(false);
      
      // Limpiar el input de archivo
      const fileInput = event.target;
      if (fileInput) {
        fileInput.value = '';
      }
      
      // Recargar archivos del admin
      await loadAdminFiles();
      
    } catch (err: any) {
      console.error('💥 Error uploading tuned file:', err);
      toast.error(`Error al subir archivo tuneado: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  // NUEVA FUNCIÓN: Subir facturas del admin
  const handleInvoiceUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !order) {
      console.log('❌ No invoice file selected or no order:', { file: !!file, order: !!order });
      return;
    }

    console.log('🚀 NUEVA LÓGICA - Starting invoice upload:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      orderId: order.id,
      clientId: order.client_id,
      invoiceComment
    });

    try {
      setUploadingInvoice(true);
      
      // Limpiar nombre del archivo
      const sanitizedFileName = sanitizeFileName(file.name);
      
      // NUEVA ESTRUCTURA: invoices/clientId/orderId/filename
      const filePath = `${order.client_id}/${order.id}/${sanitizedFileName}`;
      
      console.log('📁 NUEVA ESTRUCTURA - Invoice upload path:', filePath);
      
      // Subir a bucket 'invoices'
      const { error: uploadError } = await supabase.storage
        .from('invoices')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true // Permitir sobrescribir archivos existentes
        });

      if (uploadError) {
        console.error('❌ Invoice storage upload error:', uploadError);
        throw uploadError;
      }

      console.log('✅ Invoice uploaded to invoices bucket successfully');

      // NUEVA LÓGICA: Insertar en 'order_files' con file_category = 'invoice'
      const insertData = {
        order_id: order.id,
        client_id: order.client_id, // Incluir client_id para evitar error de constraint
        uploaded_by: null, // Admin invoices have null uploaded_by
        file_name: sanitizedFileName,
        file_url: filePath, // Guardar el path relativo
        file_size: file.size,
        file_type: file.type,
        file_category: 'invoice', // Categoría para facturas
        admin_comments: invoiceComment || null,
        admin_comments_en: invoiceCommentEn || null // Traducción en inglés
      };

      console.log('💾 NUEVA LÓGICA - Inserting invoice to order_files:', insertData);

      // Insertar registro en order_files
      const { data: insertResult, error: dbError } = await supabase
        .from('order_files')
        .insert(insertData)
        .select();

      if (dbError) {
        console.error('❌ Invoice database insert error:', dbError);
        throw dbError;
      }

      console.log('✅ Invoice database insert successful:', insertResult);

      toast.success('Factura subida correctamente');
      setInvoiceComment('');
      setInvoiceCommentEn('');
      setShowInvoiceTranslation(false);
      
      // Limpiar el input de archivo
      const fileInput = event.target;
      if (fileInput) {
        fileInput.value = '';
      }
      
      // Recargar archivos del admin
      await loadAdminFiles();
      
    } catch (err: any) {
      console.error('💥 Error uploading invoice:', err);
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
      
      // Preparar datos para actualizar
      const updateData: any = { admin_comments: comment };
      
      // Si hay comentario y no está vacío, intentar traducir automáticamente
      if (comment && comment.trim()) {
        try {
          const translatedComment = await translateText(
            comment,
            'English',
            'Spanish',
            'Este es un comentario administrativo sobre un archivo. Traduce de manera técnica y precisa.'
          );
          updateData.admin_comments_en = translatedComment;
        } catch (translationError) {
          console.warn('No se pudo traducir automáticamente:', translationError);
          // Continuar sin traducción automática
        }
      } else {
        // Si el comentario está vacío, limpiar también la traducción
        updateData.admin_comments_en = null;
      }
      
      // Actualizar en la base de datos
      const { error } = await supabase
        .from(table)
        .update(updateData)
        .eq('id', fileId);

      if (error) {
        throw error;
      }

      // Actualizar el estado local
      if (table === 'order_files') {
        setAdminFiles(prev => 
          prev.map(file => 
            file.id === fileId ? { 
              ...file, 
              admin_comments: comment,
              admin_comments_en: updateData.admin_comments_en
            } : file
          )
        );
      } else if (order) {
        if (table === 'invoices') {
          setOrder(prev => ({
            ...prev!,
            invoices: prev!.invoices?.map(invoice => 
              invoice.id === fileId ? { 
                ...invoice, 
                admin_comments: comment,
                admin_comments_en: updateData.admin_comments_en
              } : invoice
            )
          }));
        }
      }

      setEditingComments(prev => ({ ...prev, [fileId]: false }));
      setTempComments(prev => ({ ...prev, [fileId]: '' }));
      
      if (updateData.admin_comments_en) {
        toast.success('Comentario guardado y traducido automáticamente');
      } else {
        toast.success('Comentario actualizado correctamente');
      }
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

  // Funciones de traducción automática
  const translateMapComment = async () => {
    if (!mapComment.trim()) {
      toast.error('Por favor, escribe un comentario antes de traducir');
      return;
    }

    try {
      setIsTranslatingMap(true);
      setTranslationError(prev => ({ ...prev, map: undefined }));
      
      const translatedText = await translateText(
        mapComment,
        'English',
        'Spanish',
        'Este es un comentario sobre un mapa tuneado de un vehículo. Traduce de manera técnica y precisa.'
      );
      
      setMapCommentEn(translatedText);
      setShowMapTranslation(true);
      toast.success('Comentario traducido correctamente');
    } catch (error: any) {
      console.error('❌ Error translating map comment:', error);
      let errorMessage = 'Error al traducir el comentario';
      
      if (error.message?.includes('quota') || error.message?.includes('limit')) {
        errorMessage = 'Límite de traducción alcanzado. Puedes escribir la traducción manualmente.';
        setTranslationError(prev => ({ ...prev, map: errorMessage }));
        setShowMapTranslation(true); // Mostrar campo para edición manual
      } else {
        setTranslationError(prev => ({ ...prev, map: errorMessage }));
      }
      
      toast.error(errorMessage);
    } finally {
      setIsTranslatingMap(false);
    }
  };

  const translateInvoiceComment = async () => {
    if (!invoiceComment.trim()) {
      toast.error('Por favor, escribe un comentario antes de traducir');
      return;
    }

    try {
      setIsTranslatingInvoice(true);
      setTranslationError(prev => ({ ...prev, invoice: undefined }));
      
      const translatedText = await translateText(
        invoiceComment,
        'English',
        'Spanish',
        'Este es un comentario sobre una factura. Traduce de manera profesional y clara.'
      );
      
      setInvoiceCommentEn(translatedText);
      setShowInvoiceTranslation(true);
      toast.success('Comentario traducido correctamente');
    } catch (error: any) {
      console.error('Error translating invoice comment:', error);
      let errorMessage = 'Error al traducir el comentario';
      
      if (error.message?.includes('quota') || error.message?.includes('limit')) {
        errorMessage = 'Límite de traducción alcanzado. Puedes escribir la traducción manualmente.';
        setTranslationError(prev => ({ ...prev, invoice: errorMessage }));
        setShowInvoiceTranslation(true); // Mostrar campo para edición manual
      } else {
        setTranslationError(prev => ({ ...prev, invoice: errorMessage }));
      }
      
      toast.error(errorMessage);
    } finally {
      setIsTranslatingInvoice(false);
    }
  };

  // NUEVA FUNCIÓN: Eliminar archivos del admin
  // FUNCIÓN DELETEFILE CREADA DESDE CERO
  const deleteFile = async (fileId: string, table: 'order_files' | 'invoices') => {
    try {
      setDeletingFile(prev => ({ ...prev, [fileId]: true }));
      
      console.log('🗑️ NUEVA LÓGICA - Iniciando eliminación de archivo:', {
        fileId,
        table,
        orderId: order?.id,
        clientId: order?.client_id
      });
      
      if (!order) {
        throw new Error('Pedido no disponible');
      }

      // Obtener información del archivo desde order_files
      const { data: fileData, error: fetchError } = await supabase
        .from('order_files')
        .select('*')
        .eq('id', fileId)
        .single();

      if (fetchError || !fileData) {
        console.error('❌ Error obteniendo archivo:', fetchError);
        throw new Error('Archivo no encontrado');
      }

      console.log('📄 Datos del archivo encontrado:', {
        fileName: fileData.file_name,
        fileCategory: fileData.file_category,
        uploadedBy: fileData.uploaded_by
      });

      // NUEVA LÓGICA: Determinar bucket automáticamente según file_category
      let bucketName = '';
      if (fileData.file_category === 'map') {
        bucketName = 'adminorders';
      } else if (fileData.file_category === 'invoice') {
        bucketName = 'invoices';
      } else {
        throw new Error(`Categoría de archivo no soportada: ${fileData.file_category}`);
      }
      
      console.log('🪣 Bucket detectado:', bucketName);

      // NUEVA ESTRUCTURA: Eliminar del storage usando client_id/order_id/filename
      const sanitizedFileName = sanitizeFileName(fileData.file_name);
      const storagePath = `${order.client_id}/${order.id}/${sanitizedFileName}`;
      
      console.log('🗑️ Eliminando del storage:', {
        bucket: bucketName,
        path: storagePath
      });
      
      const { error: storageError } = await supabase.storage
        .from(bucketName)
        .remove([storagePath]);

      if (storageError) {
        console.warn('⚠️ Advertencia al eliminar del storage:', storageError);
        // Continuar con la eliminación de la base de datos aunque falle el storage
      } else {
        console.log('✅ Archivo eliminado del storage exitosamente');
      }

      // NUEVA LÓGICA: Eliminar registro de order_files
      console.log('🗑️ Eliminando de la tabla order_files:', fileId);
      
      const { error: dbError } = await supabase
        .from('order_files')
        .delete()
        .eq('id', fileId);

      if (dbError) {
        console.error('❌ Error eliminando de la base de datos:', dbError);
        throw dbError;
      }
      
      console.log('✅ Archivo eliminado de la base de datos exitosamente');

      // Actualizar estado local - recargar archivos admin
      await loadAdminFiles();
      
      toast.success(`${fileData.file_category === 'map' ? 'Mapa tuneado' : 'Factura'} eliminado correctamente`);
      
      console.log('✅ Eliminación completada exitosamente');
      
    } catch (err: any) {
      console.error('💥 Error eliminando archivo:', err);
      toast.error(`Error al eliminar archivo: ${err.message}`);
    } finally {
      setDeletingFile(prev => ({ ...prev, [fileId]: false }));
      setShowDeleteConfirm(prev => ({ ...prev, [fileId]: false }));
    }
  };

  // FUNCIONES AUXILIARES CREADAS DESDE CERO

  // Función para extraer el path del archivo desde una URL completa de Supabase Storage
  const extractFilePathFromUrl = (url: string): string => {
    try {
      // Si ya es un path relativo (no contiene http), devolverlo tal como está
      if (!url.startsWith('http')) {
        console.log('📁 URL ya es un path relativo:', url);
        return url;
      }
      
      console.log('🔍 Extrayendo path de URL completa:', url);
      
      // Extraer el path después de '/object/public/bucket_name/'
      const objectPublicIndex = url.indexOf('/object/public/');
      if (objectPublicIndex !== -1) {
        const afterObjectPublic = url.substring(objectPublicIndex + 15); // +15 para saltar '/object/public/'
        
        // Buscar el primer '/' después del nombre del bucket para obtener el path del archivo
        const firstSlashIndex = afterObjectPublic.indexOf('/');
        if (firstSlashIndex !== -1) {
          const filePath = afterObjectPublic.substring(firstSlashIndex + 1);
          console.log('📁 Path extraído (método object/public):', filePath);
          return filePath;
        }
      }
      
      // Método alternativo: extraer después del bucket name
      // Buscar patrones de buckets conocidos
      const bucketPatterns = [
        '/clientordersprincipal/',
        '/clientorderadicional/',
        '/adminorders/',
        '/invoices/'
      ];
      
      for (const bucketPattern of bucketPatterns) {
        const bucketIndex = url.indexOf(bucketPattern);
        if (bucketIndex !== -1) {
          const filePath = url.substring(bucketIndex + bucketPattern.length);
          console.log(`📁 Path extraído (método bucket pattern ${bucketPattern}):`, filePath);
          return filePath;
        }
      }
      
      console.warn('⚠️ No se pudo extraer path, usando URL completa');
      return url;
    } catch (error) {
      console.error('❌ Error extracting file path:', error);
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

  // Función global para parsear main_file_url que puede ser string simple o JSON array
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



  // Usar la función unificada de generación de PDF
  const handleGeneratePDF = async () => {
    if (!order) return;
    
    // Cargar archivos del cliente para incluir en el PDF
    const clientFilesData = await loadClientFiles(order.client_id, order.id);
    const allClientFiles = [
      ...(clientFilesData.mainFiles || []),
      ...(clientFilesData.additionalFiles || [])
    ];
    
    await generatePDF(order, allClientFiles);
  };

  // Función para verificar si hay archivos del cliente
  const hasClientFiles = (): boolean => {
    if (!order) return false;
    
    // Verificar archivos principales
    const mainFileUrls = parseMainFileUrl(order.main_file_url);
    const hasMainFiles = mainFileUrls.length > 0;
    
    // Verificar archivos adicionales
    const hasAdditionalFiles = order.optional_attachments_urls && order.optional_attachments_urls.length > 0;
    
    return hasMainFiles || hasAdditionalFiles;
  };

  // Función para descargar archivo como blob
  const downloadFileAsBlob = async (url: string, fileName: string): Promise<{ blob: Blob; fileName: string } | null> => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error al descargar ${fileName}: ${response.statusText}`);
      }
      const blob = await response.blob();
      return { blob, fileName };
    } catch (error) {
      console.error(`Error descargando ${fileName}:`, error);
      return null;
    }
  };




  // Función principal para descargar todo en ZIP
  const handleDownloadAll = async () => {
    if (!order || downloadingAllFiles) return;
    
    setDownloadingAllFiles(true);
    
    try {
      const zip = new JSZip();
      let totalFiles = 0;
      
      // 1. Generar PDF usando la función unificada
      const pdfBlob = await generatePDFBlob(order);
      if (pdfBlob) {
        zip.file(`pedido_${order.id.slice(-8)}.pdf`, pdfBlob);
        totalFiles++;
      }
      
      // 2. Crear carpetas para archivos del cliente
      const clientMainFolder = zip.folder('archivos_cliente/principales');
      const clientAdditionalFolder = zip.folder('archivos_cliente/adicionales');
      
      // Cargar archivos del cliente desde order_files (incluye ambos buckets)
      const clientFilesData = await loadClientFiles(order.client_id, order.id);
      
      // Agregar archivos principales del cliente (clientordersprincipal)
      if (clientFilesData.mainFiles && clientFilesData.mainFiles.length > 0) {
        for (const file of clientFilesData.mainFiles) {
          if (file.file_url) {
            const fileData = await downloadFileAsBlob(file.file_url, file.file_name);
            if (fileData && clientMainFolder) {
              clientMainFolder.file(fileData.fileName, fileData.blob);
              totalFiles++;
            }
          }
        }
      }
      
      // Agregar archivos adicionales del cliente (clientorderadicional)
      if (clientFilesData.additionalFiles && clientFilesData.additionalFiles.length > 0) {
        for (const file of clientFilesData.additionalFiles) {
          if (file.file_url) {
            const fileData = await downloadFileAsBlob(file.file_url, file.file_name);
            if (fileData && clientAdditionalFolder) {
              clientAdditionalFolder.file(fileData.fileName, fileData.blob);
              totalFiles++;
            }
          }
        }
      }
      
      // 3. Crear carpetas para archivos del admin
      const adminMapsFolder = zip.folder('archivos_admin/mapas_tuneados');
      const adminInvoicesFolder = zip.folder('archivos_admin/facturas');
      
      // Agregar mapas tuneados (admin files)
      if (adminFiles && adminFiles.length > 0) {
        for (const file of adminFiles) {
          if (file.file_url) {
            const fileData = await downloadFileAsBlob(file.file_url, file.file_name);
            if (fileData && adminMapsFolder) {
              adminMapsFolder.file(fileData.fileName, fileData.blob);
              totalFiles++;
            }
          }
        }
      }
      
      // Agregar facturas (admin invoices)
      if (adminInvoices && adminInvoices.length > 0) {
        for (const invoice of adminInvoices) {
          if (invoice.file_url) {
            const fileData = await downloadFileAsBlob(invoice.file_url, invoice.file_name);
            if (fileData && adminInvoicesFolder) {
              adminInvoicesFolder.file(fileData.fileName, fileData.blob);
              totalFiles++;
            }
          }
        }
      }
      
      // 4. Generar y descargar el ZIP
      if (totalFiles > 0) {
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(zipBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `pedido_completo_${order.id.slice(-8)}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast.success(`Se ha descargado el archivo ZIP con ${totalFiles} archivos`);
      } else {
        toast.error('No se encontraron archivos para descargar');
      }
      
    } catch (error) {
      console.error('Error creando ZIP:', error);
      toast.error('Error al crear el archivo ZIP');
    } finally {
      setDownloadingAllFiles(false);
    }
  };

  // Función para descargar todos los archivos del cliente (mantener compatibilidad)
  const downloadAllClientFiles = handleDownloadAll;

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
          <h2 className="text-xl font-semibold text-white mb-2">{t('orderDetails.loading')}</h2>
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
                          <span className="text-gray-300">
                            {service.translations ? getServiceTitle(service, i18n.language) : service.title}
                          </span>
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
                  onClick={handleGeneratePDF}
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
                      <span>{t('orderDetails.files.download')}</span>
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
                {order.order_files && order.order_files.filter(file => file.file_url.includes('clientordersprincipal')).length > 0 ? (
                  <div className="space-y-3">
                    {order.order_files.filter(file => file.file_url.includes('clientordersprincipal')).map((file) => (
                      <div key={file.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 p-3 bg-gray-700/50 rounded-lg border border-gray-600/50">
                        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                          <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-white font-medium text-sm sm:text-base truncate">{file.file_name}</p>
                            <p className="text-gray-400 text-xs sm:text-sm">{t('orderDetails.files.mainFile.ecuFile')}</p>
                            <p className="text-gray-500 text-xs">Subido: {new Date(file.created_at).toLocaleDateString('es-ES')}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 self-start sm:self-auto">
                          <button
                            onClick={() => downloadFile(file)}
                            className="flex items-center justify-center space-x-2 px-3 py-2 bg-primary/20 text-primary border border-primary/30 rounded-lg hover:bg-primary/30 transition-colors min-h-[44px] text-sm font-medium"
                          >
                            <Download className="w-4 h-4" />
                            <span>{t('orderDetails.common.download')}</span>
                          </button>
                        </div>
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
                )}
              </div>

              {/* Archivos adicionales del cliente */}
              <div className="mb-4 sm:mb-6">
                <h3 className="text-white font-medium mb-2 sm:mb-3 text-sm sm:text-base">{t('orderDetails.files.additionalFiles.title')}</h3>
                {order.order_files && order.order_files.filter(file => file.file_url.includes('clientorderadicional')).length > 0 ? (
                  <div className="space-y-3">
                    {order.order_files.filter(file => file.file_url.includes('clientorderadicional')).map((file) => (
                      <div key={file.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 p-3 bg-gray-700/50 rounded-lg border border-gray-600/50">
                        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                          <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-white font-medium text-sm sm:text-base truncate">{file.file_name}</p>
                            <p className="text-gray-400 text-xs sm:text-sm">Documento adjunto</p>
                            <p className="text-gray-500 text-xs">Subido: {new Date(file.created_at).toLocaleDateString('es-ES')}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 self-start sm:self-auto">
                          <button
                            onClick={() => downloadFile(file)}
                            className="flex items-center justify-center space-x-2 px-3 py-2 bg-primary/20 text-primary border border-primary/30 rounded-lg hover:bg-primary/30 transition-colors min-h-[44px] text-sm font-medium"
                          >
                            <Download className="w-4 h-4" />
                            <span>{t('orderDetails.common.download')}</span>
                          </button>
                        </div>
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
                {adminFiles && adminFiles.length > 0 ? (
                  <div className="space-y-3">
                    {adminFiles.map((file) => (
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
                              onClick={() => downloadFile(file.file_url, file.file_name)}
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
                                  {(() => {
                                    const result = i18n.language === 'en' && file.admin_comments_en 
                                      ? file.admin_comments_en 
                                      : file.admin_comments || (i18n.language === 'en' ? 'No comments' : 'Sin comentarios');
                                    console.log('Map comment translation:', {
                                      language: i18n.language,
                                      admin_comments_en: file.admin_comments_en,
                                      admin_comments: file.admin_comments,
                                      result: result,
                                      fileId: file.id
                                    });
                                    return result;
                                  })()
                                  }
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
                {adminInvoices && adminInvoices.length > 0 ? (
                  <div className="space-y-3">
                    {adminInvoices.map((invoice) => (
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
                              onClick={() => downloadFile(invoice.file_url, invoice.file_name)}
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
                                  {(() => {
                                    const result = i18n.language === 'en' && invoice.admin_comments_en 
                                      ? invoice.admin_comments_en 
                                      : invoice.admin_comments || t('orderDetails.files.invoices.noComments');
                                    console.log('Invoice comment translation:', {
                                      language: i18n.language,
                                      admin_comments_en: invoice.admin_comments_en,
                                      admin_comments: invoice.admin_comments,
                                      result: result,
                                      invoiceId: invoice.id
                                    });
                                    return result;
                                  })()
                                  }
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
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-gray-300 text-sm font-medium">Comentario (Español)</label>
                        <button
                          onClick={translateMapComment}
                          disabled={isTranslatingMap || !mapComment.trim()}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-xs rounded-lg transition-colors flex items-center space-x-1"
                        >
                          {isTranslatingMap ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
                              <span>Traduciendo...</span>
                            </>
                          ) : (
                            <span>Traducir al inglés</span>
                          )}
                        </button>
                      </div>
                      <textarea
                        value={mapComment}
                        onChange={(e) => setMapComment(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none text-sm"
                        rows={3}
                        placeholder={t('orderDetails.upload.tunedMap.comments')}
                      />
                    </div>
                    
                    {(showMapTranslation || translationError.map) && (
                      <div className="space-y-2">
                        <label className="text-gray-300 text-sm font-medium">Traducción (Inglés)</label>
                        {translationError.map && (
                          <p className="text-yellow-400 text-xs">{translationError.map}</p>
                        )}
                        <textarea
                          value={mapCommentEn}
                          onChange={(e) => setMapCommentEn(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-700/50 border border-blue-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none text-sm"
                          rows={3}
                          placeholder="English translation of the comment..."
                        />
                      </div>
                    )}
                    
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
                        <p className="text-gray-400 text-xs sm:text-sm mt-2">{t('orderDetails.files.uploadingMap')}</p>
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
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-gray-300 text-sm font-medium">Comentario (Español)</label>
                        <button
                          onClick={translateInvoiceComment}
                          disabled={isTranslatingInvoice || !invoiceComment.trim()}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-xs rounded-lg transition-colors flex items-center space-x-1"
                        >
                          {isTranslatingInvoice ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
                              <span>Traduciendo...</span>
                            </>
                          ) : (
                            <span>Traducir al inglés</span>
                          )}
                        </button>
                      </div>
                      <textarea
                        value={invoiceComment}
                        onChange={(e) => setInvoiceComment(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none text-sm"
                        rows={3}
                        placeholder={t('orderDetails.upload.invoice.comments')}
                      />
                    </div>
                    
                    {(showInvoiceTranslation || translationError.invoice) && (
                      <div className="space-y-2">
                        <label className="text-gray-300 text-sm font-medium">Traducción (Inglés)</label>
                        {translationError.invoice && (
                          <p className="text-yellow-400 text-xs">{translationError.invoice}</p>
                        )}
                        <textarea
                          value={invoiceCommentEn}
                          onChange={(e) => setInvoiceCommentEn(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-700/50 border border-blue-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none text-sm"
                          rows={3}
                          placeholder="English translation of the comment..."
                        />
                      </div>
                    )}
                    
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
                        <p className="text-gray-400 text-xs sm:text-sm mt-2">{t('orderDetails.files.uploadingInvoice')}</p>
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