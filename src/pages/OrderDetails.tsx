import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, User, Car, FileText, Settings, CheckCircle, Clock, AlertCircle, ChevronDown, FileDown, Upload, MapPin, Wrench, CreditCard, Trash2 } from 'lucide-react';
import jsPDF from 'jspdf';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

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
    } catch (err: any) {
      console.error('Error updating order status:', err);
      toast.error(`Error al actualizar estado: ${err.message}`);
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'in_progress':
        return 'En Proceso';
      case 'completed':
        return 'Completado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return 'Pendiente';
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

  const downloadFile = async (url: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('order-files')
        .download(url);

      if (error) {
        throw error;
      }

      // Crear URL para descarga
      const downloadUrl = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
      
      toast.success('Descarga iniciada');
    } catch (err: any) {
      console.error('Error downloading file:', err);
      toast.error(`Error al descargar archivo: ${err.message}`);
    }
  };

  const generatePDF = () => {
    if (!order) return;

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const margin = 20;
      let yPosition = 30;

      // Header
      doc.setFontSize(20);
      doc.setTextColor(40, 40, 40);
      doc.text('DETALLE DEL PEDIDO', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 20;

      // Información del pedido
      doc.setFontSize(14);
      doc.setTextColor(60, 60, 60);
      doc.text(`Pedido #${order.id.slice(-8).toUpperCase()}`, margin, yPosition);
      doc.text(`Fecha: ${formatDate(order.created_at)}`, pageWidth - margin - 80, yPosition);
      doc.text(`Estado: ${getStatusDisplay(order.status)}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 20;

      // Línea separadora
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 15;

      // Información del Cliente
      doc.setFontSize(16);
      doc.setTextColor(40, 40, 40);
      doc.text('INFORMACIÓN DEL CLIENTE', margin, yPosition);
      yPosition += 10;
      
      doc.setFontSize(12);
      doc.setTextColor(80, 80, 80);
      doc.text(`Nombre: ${order.profiles?.full_name || 'N/A'}`, margin, yPosition);
      yPosition += 8;
      doc.text(`Email: ${order.profiles?.email || 'N/A'}`, margin, yPosition);
      yPosition += 8;
      if (order.profiles?.phone) {
        doc.text(`Teléfono: ${order.profiles.phone}`, margin, yPosition);
        yPosition += 8;
      }
      yPosition += 15;

      // Información del Vehículo
      doc.setFontSize(16);
      doc.setTextColor(40, 40, 40);
      doc.text('INFORMACIÓN DEL VEHÍCULO', margin, yPosition);
      yPosition += 10;
      
      doc.setFontSize(12);
      doc.setTextColor(80, 80, 80);
      if (order.vehicle_make) {
        doc.text(`Marca: ${order.vehicle_make}`, margin, yPosition);
        doc.text(`Modelo: ${order.vehicle_model || ''}`, margin + 80, yPosition);
        yPosition += 8;
      }
      if (order.vehicle_generation) {
        doc.text(`Generación: ${order.vehicle_generation}`, margin, yPosition);
        doc.text(`Motor: ${order.vehicle_engine || ''}`, margin + 80, yPosition);
        yPosition += 8;
      }
      if (order.vehicle_ecu) {
        doc.text(`ECU: ${order.vehicle_ecu}`, margin, yPosition);
        doc.text(`Año: ${order.vehicle_year || ''}`, margin + 80, yPosition);
        yPosition += 8;
      }
      if (order.vehicle_gearbox) {
        doc.text(`Transmisión: ${order.vehicle_gearbox}`, margin, yPosition);
        yPosition += 8;
      }
      if (order.engine_hp) {
        doc.text(`Potencia: ${order.engine_hp} HP${order.engine_kw ? ` (${order.engine_kw} kW)` : ''}`, margin, yPosition);
        yPosition += 8;
      }
      if (order.read_method) {
        doc.text(`Método de Lectura: ${order.read_method}`, margin, yPosition);
        yPosition += 8;
      }
      if (order.hardware_number) {
        doc.text(`Número de Hardware: ${order.hardware_number}`, margin, yPosition);
        yPosition += 8;
      }
      if (order.software_number) {
        doc.text(`Número de Software: ${order.software_number}`, margin, yPosition);
        yPosition += 8;
      }

      // Servicios adicionales
      if (order.additional_services_details && order.additional_services_details.length > 0) {
        yPosition += 5;
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text('SERVICIOS ADICIONALES', margin, yPosition);
        yPosition += 10;
        
        doc.setFontSize(12);
        doc.setTextColor(80, 80, 80);
        order.additional_services_details.forEach((service: any) => {
          doc.text(`• ${service.title} - €${parseFloat(service.price || 0).toFixed(2)}`, margin, yPosition);
          yPosition += 6;
        });
      }

      // Información adicional
      if (order.additional_info) {
        yPosition += 5;
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text('INFORMACIÓN ADICIONAL', margin, yPosition);
        yPosition += 10;
        
        doc.setFontSize(12);
        doc.setTextColor(80, 80, 80);
        const lines = doc.splitTextToSize(order.additional_info, 160);
        doc.text(lines, margin, yPosition);
        yPosition += lines.length * 6;
      }

      // Guardar el PDF
      doc.save(`pedido-${order.id.slice(-8)}.pdf`);
    } catch (error) {
      console.error('Error al generar PDF:', error);
      toast.error('Error al generar el PDF');
    }
  };

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
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/admin?section=orders')}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-800/50 backdrop-blur-sm border border-gray-700 text-white rounded-lg hover:bg-gray-800/70 hover:border-primary/50 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a Pedidos</span>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white">Pedido #{order.id.slice(-8).toUpperCase()}</h1>
              <p className="text-gray-400 mt-1">{formatDate(order.created_at)}</p>
            </div>
          </div>
          <div className={`flex items-center space-x-2 px-4 py-2 rounded-xl ${getStatusColor(order.status)}`}>
            {getStatusIcon(order.status)}
            <span className="font-semibold">{getStatusDisplay(order.status)}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Información Principal */}
          <div className="xl:col-span-2 space-y-6">
            {/* Cliente */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
              <div className="flex items-center space-x-3 mb-6">
                <User className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-bold text-white">Información del Cliente</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-gray-400 text-sm font-medium">Nombre completo</label>
                    <p className="text-white text-lg font-medium">{order.profiles?.full_name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm font-medium">Correo electrónico</label>
                    <p className="text-white font-medium">{order.profiles?.email || 'N/A'}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-gray-400 text-sm font-medium">Teléfono</label>
                    <p className="text-white font-medium">{order.profiles?.phone || 'No proporcionado'}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm font-medium">ID Cliente</label>
                    <p className="text-gray-300 text-sm font-mono">{order.client_id.slice(-8)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Servicio */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Settings className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-bold text-white">Servicio Solicitado</h2>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-white text-lg font-semibold">{order.services?.title || 'N/A'}</h3>
                    <p className="text-gray-400">{order.services?.category || ''}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-primary">€{parseFloat(order.total_price?.toString() || '0').toFixed(2)}</p>
                    <p className="text-gray-400 text-sm">Precio total</p>
                  </div>
                </div>
                {order.additional_services_details && order.additional_services_details.length > 0 && (
                  <div className="border-t border-gray-700 pt-4">
                    <h4 className="text-white font-medium mb-3">Servicios adicionales</h4>
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
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Car className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-bold text-white">Información del Vehículo</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-gray-400 text-sm font-medium">Marca y Modelo</label>
                    <p className="text-white font-semibold">
                      {order.vehicle_make} {order.vehicle_model}
                    </p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm font-medium">Generación</label>
                    <p className="text-white font-medium">{order.vehicle_generation || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm font-medium">Año</label>
                    <p className="text-white font-medium">{order.vehicle_year || 'N/A'}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-gray-400 text-sm font-medium">Motor</label>
                    <p className="text-white font-medium">{order.vehicle_engine || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm font-medium">ECU</label>
                    <p className="text-white font-medium">{order.vehicle_ecu || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm font-medium">Transmisión</label>
                    <p className="text-white font-medium">{order.vehicle_gearbox || 'N/A'}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-gray-400 text-sm font-medium">Potencia</label>
                    <p className="text-white font-medium">
                      {order.engine_hp ? `${order.engine_hp} HP` : 'N/A'}
                      {order.engine_kw && ` (${order.engine_kw} kW)`}
                    </p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm font-medium">Método de Lectura</label>
                    <p className="text-white font-medium">{order.read_method || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm font-medium">Número de Hardware</label>
                    <p className="text-white font-medium">{order.hardware_number || 'N/A'}</p>
                  </div>
                </div>
                {(order.vin || order.software_number) && (
                  <div className="md:col-span-2 lg:col-span-3 space-y-4">
                    {order.vin && (
                      <div>
                        <label className="text-gray-400 text-sm font-medium">VIN</label>
                        <p className="text-white font-mono text-sm">{order.vin}</p>
                      </div>
                    )}
                    {order.software_number && (
                      <div>
                        <label className="text-gray-400 text-sm font-medium">Número de Software</label>
                        <p className="text-white font-mono text-sm">{order.software_number}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Modificaciones */}
            {order.has_modified_parts && (
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <Wrench className="w-6 h-6 text-primary" />
                  <h2 className="text-xl font-bold text-white">Modificaciones del Vehículo</h2>
                </div>
                <div className="space-y-4">
                  {[
                    { key: 'aftermarket_exhaust', label: 'Escape Aftermarket', remarks: 'aftermarket_exhaust_remarks' },
                    { key: 'aftermarket_intake_manifold', label: 'Colector de Admisión Aftermarket', remarks: 'aftermarket_intake_manifold_remarks' },
                    { key: 'cold_air_intake', label: 'Admisión de Aire Frío', remarks: 'cold_air_intake_remarks' },
                    { key: 'decat', label: 'Decat', remarks: 'decat_remarks' }
                  ].map(({ key, label, remarks }) => {
                    const hasModification = order[key as keyof OrderData] as boolean;
                    const remarkText = order[remarks as keyof OrderData] as string;
                    
                    return (
                      <div key={key} className="border border-gray-600/50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-white font-medium">{label}</h3>
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            hasModification ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                          }`}>
                            {hasModification ? 'Sí' : 'No'}
                          </span>
                        </div>
                        {hasModification && remarkText && (
                          <p className="text-gray-300 text-sm mt-2">{remarkText}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Información Adicional */}
            {order.additional_info && (
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">Información Adicional</h2>
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <p className="text-gray-300 leading-relaxed">{order.additional_info}</p>
                </div>
              </div>
            )}
          </div>

          {/* Panel Lateral */}
          <div className="space-y-6">
            {/* Acciones Rápidas */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-6">Acciones</h2>
              <div className="space-y-4">
                <button 
                  onClick={generatePDF}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-600/20 text-green-400 border border-green-600/30 rounded-xl hover:bg-green-600/30 transition-colors"
                >
                  <FileDown className="w-5 h-5" />
                  <span className="font-medium">Generar PDF</span>
                </button>

                <button
                  onClick={() => order.main_file_url && downloadFile(order.main_file_url, `archivo-principal-${order.id.slice(-8)}.bin`)}
                  disabled={!order.main_file_url}
                  className={`w-full flex items-center justify-center space-x-2 px-4 py-3 border rounded-xl transition-colors font-medium ${
                    order.main_file_url 
                      ? 'bg-primary/20 text-primary border-primary/30 hover:bg-primary/30' 
                      : 'bg-gray-600/20 text-gray-500 border-gray-600/30 cursor-not-allowed'
                  }`}
                >
                  <Download className="w-5 h-5" />
                  <span>{order.main_file_url ? 'Descargar Archivo Principal' : 'No hay archivo principal'}</span>
                </button>
              </div>
            </div>

            {/* Archivos */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
              <div className="flex items-center space-x-3 mb-6">
                <FileText className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-bold text-white">Archivos</h2>
              </div>
              
              {/* Archivo principal */}
              <div className="mb-6">
                <h3 className="text-white font-medium mb-3">Archivo Principal del Cliente</h3>
                {order.main_file_url ? (
                  <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg border border-gray-600/50">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-white font-medium">archivo-principal.bin</p>
                        <p className="text-gray-400 text-sm">Archivo de ECU</p>
                      </div>
                    </div>
                    <button
                      onClick={() => downloadFile(order.main_file_url!, `archivo-principal-${order.id.slice(-8)}.bin`)}
                      className="flex items-center space-x-2 px-3 py-1 bg-primary/20 text-primary border border-primary/30 rounded-lg hover:bg-primary/30 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span className="text-sm font-medium">Descargar</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center p-6 bg-gray-700/30 rounded-lg border border-gray-600/30 border-dashed">
                    <div className="text-center">
                      <FileText className="w-12 h-12 text-gray-500 mx-auto mb-2" />
                      <p className="text-gray-400 font-medium">No hay archivo principal</p>
                      <p className="text-gray-500 text-sm">El cliente aún no ha subido el archivo de ECU</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Archivos adicionales del cliente */}
              <div className="mb-6">
                <h3 className="text-white font-medium mb-3">Archivos Adicionales del Cliente</h3>
                {order.optional_attachments_urls && order.optional_attachments_urls.length > 0 ? (
                  <div className="space-y-3">
                    {order.optional_attachments_urls.map((url, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg border border-gray-600/50">
                        <div className="flex items-center space-x-3">
                          <FileText className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-white font-medium">archivo-adicional-{index + 1}</p>
                            <p className="text-gray-400 text-sm">Documento adjunto</p>
                          </div>
                        </div>
                        <button
                          onClick={() => downloadFile(url, `archivo-adicional-${index + 1}-${order.id.slice(-8)}`)}
                          className="flex items-center space-x-2 px-3 py-1 bg-primary/20 text-primary border border-primary/30 rounded-lg hover:bg-primary/30 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          <span className="text-sm font-medium">Descargar</span>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center p-6 bg-gray-700/30 rounded-lg border border-gray-600/30 border-dashed">
                    <div className="text-center">
                      <FileText className="w-12 h-12 text-gray-500 mx-auto mb-2" />
                      <p className="text-gray-400 font-medium">No hay archivos adicionales</p>
                      <p className="text-gray-500 text-sm">El cliente no ha subido documentos adicionales</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Mapas tuneados subidos por admin */}
              <div className="mb-6">
                <h3 className="text-white font-medium mb-3">Mapas Tuneados (Admin)</h3>
                {order.order_files && order.order_files.filter(f => f.file_category === 'map').length > 0 ? (
                  <div className="space-y-3">
                    {order.order_files.filter(f => f.file_category === 'map').map((file) => (
                      <div key={file.id} className="p-3 bg-green-900/20 rounded-lg border border-green-600/30">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <MapPin className="w-5 h-5 text-green-400" />
                            <div>
                              <p className="text-white font-medium">{file.file_name}</p>
                              <p className="text-gray-400 text-sm">
                                Subido: {new Date(file.created_at).toLocaleDateString('es-ES')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => window.open(file.file_url, '_blank')}
                              className="flex items-center space-x-2 px-3 py-1 bg-green-600/20 text-green-400 border border-green-600/30 rounded-lg hover:bg-green-600/30 transition-colors"
                            >
                              <Download className="w-4 h-4" />
                              <span className="text-sm font-medium">Descargar</span>
                            </button>
                            <button
                              onClick={() => confirmDelete(file.id)}
                              disabled={deletingFile[file.id]}
                              className="flex items-center space-x-2 px-3 py-1 bg-red-600/20 text-red-400 border border-red-600/30 rounded-lg hover:bg-red-600/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span className="text-sm font-medium">
                                {deletingFile[file.id] ? 'Eliminando...' : 'Eliminar'}
                              </span>
                            </button>
                          </div>
                        </div>
                        
                        {/* Comentarios editables */}
                        <div className="mt-3">
                          <label className="text-gray-400 text-sm font-medium">Comentarios del Admin:</label>
                          {editingComments[file.id] ? (
                            <div className="mt-2 space-y-2">
                              <textarea
                                value={tempComments[file.id] || ''}
                                onChange={(e) => setTempComments(prev => ({ ...prev, [file.id]: e.target.value }))}
                                className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                                rows={3}
                                placeholder="Añadir comentarios sobre este mapa..."
                              />
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => saveComment(file.id, 'order_files')}
                                  className="px-3 py-1 bg-green-600/20 text-green-400 border border-green-600/30 rounded-lg hover:bg-green-600/30 transition-colors text-sm"
                                >
                                  Guardar
                                </button>
                                <button
                                  onClick={() => cancelEditingComment(file.id)}
                                  className="px-3 py-1 bg-gray-600/20 text-gray-400 border border-gray-600/30 rounded-lg hover:bg-gray-600/30 transition-colors text-sm"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-2">
                              <div className="flex items-center justify-between">
                                <p className="text-gray-300 text-sm">
                                  {file.admin_comments || 'Sin comentarios'}
                                </p>
                                <button
                                  onClick={() => startEditingComment(file.id, file.admin_comments || '')}
                                  className="text-primary hover:text-primary/80 text-sm font-medium"
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
                                <p className="text-red-400 font-medium text-sm">¿Eliminar este mapa?</p>
                                <p className="text-gray-300 text-xs mt-1">
                                  Esta acción no se puede deshacer. El archivo se eliminará permanentemente.
                                </p>
                                <div className="flex space-x-2 mt-3">
                                  <button
                                    onClick={() => deleteFile(file.id, 'order_files')}
                                    disabled={deletingFile[file.id]}
                                    className="px-3 py-1 bg-red-600/20 text-red-400 border border-red-600/30 rounded-lg hover:bg-red-600/30 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {deletingFile[file.id] ? 'Eliminando...' : 'Confirmar'}
                                  </button>
                                  <button
                                    onClick={() => cancelDelete(file.id)}
                                    className="px-3 py-1 bg-gray-600/20 text-gray-400 border border-gray-600/30 rounded-lg hover:bg-gray-600/30 transition-colors text-sm font-medium"
                                  >
                                    Cancelar
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
                  <div className="flex items-center justify-center p-6 bg-gray-700/30 rounded-lg border border-gray-600/30 border-dashed">
                    <div className="text-center">
                      <MapPin className="w-12 h-12 text-gray-500 mx-auto mb-2" />
                      <p className="text-gray-400 font-medium">No hay mapas tuneados</p>
                      <p className="text-gray-500 text-sm">Aún no se han subido mapas tuneados</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Facturas subidas por admin */}
              <div className="mb-6">
                <h3 className="text-white font-medium mb-3">Facturas (Admin)</h3>
                {order.invoices && order.invoices.length > 0 ? (
                  <div className="space-y-3">
                    {order.invoices.map((invoice) => (
                      <div key={invoice.id} className="p-3 bg-blue-900/20 rounded-lg border border-blue-600/30">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <CreditCard className="w-5 h-5 text-blue-400" />
                            <div>
                              <p className="text-white font-medium">{invoice.file_name}</p>
                              <p className="text-gray-400 text-sm">
                                Subido: {new Date(invoice.created_at).toLocaleDateString('es-ES')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => window.open(invoice.file_url, '_blank')}
                              className="flex items-center space-x-2 px-3 py-1 bg-blue-600/20 text-blue-400 border border-blue-600/30 rounded-lg hover:bg-blue-600/30 transition-colors"
                            >
                              <Download className="w-4 h-4" />
                              <span className="text-sm font-medium">Descargar</span>
                            </button>
                            <button
                              onClick={() => confirmDelete(invoice.id)}
                              disabled={deletingFile[invoice.id]}
                              className="flex items-center space-x-2 px-3 py-1 bg-red-600/20 text-red-400 border border-red-600/30 rounded-lg hover:bg-red-600/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span className="text-sm font-medium">
                                {deletingFile[invoice.id] ? 'Eliminando...' : 'Eliminar'}
                              </span>
                            </button>
                          </div>
                        </div>
                        
                        {/* Comentarios editables */}
                        <div className="mt-3">
                          <label className="text-gray-400 text-sm font-medium">Comentarios del Admin:</label>
                          {editingComments[invoice.id] ? (
                            <div className="mt-2 space-y-2">
                              <textarea
                                value={tempComments[invoice.id] || ''}
                                onChange={(e) => setTempComments(prev => ({ ...prev, [invoice.id]: e.target.value }))}
                                className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                                rows={3}
                                placeholder="Añadir comentarios sobre esta factura..."
                              />
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => saveComment(invoice.id, 'invoices')}
                                  className="px-3 py-1 bg-blue-600/20 text-blue-400 border border-blue-600/30 rounded-lg hover:bg-blue-600/30 transition-colors text-sm"
                                >
                                  Guardar
                                </button>
                                <button
                                  onClick={() => cancelEditingComment(invoice.id)}
                                  className="px-3 py-1 bg-gray-600/20 text-gray-400 border border-gray-600/30 rounded-lg hover:bg-gray-600/30 transition-colors text-sm"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-2">
                              <div className="flex items-center justify-between">
                                <p className="text-gray-300 text-sm">
                                  {invoice.admin_comments || 'Sin comentarios'}
                                </p>
                                <button
                                  onClick={() => startEditingComment(invoice.id, invoice.admin_comments || '')}
                                  className="text-primary hover:text-primary/80 text-sm font-medium"
                                >
                                  Editar
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Diálogo de confirmación de eliminación */}
                        {showDeleteConfirm[invoice.id] && (
                          <div className="mt-3 p-3 bg-red-900/30 border border-red-600/50 rounded-lg">
                            <div className="flex items-start space-x-3">
                              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-red-400 font-medium text-sm">¿Eliminar esta factura?</p>
                                <p className="text-gray-300 text-xs mt-1">
                                  Esta acción no se puede deshacer. El archivo se eliminará permanentemente.
                                </p>
                                <div className="flex space-x-2 mt-3">
                                  <button
                                    onClick={() => deleteFile(invoice.id, 'invoices')}
                                    disabled={deletingFile[invoice.id]}
                                    className="px-3 py-1 bg-red-600/20 text-red-400 border border-red-600/30 rounded-lg hover:bg-red-600/30 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {deletingFile[invoice.id] ? 'Eliminando...' : 'Confirmar'}
                                  </button>
                                  <button
                                    onClick={() => cancelDelete(invoice.id)}
                                    className="px-3 py-1 bg-gray-600/20 text-gray-400 border border-gray-600/30 rounded-lg hover:bg-gray-600/30 transition-colors text-sm font-medium"
                                  >
                                    Cancelar
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
                  <div className="flex items-center justify-center p-6 bg-gray-700/30 rounded-lg border border-gray-600/30 border-dashed">
                    <div className="text-center">
                      <CreditCard className="w-12 h-12 text-gray-500 mx-auto mb-2" />
                      <p className="text-gray-400 font-medium">No hay facturas</p>
                      <p className="text-gray-500 text-sm">Aún no se han subido facturas</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Subir mapa tuneado */}
              <div className="mb-6">
                <h3 className="text-white font-medium mb-3">Subir Mapa Tuneado</h3>
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-6">
                  <div className="space-y-4">
                    <textarea
                      value={mapComment}
                      onChange={(e) => setMapComment(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                      rows={3}
                      placeholder="Comentarios sobre el mapa tuneado..."
                    />
                    
                    <div className="text-center">
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="map-upload"
                        accept=".bin,.hex,.a2l,.ols"
                      />
                      <label
                        htmlFor="map-upload"
                        className="cursor-pointer flex flex-col items-center space-y-3"
                      >
                        <Upload className="w-8 h-8 text-gray-400" />
                        <div>
                          <p className="text-white font-medium">Subir mapa tuneado</p>
                          <p className="text-gray-400 text-sm">BIN, HEX, A2L, OLS</p>
                        </div>
                      </label>
                    </div>
                    
                    {uploading && (
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                        <p className="text-gray-400 text-sm mt-2">Subiendo mapa...</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Subir factura */}
              <div>
                <h3 className="text-white font-medium mb-3">Subir Factura</h3>
                <div className="border-2 border-dashed border-blue-600/30 rounded-lg p-6">
                  <div className="space-y-4">
                    <textarea
                      value={invoiceComment}
                      onChange={(e) => setInvoiceComment(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                      rows={3}
                      placeholder="Comentarios sobre la factura..."
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
                        className="cursor-pointer flex flex-col items-center space-y-3"
                      >
                        <CreditCard className="w-8 h-8 text-blue-400" />
                        <div>
                          <p className="text-white font-medium">Subir factura</p>
                          <p className="text-gray-400 text-sm">PDF, JPG, PNG, DOC</p>
                        </div>
                      </label>
                    </div>
                    
                    {uploadingInvoice && (
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                        <p className="text-gray-400 text-sm mt-2">Subiendo factura...</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Estado del Pedido */}
            <div className="relative bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 z-10">
              <h2 className="text-xl font-bold text-white mb-6">Estado del Pedido</h2>
              <div className="relative">
                <button
                  onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-colors ${
                    isStatusDropdownOpen 
                      ? 'bg-gray-700 border-primary/50' 
                      : 'bg-gray-700/50 border-gray-600 hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(order.status)}
                    <span className={`font-semibold ${
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
                        className={`w-full flex items-center space-x-2 px-4 py-3 text-left hover:bg-gray-700 transition-colors first:rounded-t-xl last:rounded-b-xl ${
                          order.status === status ? 'bg-gray-700' : ''
                        }`}
                      >
                        {getStatusIcon(status)}
                        <span className={`font-medium ${
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
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-6">Resumen</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Fecha de pedido:</span>
                  <span className="text-white font-medium">{formatDate(order.created_at)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Última actualización:</span>
                  <span className="text-white font-medium">{formatDate(order.updated_at)}</span>
                </div>
                <div className="border-t border-gray-600 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-bold text-lg">Total:</span>
                    <span className="text-primary font-bold text-2xl">€{parseFloat(order.total_price?.toString() || '0').toFixed(2)}</span>
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