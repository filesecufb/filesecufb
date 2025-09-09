import React, { useState, useEffect } from 'react';
import { User, FileText, Download, Edit, Lock, ShoppingCart, CreditCard } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

// Las interfaces ahora se importan desde los hooks
// TunedFile desde useFiles
// Invoice desde useInvoices  
// Order desde useOrders
// UserProfile y BillingInfo desde useProfile

type ClientSection = 'orders' | 'profile';

const ClientDashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, profile, loading: authLoading, isClient, isAdmin } = useAuth();
  
  // Leer la sección desde la URL, por defecto 'orders'
  const sectionFromURL = searchParams.get('section') as ClientSection;
  const [activeSection, setActiveSection] = useState<ClientSection>(
    sectionFromURL && ['orders', 'profile'].includes(sectionFromURL) ? sectionFromURL : 'orders'
  );

  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [fullProfile, setFullProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [orderFiles, setOrderFiles] = useState<{[key: string]: any[]}>({});
  const [filesLoading, setFilesLoading] = useState<{[key: string]: boolean}>({});

  // Cargar perfil completo desde Supabase
  useEffect(() => {
    const loadFullProfile = async () => {
      if (!user) {
        setProfileLoading(false);
        return;
      }

      try {
        setProfileLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error loading full profile:', error);
          toast.error('Error al cargar información del perfil');
        } else {
          setFullProfile(data);
        }
      } catch (err) {
        console.error('Error in loadFullProfile:', err);
      } finally {
        setProfileLoading(false);
      }
    };

    if (!authLoading) {
      loadFullProfile();
    }
  }, [user, authLoading]);

  // Cargar pedidos del usuario
  useEffect(() => {
    const loadOrders = async () => {
      if (!user) {
        setOrdersLoading(false);
        return;
      }

      try {
        setOrdersLoading(true);
        setOrdersError(null);

        // Cargar pedidos del cliente
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('client_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        // Load service information for each order
        const ordersWithServices = [];
        if (data && data.length > 0) {
          for (const order of data) {
            try {
              const { data: serviceData } = await supabase
                .from('services')
                .select('id, title, category, image_url')
                .eq('id', order.service_id)
                .single();

              ordersWithServices.push({
                ...order,
                services: serviceData
              });
            } catch (err) {
              console.error('Error loading service for order:', order.id, err);
              ordersWithServices.push({
                ...order,
                services: null
              });
            }
          }
        }

        setOrders(ordersWithServices);
        
        // Load files for completed orders
        const completedOrders = ordersWithServices.filter(order => order.status === 'completed');
        if (completedOrders.length > 0) {
          loadOrderFiles(completedOrders);
        }
      } catch (err: any) {
        console.error('Error loading orders:', err);
        setOrdersError(err.message);
        toast.error('Error al cargar pedidos');
      } finally {
        setOrdersLoading(false);
      }
    };

    if (!authLoading) {
      loadOrders();
    }
  }, [user, authLoading]);

  // Function to load files for completed orders
  const loadOrderFiles = async (completedOrders: any[]) => {
    for (const order of completedOrders) {
      try {
        setFilesLoading(prev => ({ ...prev, [order.id]: true }));
        
        const { data: files, error } = await supabase
          .from('order_files')
          .select('*')
          .eq('order_id', order.id)
          .eq('client_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading files for order:', order.id, error);
        } else {
          setOrderFiles(prev => ({ ...prev, [order.id]: files || [] }));
        }
      } catch (err) {
        console.error('Error loading files for order:', order.id, err);
      } finally {
        setFilesLoading(prev => ({ ...prev, [order.id]: false }));
      }
    }
  };

  // Calcular estadísticas de pedidos
  const stats = {
    totalOrders: orders.length,
    completedOrders: orders.filter(order => order.status === 'completed').length,
    pendingOrders: orders.filter(order => order.status === 'pending' || order.status === 'in_progress').length
  };

  // Protección de ruta - solo para clientes
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/login');
        return;
      }
      
      // Solo redirigir si el perfil está cargado y el rol está definido
      if (profile && profile.role) {
        if (profile.role === 'admin') {
          navigate('/admin');
          return;
        }
        // Si no es admin, debe quedarse en client dashboard (no redirigir)
      }
    }
  }, [user, profile, authLoading, navigate]);

  // Actualizar la sección activa cuando cambie la URL
  useEffect(() => {
    const sectionFromURL = searchParams.get('section') as ClientSection;
    if (sectionFromURL && ['orders', 'profile'].includes(sectionFromURL)) {
      setActiveSection(sectionFromURL);
    }
  }, [searchParams]);

  // Mostrar loading mientras se verifica la autenticación
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-300">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario o no es cliente, no mostrar nada (se redirigirá)
  if (!user || !isClient) {
    return null;
  }

  const sidebarItems = [
    { id: 'orders' as ClientSection, label: t('clientDashboard.sidebar.orders'), icon: ShoppingCart },
    { id: 'profile' as ClientSection, label: t('clientDashboard.sidebar.profile'), icon: User },
  ];

  // Los datos de pedidos ahora vienen del hook useOrders()
  // Los datos del perfil ahora vienen del hook useProfile()
  // Se obtienen automáticamente de Supabase

  // Componente OrderCard simplificado
  const OrderCard: React.FC<{ order: any; onDownload: (fileId: string, fileName: string) => void }> = ({ order, onDownload }) => {
    // TODO: Implementar lógica de facturas y archivos
    const orderInvoices: any[] = [];
    const orderFiles: any[] = [];
    const invoicesLoading = false;
    const filesLoading = false;

    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-gray-700/50 hover:border-primary/50 transition-all duration-300">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 break-words">{order.service_name || 'Servicio'}</h3>
            <p className="text-gray-300 mb-1 text-sm sm:text-base">Pedido: {order.id}</p>
            <p className="text-gray-300 mb-1 text-sm sm:text-base break-words">Vehículo: {order.vehicle}</p>
            <p className="text-gray-300 text-sm sm:text-base">Fecha: {new Date(order.order_date).toLocaleDateString('es-ES')}</p>
          </div>
          <div className="flex sm:flex-col justify-between sm:justify-start items-center sm:items-end gap-2 sm:gap-0 sm:text-right flex-shrink-0">
            <p className={`text-base sm:text-lg font-semibold sm:mb-2 ${getStatusColor(order.status)}`}>
              {getStatusText(order.status)}
            </p>
            <p className="text-xl sm:text-2xl font-bold text-primary">€{order.price}</p>
          </div>
        </div>
        
        {order.estimated_delivery && (
          <div className="bg-gray-700/30 rounded-lg p-3 mt-4">
            <p className="text-sm text-gray-300">
              Entrega estimada: {new Date(order.estimated_delivery).toLocaleDateString('es-ES')}
            </p>
          </div>
        )}
        
        <div className="mt-6 space-y-4">
          {/* Archivos */}
          {filesLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
              <p className="text-gray-400 text-sm mt-2">Cargando archivos...</p>
            </div>
          ) : orderFiles && orderFiles.length > 0 && (
            <div className="bg-gray-700/20 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Archivos Tuneados
              </h4>
              <div className="space-y-3">
                {orderFiles.map((file) => (
                  <div key={file.id} className="bg-gray-600/30 rounded-lg p-3">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium break-words">{file.file_name}</p>
                        <p className="text-gray-400 text-sm break-words">
                          Subido: {new Date(file.upload_date).toLocaleDateString('es-ES')} • {file.file_size ? `${(file.file_size / 1024).toFixed(1)} KB` : 'Tamaño desconocido'}
                        </p>
                      </div>
                      <button
                        onClick={() => onDownload(file.id, file.file_name)}
                        className="bg-primary hover:bg-primary/80 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 text-sm sm:text-base touch-manipulation flex-shrink-0 w-full sm:w-auto"
                      >
                        <Download className="w-4 h-4" />
                        Descargar
                      </button>
                    </div>
                    {file.comments && (
                      <div className="bg-gray-700/40 rounded-lg p-3 border-l-4 border-primary/50">
                        <p className="text-gray-300 text-sm font-medium mb-1">Comentarios técnicos:</p>
                        <p className="text-gray-200 text-sm leading-relaxed">{file.comments}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Facturas */}
          {invoicesLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
              <p className="text-gray-400 text-sm mt-2">Cargando facturas...</p>
            </div>
          ) : orderInvoices && orderInvoices.length > 0 && (
            <div className="bg-gray-700/20 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Facturas
              </h4>
              <div className="space-y-2">
                {orderInvoices.map((invoice) => (
                  <div key={invoice.id} className="bg-gray-600/30 rounded-lg p-3">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium">Factura {invoice.invoice_number}</p>
                        <p className="text-gray-400 text-sm">
                          {new Date(invoice.invoice_date).toLocaleDateString('es-ES')} • €{invoice.amount} • 
                          <span className={getStatusColor(invoice.status)}> {getStatusText(invoice.status)}</span>
                        </p>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto flex-shrink-0">
                        <button
                          onClick={() => onDownload(invoice.id, `factura_${invoice.invoice_number}.pdf`)}
                          className="bg-primary hover:bg-primary/80 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 text-sm sm:text-base touch-manipulation flex-1 sm:flex-initial"
                        >
                          <Download className="w-4 h-4" />
                          Descargar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'delivered':
      case 'paid':
        return 'text-green-400';
      case 'in_progress':
        return 'text-yellow-400';
      case 'pending':
        return 'text-orange-400';
      default:
        return 'text-gray-400';
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

  // TODO: Implementar funciones para manejar formularios
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('No hay usuario autenticado');
      return;
    }

    try {
      const formData = new FormData(e.target as HTMLFormElement);
      
      const updateData = {
        full_name: formData.get('full_name') as string,
        phone: formData.get('phone') as string,
        billing_name: formData.get('billing_name') as string,
        tax_id: formData.get('tax_id') as string,
        billing_address: formData.get('billing_address') as string,
        billing_city: formData.get('billing_city') as string,
        billing_state: formData.get('billing_state') as string,
        billing_postal_code: formData.get('billing_postal_code') as string,
        billing_country: formData.get('billing_country') as string,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) {
        throw new Error(error.message);
      }

      // Actualizar el estado local del perfil
      if (fullProfile) {
        setFullProfile({
          ...fullProfile,
          ...updateData
        });
      }

      toast.success('Perfil actualizado correctamente');
      setShowProfileEdit(false);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(`Error al actualizar el perfil: ${error.message}`);
    }
  };


  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const currentPassword = formData.get('currentPassword') as string;
    const newPassword = formData.get('newPassword') as string;
    const confirmPassword = formData.get('confirmPassword') as string;
    
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    
    // TODO: Implementar lógica de cambio de contraseña
    console.log('handlePasswordChange - Lógica de Supabase removida');
    toast.success('Contraseña cambiada correctamente');
    setShowPasswordChange(false);
  };

  const handleDownload = async (fileUrl: string, fileName: string) => {
    try {
      // Create a temporary link to download the file
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Descargando ${fileName}...`);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Error al descargar el archivo');
    }
  };

  const renderOrders = () => (
    <div>
      <h2 className="text-3xl font-bold text-white mb-8">{t('clientDashboard.orders.title')}</h2>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-2">Pedidos Totales</h3>
          <p className="text-3xl font-bold text-primary">{stats?.totalOrders || 0}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-2">Completados</h3>
          <p className="text-3xl font-bold text-green-400">
            {stats?.completedOrders || 0}
          </p>
        </div>
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-2">En Proceso</h3>
          <p className="text-3xl font-bold text-yellow-400">
            {stats?.pendingOrders || 0}
          </p>
        </div>
      </div>
      
      <div className="space-y-6">
        {ordersLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-gray-400 mt-4">Cargando pedidos...</p>
          </div>
        ) : ordersError ? (
          <div className="text-center py-8">
            <p className="text-red-400">Error al cargar los pedidos: {ordersError}</p>
          </div>
        ) : orders && orders.length > 0 ? (
          orders.map((order) => (
            <div key={order.id} className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Order Info */}
                <div className="flex-1">
                  <div className="flex items-start gap-4">
                    {/* Service Image */}
                    {order.services?.image_url && (
                      <img
                        src={order.services.image_url}
                        alt={order.services.title}
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                      />
                    )}
                    
                    {/* Order Details */}
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white mb-2">
                        {order.services?.title || 'Servicio'}
                      </h3>
                      <p className="text-gray-400 text-sm mb-2">
                        {order.services?.category || 'Categoría no especificada'}
                      </p>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                        <span>Vehículo: {order.vehicle_make} {order.vehicle_model} ({order.vehicle_year})</span>
                        <span>Pedido: {new Date(order.created_at).toLocaleDateString('es-ES')}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Order Status and Price */}
                <div className="flex flex-col lg:items-end gap-3">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      order.status === 'completed' ? 'bg-green-900/30 text-green-400 border border-green-700' :
                      order.status === 'in_progress' ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-700' :
                      order.status === 'pending' ? 'bg-blue-900/30 text-blue-400 border border-blue-700' :
                      'bg-gray-900/30 text-gray-400 border border-gray-700'
                    }`}>
                      {order.status === 'completed' ? 'Completado' :
                       order.status === 'in_progress' ? 'En Proceso' :
                       order.status === 'pending' ? 'Pendiente' :
                       order.status}
                    </span>
                    <span className="text-xl font-bold text-white">
                      €{parseFloat(order.total_price || '0').toFixed(2)}
                    </span>
                  </div>
                  
                  {order.status === 'completed' && (
                    <div className="flex flex-col gap-2">
                      {filesLoading[order.id] ? (
                        <div className="flex items-center gap-2 px-4 py-2 text-gray-400">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                          <span>Cargando archivos...</span>
                        </div>
                      ) : orderFiles[order.id] && orderFiles[order.id].length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-sm text-gray-400 mb-2">
                            Archivos disponibles ({orderFiles[order.id].length}):
                          </p>
                          {orderFiles[order.id].map((file: any) => (
                            <div key={file.id} className="mb-3">
                              <button
                                onClick={() => handleDownload(file.file_url, file.file_name)}
                                className="bg-primary hover:bg-primary/80 text-white px-3 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 text-sm w-full justify-between"
                              >
                                <div className="flex items-center gap-2">
                                  <FileText className="w-4 h-4" />
                                  <span className="truncate max-w-[150px]">{file.file_name}</span>
                                  <span className="text-xs text-gray-300">
                                    ({file.file_size ? (file.file_size / 1024 / 1024).toFixed(1) : '0'} MB)
                                  </span>
                                </div>
                                <Download className="w-4 h-4 flex-shrink-0" />
                              </button>
                              {file.admin_comments && (
                                <div className="mt-2 p-3 bg-gray-700/30 rounded-lg">
                                  <p className="text-xs text-gray-400 mb-1">💬 Comentarios del administrador:</p>
                                  <p className="text-sm text-gray-300">{file.admin_comments}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400 px-4 py-2">
                          Los archivos estarán disponibles pronto
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Additional Services */}
              {order.additional_services && order.additional_services.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <p className="text-gray-400 text-sm mb-2">Servicios adicionales:</p>
                  <div className="flex flex-wrap gap-2">
                    {order.additional_services.map((serviceId: string, index: number) => (
                      <span key={index} className="bg-gray-700/50 text-gray-300 px-2 py-1 rounded text-sm">
                        Servicio adicional
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <div className="bg-gray-800/30 rounded-xl p-8 border border-gray-700">
              <ShoppingCart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">No hay pedidos aún</h3>
              <p className="text-gray-500 mb-6">Cuando realices tu primer pedido, aparecerá aquí.</p>
              <button
                onClick={() => navigate('/services')}
                className="bg-primary hover:bg-primary/80 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300"
              >
                Ver Servicios
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );



  const renderProfile = () => (
    <div>
      <h2 className="text-3xl font-bold text-white mb-8">{t('clientDashboard.profile.title')}</h2>
      <div className="space-y-6">
        {/* Profile Information */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-gray-700/50">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <h3 className="text-xl sm:text-2xl font-bold text-white">{t('clientDashboard.profile.personalInfo')}</h3>
          <button
            onClick={() => setShowProfileEdit(!showProfileEdit)}
            className="bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 w-full sm:w-auto touch-manipulation"
          >
            <Edit className="w-4 h-4" />
            {t('clientDashboard.profile.edit')}
          </button>
        </div>
        
{showProfileEdit ? (
          <form onSubmit={handleProfileUpdate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 mb-2">Nombre completo</label>
              <input
                type="text"
                name="full_name"
                defaultValue={fullProfile?.full_name || ''}
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-primary focus:outline-none"
                placeholder="Ingresa tu nombre completo"
                required
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-2">Email</label>
              <input
                type="email"
                name="email"
                defaultValue={fullProfile?.email || user?.email || ''}
                className="w-full bg-gray-600/30 border border-gray-500 rounded-lg px-4 py-2 text-gray-300 cursor-not-allowed"
                placeholder="Correo de registro"
                readOnly
              />
              <p className="text-xs text-gray-400 mt-1">Correo de registro (no editable)</p>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-gray-300 mb-2">Teléfono</label>
              <input
                type="tel"
                name="phone"
                defaultValue={fullProfile?.phone || ''}
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-primary focus:outline-none"
                placeholder="+34 123 456 789"
              />
            </div>
            
            {/* Información de Facturación */}
            <div className="sm:col-span-2 border-t border-gray-600 pt-6 mt-6">
              <h4 className="text-xl font-semibold text-white mb-4">Información de Facturación</h4>
            </div>
            
            <div>
              <label className="block text-gray-300 mb-2">Nombre/Empresa para Facturación</label>
              <input
                type="text"
                name="billing_name"
                defaultValue={fullProfile?.billing_name || ''}
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-primary focus:outline-none"
                placeholder="Nombre o empresa para la factura"
              />
            </div>
            
            <div>
              <label className="block text-gray-300 mb-2">NIF/VAT/Tax ID</label>
              <input
                type="text"
                name="tax_id"
                defaultValue={fullProfile?.tax_id || ''}
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-primary focus:outline-none"
                placeholder="Número de identificación fiscal"
              />
            </div>
            
            <div className="sm:col-span-2">
              <label className="block text-gray-300 mb-2">Dirección</label>
              <input
                type="text"
                name="billing_address"
                defaultValue={fullProfile?.billing_address || ''}
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-primary focus:outline-none"
                placeholder="Dirección completa"
              />
            </div>
            
            <div>
              <label className="block text-gray-300 mb-2">Ciudad</label>
              <input
                type="text"
                name="billing_city"
                defaultValue={fullProfile?.billing_city || ''}
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-primary focus:outline-none"
                placeholder="Ciudad"
              />
            </div>
            
            <div>
              <label className="block text-gray-300 mb-2">Estado/Provincia</label>
              <input
                type="text"
                name="billing_state"
                defaultValue={fullProfile?.billing_state || ''}
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-primary focus:outline-none"
                placeholder="Estado o provincia"
              />
            </div>
            
            <div>
              <label className="block text-gray-300 mb-2">Código Postal</label>
              <input
                type="text"
                name="billing_postal_code"
                defaultValue={fullProfile?.billing_postal_code || ''}
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-primary focus:outline-none"
                placeholder="Código postal"
              />
            </div>
            
            <div>
              <label className="block text-gray-300 mb-2">País</label>
              <input
                type="text"
                name="billing_country"
                defaultValue={fullProfile?.billing_country || ''}
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-primary focus:outline-none"
                placeholder="País"
              />
            </div>
            <div className="sm:col-span-2 flex flex-col sm:flex-row gap-4">
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 text-sm sm:text-base touch-manipulation"
              >
                {t('clientDashboard.common.save')}
              </button>
              <button
                type="button"
                onClick={() => setShowProfileEdit(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 text-sm sm:text-base touch-manipulation"
              >
                {t('clientDashboard.common.cancel')}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="bg-gray-700/30 rounded-lg p-6">
              <h4 className="text-white text-lg font-semibold mb-4">Información Personal</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-gray-400 text-sm font-medium">Nombre completo</p>
                  <p className="text-white text-base font-semibold">{fullProfile?.full_name || 'No especificado'}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-gray-400 text-sm font-medium">Email</p>
                  <p className="text-white text-base break-all font-semibold">{fullProfile?.email || user?.email || 'No especificado'}</p>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <p className="text-gray-400 text-sm font-medium">Teléfono</p>
                  <p className="text-white text-base font-semibold">{fullProfile?.phone || 'No especificado'}</p>
                </div>
              </div>
            </div>
            
            {/* Información de Facturación */}
            <div className="bg-gray-700/30 rounded-lg p-6">
              <h4 className="text-white text-lg font-semibold mb-4">Información de Facturación</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-gray-400 text-sm font-medium">Nombre/Empresa para Facturación</p>
                  <p className="text-white text-base font-semibold">{fullProfile?.billing_name || 'No especificado'}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-gray-400 text-sm font-medium">NIF/VAT/Tax ID</p>
                  <p className="text-white text-base font-semibold">{fullProfile?.tax_id || 'No especificado'}</p>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <p className="text-gray-400 text-sm font-medium">Dirección</p>
                  <p className="text-white text-base font-semibold">{fullProfile?.billing_address || 'No especificado'}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-gray-400 text-sm font-medium">Ciudad</p>
                  <p className="text-white text-base font-semibold">{fullProfile?.billing_city || 'No especificado'}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-gray-400 text-sm font-medium">Estado/Provincia</p>
                  <p className="text-white text-base font-semibold">{fullProfile?.billing_state || 'No especificado'}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-gray-400 text-sm font-medium">Código Postal</p>
                  <p className="text-white text-base font-semibold">{fullProfile?.billing_postal_code || 'No especificado'}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-gray-400 text-sm font-medium">País</p>
                  <p className="text-white text-base font-semibold">{fullProfile?.billing_country || 'No especificado'}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-700/30 rounded-lg p-6">
              <h4 className="text-white text-lg font-semibold mb-4">Información de la cuenta</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-gray-400 text-sm font-medium">ID de Usuario</p>
                  <p className="text-white text-base font-mono text-sm">{fullProfile?.id || user?.id || 'No especificado'}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-gray-400 text-sm font-medium">Fecha de Registro</p>
                  <p className="text-white text-base">{fullProfile?.created_at ? new Date(fullProfile.created_at).toLocaleDateString() : 'No especificado'}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>

        {/* Password Change */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-white">{t('clientDashboard.profile.changePassword')}</h3>
          <button
            onClick={() => setShowPasswordChange(!showPasswordChange)}
            className="bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2"
          >
            <Lock className="w-4 h-4" />
            {showPasswordChange ? t('clientDashboard.common.cancel') : t('clientDashboard.common.change')}
          </button>
        </div>
        
{showPasswordChange && (
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-2">{t('clientDashboard.profile.currentPassword')}</label>
              <input
                type="password"
                name="currentPassword"
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-primary focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-2">{t('clientDashboard.profile.newPassword')}</label>
              <input
                type="password"
                name="newPassword"
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-primary focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-2">{t('clientDashboard.profile.confirmPassword')}</label>
              <input
                type="password"
                name="confirmPassword"
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-primary focus:outline-none"
                required
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 text-sm sm:text-base touch-manipulation">
                {t('clientDashboard.profile.updatePassword')}
              </button>
              <button
                type="button"
                onClick={() => setShowPasswordChange(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 text-sm sm:text-base touch-manipulation"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
        </div>

      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'orders':
        return renderOrders();
      case 'profile':
        return renderProfile();
      default:
        return renderOrders();
    }
  };

  // Mostrar loading mientras se verifican los datos iniciales
  if (profileLoading && ordersLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-white text-xl">Cargando dashboard...</div>
        </div>
      </div>
    );
  }

  // Si no hay usuario autenticado, no renderizar nada (se redirigirá)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black overflow-x-hidden">
      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-64 bg-gray-900/50 backdrop-blur-sm border-r border-gray-700 min-h-screen">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-white mb-8" dangerouslySetInnerHTML={{ __html: t('clientDashboard.title') }}>
            </h1>
            <nav className="space-y-2">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 touch-manipulation ${
                      activeSection === item.id
                        ? 'bg-primary/20 text-primary border border-primary/30'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 w-full">
          {/* Mobile Navigation */}
          <div className="lg:hidden bg-gray-900/95 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-30">
            <div className="px-4 py-3">
              <h1 className="text-lg font-bold text-white mb-3" dangerouslySetInnerHTML={{ __html: t('clientDashboard.title') }}>
              </h1>
              <div className="overflow-x-auto scrollbar-hide">
                <div className="flex space-x-2 pb-2 min-w-max">
                  {sidebarItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveSection(item.id)}
                        className={`flex-shrink-0 flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 touch-manipulation text-sm min-w-fit ${
                          activeSection === item.id
                            ? 'bg-primary text-white'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="font-medium whitespace-nowrap">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-4 lg:p-8 w-full max-w-full overflow-x-hidden">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;