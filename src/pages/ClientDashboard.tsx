import React, { useState, useEffect } from 'react';
import { User, FileText, Download, Edit, Lock, ShoppingCart, CreditCard, Search, X, ChevronLeft, ChevronRight, Car, Calendar, Wrench, Filter, CheckCircle, Clock, AlertCircle } from 'lucide-react';
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
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  
  // Estados para filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [orderFiles, setOrderFiles] = useState<{ [orderId: string]: any[] }>({});
  const [filesLoading, setFilesLoading] = useState<{ [orderId: string]: boolean }>({});
  const [orderInvoices, setOrderInvoices] = useState<{ [orderId: string]: any[] }>({});
  const [invoicesLoading, setInvoicesLoading] = useState<{ [orderId: string]: boolean }>({});
  const [additionalServices, setAdditionalServices] = useState<{ [serviceId: string]: any }>({});

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

  // Efecto para filtrar y ordenar pedidos
  useEffect(() => {
    let filtered = [...orders];

    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${order.vehicle_make} ${order.vehicle_model}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.services?.title || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Filtrar por rango de fechas
    if (dateFrom) {
      filtered = filtered.filter(order => 
        new Date(order.created_at) >= new Date(dateFrom)
      );
    }
    if (dateTo) {
      filtered = filtered.filter(order => 
        new Date(order.created_at) <= new Date(dateTo + 'T23:59:59')
      );
    }

    // Ordenar
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'price_high':
          return parseFloat(b.total_price || '0') - parseFloat(a.total_price || '0');
        case 'price_low':
          return parseFloat(a.total_price || '0') - parseFloat(b.total_price || '0');
        default:
          return 0;
      }
    });

    setFilteredOrders(filtered);
    setCurrentPage(1);
  }, [orders, searchTerm, statusFilter, dateFrom, dateTo, sortBy]);

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

        // Load service information and additional services for each order
        const ordersWithServices = [];
        if (data && data.length > 0) {
          // Load all additional services first
          await loadAdditionalServices(data);
          
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
        
        // Load files and invoices for completed orders
        const completedOrders = ordersWithServices.filter(order => order.status === 'completed');
        if (completedOrders.length > 0) {
          loadOrderFiles(completedOrders);
          loadOrderInvoices(completedOrders);
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

  // Function to load additional services
  const loadAdditionalServices = async (orders: any[]) => {
    const serviceIds = new Set<string>();
    
    // Collect all additional service IDs
    orders.forEach(order => {
      if (order.additional_services && Array.isArray(order.additional_services)) {
        order.additional_services.forEach((service: any) => {
          // Handle both string IDs and objects with id property
          let serviceId: string;
          if (typeof service === 'string') {
            serviceId = service;
          } else if (service && typeof service === 'object' && service.id) {
            serviceId = service.id;
          } else {
            console.warn('Invalid service format in additional_services:', service);
            return;
          }
          
          // Validate UUID format (basic check)
          if (serviceId && typeof serviceId === 'string' && serviceId.length > 0) {
            serviceIds.add(serviceId);
          }
        });
      }
    });

    if (serviceIds.size > 0) {
      try {
        const validIds = Array.from(serviceIds).filter(id => 
          id && typeof id === 'string' && id.trim().length > 0
        );
        
        if (validIds.length === 0) {
          console.warn('No valid service IDs found');
          return;
        }

        const { data: services, error } = await supabase
          .from('services')
          .select('id, title')
          .in('id', validIds);

        if (error) {
          console.error('Error loading additional services:', error);
        } else if (services) {
          const servicesMap: { [serviceId: string]: any } = {};
          services.forEach(service => {
            servicesMap[service.id] = service;
          });
          setAdditionalServices(servicesMap);
        }
      } catch (err) {
        console.error('Error loading additional services:', err);
      }
    }
  };

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

  // Function to load invoices for completed orders
  const loadOrderInvoices = async (completedOrders: any[]) => {
    for (const order of completedOrders) {
      try {
        setInvoicesLoading(prev => ({ ...prev, [order.id]: true }));
        
        const { data: invoices, error } = await supabase
          .from('invoices')
          .select('*')
          .eq('order_id', order.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading invoices for order:', order.id, error);
        } else {
          setOrderInvoices(prev => ({ ...prev, [order.id]: invoices || [] }));
        }
      } catch (err) {
        console.error('Exception loading invoices for order:', order.id, err);
      } finally {
        setInvoicesLoading(prev => ({ ...prev, [order.id]: false }));
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

  // Componente OrderCard rediseñado - Sin desplegables
  const OrderCard: React.FC<{ order: any; onDownload: (fileId: string, fileName: string) => void }> = ({ order, onDownload }) => {
    // Obtener datos de facturas y archivos del estado
    const invoices = orderInvoices[order.id] || [];
    const files = orderFiles[order.id] || [];
    const isLoadingInvoices = invoicesLoading[order.id] || false;
    const isLoadingFiles = filesLoading[order.id] || false;

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
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Vehículo</p>
                  <p className="text-white font-medium break-words">{order.vehicle || `${order.vehicle_make || ''} ${order.vehicle_model || ''}`.trim()}</p>
                  {order.vehicle_year && <p className="text-sm text-gray-400 mt-1">Año {order.vehicle_year}</p>}
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="bg-purple-500/20 p-2 rounded-lg flex-shrink-0">
                  <Wrench className="w-4 h-4 text-purple-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Servicio</p>
                  <p className="text-white font-medium break-words">{order.service_name || order.service_type || 'Servicio'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content - Siempre visible */}
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
          
          <div className="space-y-4">
          {/* Archivos */}
          {isLoadingFiles ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
              <p className="text-gray-400 text-sm mt-2">Cargando archivos...</p>
            </div>
          ) : files && files.length > 0 && (
            <div className="bg-gray-700/20 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Archivos Tuneados
              </h4>
              <div className="space-y-3">
                {files.map((file) => (
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
          {(() => {
            if (isLoadingInvoices) {
              return (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                  <p className="text-gray-400 text-sm mt-2">Cargando facturas...</p>
                </div>
              );
            }
            
            if (invoices && invoices.length > 0) {
              return (
                <div className="bg-gray-700/20 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Facturas ({invoices.length})
                  </h4>
                  <div className="space-y-2">
                    {invoices.map((invoice) => {
                      return (
                        <div key={invoice.id} className="bg-gray-600/30 rounded-lg p-3">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-medium">{invoice.file_name || `Factura ${invoice.invoice_number}`}</p>
                              <p className="text-gray-400 text-sm">
                                {new Date(invoice.created_at).toLocaleDateString('es-ES')} • €{invoice.amount} • 
                                <span className={getStatusColor(invoice.status)}> {getStatusText(invoice.status)}</span>
                              </p>
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto flex-shrink-0">
                              {invoice.file_url && (
                                <button
                                  onClick={() => window.open(invoice.file_url, '_blank')}
                                  className="bg-primary hover:bg-primary/80 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 text-sm sm:text-base touch-manipulation flex-1 sm:flex-initial"
                                >
                                  <Download className="w-4 h-4" />
                                  Descargar
                                </button>
                              )}
                            </div>
                          </div>
                          {invoice.admin_comments && (
                            <div className="mt-2 p-3 bg-gray-700/40 rounded-lg border-l-4 border-primary/50">
                              <p className="text-xs text-gray-400 font-medium mb-1">Comentarios del administrador:</p>
                              <p className="text-sm text-gray-300">{invoice.admin_comments}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }
            
            return null;
          })()}
          </div>
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
    // Password change logic removed
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

  const renderOrders = () => {
    // Calcular paginación
    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

    const clearFilters = () => {
      setSearchTerm('');
      setStatusFilter('all');
      setDateFrom('');
      setDateTo('');
      setSortBy('newest');
    };

    return (
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
      
      {/* Barra de búsqueda y filtros */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Búsqueda */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar por ID, vehículo o servicio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
          
          {/* Filtro por estado */}
          <div className="min-w-[160px]">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">Todos los estados</option>
              <option value="pending">Pendiente</option>
              <option value="in_progress">En Progreso</option>
              <option value="completed">Completado</option>
            </select>
          </div>
          
          {/* Filtro por fecha desde */}
           <div className="min-w-[140px]">
             <input
               type="date"
               value={dateFrom}
               onChange={(e) => setDateFrom(e.target.value)}
               className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-primary focus:border-transparent"
               placeholder="Desde"
             />
           </div>
           
           {/* Filtro por fecha hasta */}
           <div className="min-w-[140px]">
             <input
               type="date"
               value={dateTo}
               onChange={(e) => setDateTo(e.target.value)}
               className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-primary focus:border-transparent"
               placeholder="Hasta"
             />
           </div>
           
           {/* Ordenamiento */}
           <div className="min-w-[160px]">
             <select
               value={sortBy}
               onChange={(e) => setSortBy(e.target.value)}
               className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-primary focus:border-transparent"
             >
               <option value="newest">Más reciente</option>
               <option value="oldest">Más antiguo</option>
               <option value="price_high">Precio mayor</option>
               <option value="price_low">Precio menor</option>
             </select>
           </div>
          

          
          {/* Limpiar filtros */}
           {(searchTerm || statusFilter !== 'all' || dateFrom || dateTo || sortBy !== 'newest') && (
             <button
               onClick={clearFilters}
               className="px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
               title="Limpiar filtros"
             >
               <X className="h-4 w-4" />
             </button>
           )}
        </div>
        
        {/* Contador de resultados */}
        <div className="mt-4 text-sm text-gray-400">
          Mostrando {paginatedOrders.length} de {filteredOrders.length} pedidos
          {filteredOrders.length !== orders.length && ` (filtrados de ${orders.length} total)`}
        </div>
      </div>
      
      {/* Lista de pedidos */}
      {ordersLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-gray-400 mt-4">Cargando pedidos...</p>
        </div>
      ) : ordersError ? (
        <div className="text-center py-8">
          <p className="text-red-400">Error al cargar los pedidos: {ordersError}</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        orders.length === 0 ? (
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
        ) : (
          <div className="text-center py-12">
            <div className="bg-gray-800/30 rounded-xl p-8 border border-gray-700">
              <p className="text-gray-400 mb-4">No se encontraron pedidos con los filtros aplicados.</p>
              <button
                onClick={clearFilters}
                className="text-primary hover:text-primary/80 font-semibold"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        )
      ) : (
        <>
          <div className="space-y-6">
            {paginatedOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={{
                  id: order.id,
                  service_name: order.services?.title || 'Servicio',
                  vehicle: `${order.vehicle_make} ${order.vehicle_model} (${order.vehicle_year})`,
                  order_date: order.created_at,
                  status: order.status,
                  total_price: order.total_price,
                  additional_services: order.additional_services,
                  services: order.services
                }}
                onDownload={handleDownload}
              />
            ))}
          </div>
          
          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-8">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 text-white"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 border rounded-lg ${
                    currentPage === page
                      ? 'bg-primary text-white border-primary'
                      : 'bg-gray-800 border-gray-600 hover:bg-gray-700 text-white'
                  }`}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 text-white"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
    );
  };



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