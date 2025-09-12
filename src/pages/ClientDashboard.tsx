import React, { useState, useEffect } from 'react';
import { User, FileText, Download, Edit, Lock, ShoppingCart, CreditCard, Search, X, ChevronLeft, ChevronRight, Car, Calendar, Wrench, Filter, CheckCircle, Clock, AlertCircle, Eye, Printer } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import jsPDF from 'jspdf';

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
  const [adminFiles, setAdminFiles] = useState<{ [orderId: string]: any[] }>({});
  const [filesLoading, setFilesLoading] = useState<{ [orderId: string]: boolean }>({});
  const [adminFilesLoading, setAdminFilesLoading] = useState<{ [orderId: string]: boolean }>({});
  const [orderInvoices, setOrderInvoices] = useState<{ [orderId: string]: any[] }>({});
  const [invoicesLoading, setInvoicesLoading] = useState<{ [orderId: string]: boolean }>({});
  const [additionalServices, setAdditionalServices] = useState<{ [serviceId: string]: any }>({});
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<any>(null);

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
          toast.error(t('clientDashboard.messages.errors.loadingProfile'));
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



        // Cargar información del perfil del cliente por separado
        let clientProfile = null;
        if (data && data.length > 0) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id, full_name, email, phone, billing_address, billing_city, billing_postal_code, billing_country')
            .eq('id', user.id)
            .single();

          if (profileError) {
            console.warn('Error loading client profile:', profileError);
          } else {
            clientProfile = profileData;
          }
        }

        if (error) {
          throw error;
        }

        // Load service information and additional services for each order
        const ordersWithServices = [];
        if (data && data.length > 0) {
          // Load all additional services first
          const additionalServicesMap = await loadAdditionalServices(data);
          
          for (const order of data) {
            try {
              const { data: serviceData } = await supabase
                .from('services')
                .select('id, title, category, image_url')
                .eq('id', order.service_id)
                .single();

              // Process additional services details
              let additionalServicesDetails = [];
              if (order.additional_services && Array.isArray(order.additional_services)) {
                additionalServicesDetails = order.additional_services.map((service: any) => {
                  let serviceId: string;
                  if (typeof service === 'string') {
                    serviceId = service;
                  } else if (service && typeof service === 'object' && service.id) {
                    serviceId = service.id;
                  } else {
                    return null;
                  }
                  
                  const serviceDetails = additionalServicesMap[serviceId];
                  if (serviceDetails) {
                    return {
                      id: serviceDetails.id,
                      title: serviceDetails.title,
                      price: serviceDetails.price,
                      description: serviceDetails.description
                    };
                  }
                  return null;
                }).filter(Boolean);
              }

              ordersWithServices.push({
                ...order,
                services: serviceData,
                additional_services_details: additionalServicesDetails,
                profiles: clientProfile // Agregar información del perfil del cliente
              });
            } catch (err) {
              console.error('Error loading service for order:', order.id, err);
              ordersWithServices.push({
                ...order,
                services: null,
                additional_services_details: [],
                profiles: clientProfile // Agregar información del perfil del cliente
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
        toast.error(t('clientDashboard.messages.errors.loadingOrders'));
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
          return {};
        }

        const { data: services, error } = await supabase
          .from('services')
          .select('id, title, price, description')
          .in('id', validIds);

        if (error) {
          console.error('Error loading additional services:', error);
          return {};
        } else if (services) {
          const servicesMap: { [serviceId: string]: any } = {};
          services.forEach(service => {
            servicesMap[service.id] = service;
          });
          setAdditionalServices(servicesMap);
          return servicesMap;
        }
      } catch (err) {
        console.error('Error loading additional services:', err);
        return {};
      }
    }
    return {};
  };

  // Function to load files for completed orders
  const loadOrderFiles = async (completedOrders: any[]) => {
    for (const order of completedOrders) {
      try {
        // Load client files
        setFilesLoading(prev => ({ ...prev, [order.id]: true }));
        
        const { data: files, error } = await supabase
          .from('order_files')
          .select('*')
          .eq('order_id', order.id)
          .eq('client_id', user.id)
          .eq('uploaded_by', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading client files for order:', order.id, error);
        } else {
          setOrderFiles(prev => ({ ...prev, [order.id]: files || [] }));
        }

        // Load admin files
        setAdminFilesLoading(prev => ({ ...prev, [order.id]: true }));
        
        // Load admin files - need to get admin user IDs first
        const { data: adminProfiles, error: adminProfileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', 'admin');

        if (adminProfileError) {
          console.error('Error loading admin profiles:', adminProfileError);
          setAdminFiles(prev => ({ ...prev, [order.id]: [] }));
        } else {
          const adminIds = adminProfiles?.map(profile => profile.id) || [];
          
          const { data: adminFilesData, error: adminError } = await supabase
            .from('order_files')
            .select('*')
            .eq('order_id', order.id)
            .in('uploaded_by', adminIds)
            .order('created_at', { ascending: false });

          if (adminError) {
             console.error('Error loading admin files for order:', order.id, adminError);
           } else {
             setAdminFiles(prev => ({ ...prev, [order.id]: adminFilesData || [] }));
           }
         }
      } catch (err) {
        console.error('Error loading files for order:', order.id, err);
      } finally {
        setFilesLoading(prev => ({ ...prev, [order.id]: false }));
        setAdminFilesLoading(prev => ({ ...prev, [order.id]: false }));
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
                        {order.additional_services_details.map((service, index) => (
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
          {(isLoadingFiles || adminFilesLoading[order.id]) ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
              <p className="text-gray-400 text-sm mt-2">Cargando archivos...</p>
            </div>
          ) : ((files && files.length > 0) || (adminFiles[order.id] && adminFiles[order.id].length > 0)) && (
            <div className="bg-gray-700/20 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Archivos Tuneados
              </h4>
              
              {/* Archivos del Cliente */}
              {files && files.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-md font-medium text-gray-300 mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Tus archivos subidos
                  </h5>
                  <div className="space-y-3">
                    {files.map((file) => (
                      <div key={file.id} className="bg-gray-600/30 rounded-lg p-3">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium break-words">{file.file_name}</p>
                            <p className="text-gray-400 text-sm break-words">
                              {t('clientDashboard.orders.files.uploaded')}: {new Date(file.created_at).toLocaleDateString('es-ES')} • {file.file_size ? `${(file.file_size / 1024).toFixed(1)} KB` : t('clientDashboard.orders.files.unknownSize')}
                            </p>
                          </div>
                          <button
                            onClick={() => onDownload(file.file_url, file.file_name)}
                            className="bg-primary hover:bg-primary/80 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 text-sm sm:text-base touch-manipulation flex-shrink-0 w-full sm:w-auto"
                          >
                            <Download className="w-4 h-4" />
                            {t('clientDashboard.common.download')}
                          </button>
                        </div>
                        {file.admin_comments && (
                          <div className="bg-gray-700/40 rounded-lg p-3 border-l-4 border-primary/50">
                            <p className="text-gray-300 text-sm font-medium mb-1">Comentarios técnicos:</p>
                            <p className="text-gray-200 text-sm leading-relaxed">{file.admin_comments}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Archivos del Admin */}
              {adminFiles[order.id] && adminFiles[order.id].length > 0 && (
                <div>
                  <div className="space-y-3">
                    {adminFiles[order.id].map((file) => (
                      <div key={file.id} className="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium break-words">{file.file_name}</p>
                            <p className="text-gray-400 text-sm break-words">
                              {t('clientDashboard.orders.files.processed')}: {new Date(file.created_at).toLocaleDateString('es-ES')} • {file.file_size ? `${(file.file_size / 1024).toFixed(1)} KB` : t('clientDashboard.orders.files.unknownSize')}
                            </p>
                          </div>
                          <button
                            onClick={() => onDownload(file.file_url, file.file_name)}
                            className="bg-green-600 hover:bg-green-500 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 text-sm sm:text-base touch-manipulation flex-shrink-0 w-full sm:w-auto"
                          >
                            <Download className="w-4 h-4" />
                            {t('clientDashboard.common.download')}
                          </button>
                        </div>
                        {file.admin_comments && (
                          <div className="bg-green-800/40 rounded-lg p-3 border-l-4 border-green-400/50">
                            <p className="text-green-300 text-sm font-medium mb-1">Comentarios del admin:</p>
                            <p className="text-green-100 text-sm leading-relaxed">{file.admin_comments}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Facturas */}
          {isLoadingInvoices ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
              <p className="text-gray-400 text-sm mt-2">Cargando facturas...</p>
            </div>
          ) : (invoices && invoices.length > 0) && (
            <div className="bg-gray-700/20 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Facturas
              </h4>
              
              <div className="space-y-3">
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium break-words">{invoice.file_name || `Factura ${invoice.invoice_number}`}</p>
                        <p className="text-gray-400 text-sm break-words">
                          Generada: {new Date(invoice.created_at).toLocaleDateString('es-ES')} • €{invoice.amount} • 
                          <span className={getStatusColor(invoice.status)}>{getStatusText(invoice.status)}</span>
                        </p>
                      </div>
                      {invoice.file_url && (
                        <button
                          onClick={() => onDownload(invoice.file_url, invoice.file_name || `Factura_${invoice.invoice_number}.pdf`)}
                          className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 text-sm sm:text-base touch-manipulation flex-shrink-0 w-full sm:w-auto"
                        >
                          <Download className="w-4 h-4" />
                          Descargar
                        </button>
                      )}
                    </div>
                    {invoice.admin_comments && (
                      <div className="bg-blue-800/40 rounded-lg p-3 border-l-4 border-blue-400/50">
                        <p className="text-blue-300 text-sm font-medium mb-1">Comentarios del admin:</p>
                        <p className="text-blue-100 text-sm leading-relaxed">{invoice.admin_comments}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Botón Ver más - Al final de la tarjeta */}
          <div className="mt-6 pt-4 border-t border-gray-700/30 flex justify-center">
            <button
              onClick={() => setSelectedOrderForModal(order)}
              className="bg-transparent hover:bg-gray-700/50 text-primary hover:text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              {t('clientDashboard.orders.card.viewMore')}
            </button>
          </div>
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

      toast.success(t('clientDashboard.messages.success.profileUpdated'));
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
      toast.error(t('clientDashboard.messages.validation.passwordMismatch'));
      return;
    }
    
    // TODO: Implementar lógica de cambio de contraseña
    // Password change logic removed
    toast.success(t('clientDashboard.messages.success.passwordChanged'));
    setShowPasswordChange(false);
  };

  const handleDownload = async (fileUrl: string, fileName: string) => {
    try {
      // Validar que la URL no esté vacía
      if (!fileUrl || fileUrl.trim() === '') {
        toast.error(t('clientDashboard.messages.errors.invalidFileUrl'));
        return;
      }

      // Si es una URL completa de Supabase, descargar usando fetch para preservar el nombre
      if (fileUrl.startsWith('http')) {
        try {
          const response = await fetch(fileUrl);
          if (!response.ok) {
            throw new Error('Error al obtener el archivo');
          }
          
          const blob = await response.blob();
          const downloadUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = fileName; // Usar el nombre original
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(downloadUrl);
          
          toast.success(`Descargando ${fileName}...`);
          return;
        } catch (fetchError) {
          console.error('Error with fetch download:', fetchError);
          // Fallback al método anterior
          const link = document.createElement('a');
          link.href = fileUrl;
          link.download = fileName;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          toast.success(`Descargando ${fileName}...`);
          return;
        }
      }

      // Determinar el bucket basado en la URL del archivo
      let bucketName = 'order-files';
      if (fileUrl.includes('adminorders/')) {
        bucketName = 'adminorders';
      }

      const { data, error } = await supabase.storage
        .from(bucketName)
        .download(fileUrl);

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
      
      toast.success(`Descargando ${fileName}...`);
    } catch (error: any) {
      console.error('Error downloading file:', error);
      toast.error(`${t('clientDashboard.messages.errors.downloadError')}: ${error.message || t('clientDashboard.messages.errors.unknownError')}`);
    }
  };

  // Función para formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
      
      // Como último recurso, devolver la URL completa
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

  // Función para generar PDF del pedido (idéntica a OrderDetails.tsx)
  const generatePDF = async (order: any) => {
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
          { label: `${t('clientDashboard.profile.fullName')}:`, value: order.profiles?.full_name || t('clientDashboard.common.na') },
          { label: `${t('clientDashboard.profile.email')}:`, value: order.profiles?.email || t('clientDashboard.common.na') },
          { label: `${t('clientDashboard.profile.phone')}:`, value: order.profiles?.phone || t('clientDashboard.common.na') },
          { label: `${t('clientDashboard.profile.address')}:`, value: order.profiles?.billing_address || t('clientDashboard.common.na') },
          { label: `${t('clientDashboard.profile.city')}:`, value: order.profiles?.billing_city || t('clientDashboard.common.na') },
          { label: `${t('clientDashboard.profile.postalCode')}:`, value: order.profiles?.billing_postal_code || t('clientDashboard.common.na') },
          { label: `${t('clientDashboard.profile.country')}:`, value: order.profiles?.billing_country || t('clientDashboard.common.na') }
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
          { label: `${t('clientDashboard.modal.vehicle.make')}:`, value: order.vehicle_make },
          { label: `${t('clientDashboard.modal.vehicle.model')}:`, value: order.vehicle_model },
          { label: `${t('clientDashboard.modal.vehicle.generation')}:`, value: order.vehicle_generation },
          { label: `${t('clientDashboard.modal.vehicle.engine')}:`, value: order.vehicle_engine },
          { label: `${t('clientDashboard.modal.vehicle.year')}:`, value: order.vehicle_year },
          { label: `${t('clientDashboard.modal.vehicle.ecu')}:`, value: order.vehicle_ecu },
          { label: `${t('clientDashboard.modal.vehicle.transmission')}:`, value: order.vehicle_gearbox },
          { label: `${t('clientDashboard.modal.vehicle.power')}:`, value: order.engine_hp ? `${order.engine_hp} HP${order.engine_kw ? ` (${order.engine_kw} kW)` : ''}` : null },
          { label: `${t('clientDashboard.modal.vehicle.reading')}:`, value: order.read_method },
          { label: `${t('clientDashboard.modal.vehicle.hardware')}:`, value: order.hardware_number },
          { label: `${t('clientDashboard.modal.vehicle.software')}:`, value: order.software_number }
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
          { key: 'aftermarket_exhaust', label: t('clientDashboard.modal.modifications.aftermarketExhaust'), remarks: 'aftermarket_exhaust_remarks' },
          { key: 'aftermarket_intake_manifold', label: t('clientDashboard.modal.modifications.aftermarketIntake'), remarks: 'aftermarket_intake_manifold_remarks' },
          { key: 'cold_air_intake', label: t('clientDashboard.modal.modifications.coldAirIntake'), remarks: 'cold_air_intake_remarks' },
          { key: 'decat', label: t('clientDashboard.modal.modifications.decat'), remarks: 'decat_remarks' }
        ];
        
        const hasAnyModification = modifications.some(({ key }) => order[key as keyof any]);
        
        if (!hasAnyModification) {
          doc.setFontSize(11);
          doc.setTextColor(lightColor[0], lightColor[1], lightColor[2]);
          doc.setFont('helvetica', 'italic');
          doc.text(t('clientDashboard.modal.modifications.noModifications'), margin, yPosition);
          yPosition += 8;
          return;
        }
        
        doc.setFontSize(11);
        doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
        
        modifications.forEach(({ key, label, remarks }) => {
          const hasModification = order[key as keyof any] as boolean;
          const remarkText = order[remarks as keyof any] as string;
          
          if (hasModification) {
            doc.setFont('helvetica', 'bold');
            doc.text(`• ${label}`, margin, yPosition);
            doc.setFont('helvetica', 'normal');
            yPosition += 8;
            
            if (remarkText && remarkText.trim()) {
              doc.setTextColor(lightColor[0], lightColor[1], lightColor[2]);
              doc.setFont('helvetica', 'italic');
              const lines = doc.splitTextToSize(`  ${t('clientDashboard.modal.modifications.observations')}: ${remarkText}`, pageWidth - 2 * margin - 10);
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
          doc.text(t('clientDashboard.modal.additionalServices.total'), margin, yPosition);
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
        
        const mainFileUrls = order.main_file_urls || parseMainFileUrl(order.main_file_url);
        const additionalFiles = order.optional_attachments_urls || [];
        
        doc.setFontSize(11);
        doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
        
        if (mainFileUrls.length > 0) {
          doc.setFont('helvetica', 'bold');
          doc.text(t('clientDashboard.modal.files.mainFiles'), margin, yPosition);
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
          doc.text(t('clientDashboard.modal.files.additionalFiles'), margin, yPosition);
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
        doc.text(t('clientDashboard.modal.financial.title'), margin + 5, yPosition + 8);
        
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
          doc.text(`${t('clientDashboard.modal.financial.basePrice')}:`, margin + 5, yPosition);
          doc.text(`€${basePrice.toFixed(2)}`, pageWidth - margin - 5, yPosition, { align: 'right' });
          yPosition += 8;
        }
        
        if (additionalPrice > 0) {
          doc.text(`${t('clientDashboard.modal.financial.additionalServices')}:`, margin + 5, yPosition);
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
        doc.text(`${t('clientDashboard.modal.financial.total')}:`, margin + 5, yPosition);
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
        doc.text(t('clientDashboard.pdf.footer.generated'), pageWidth / 2, footerY, { align: 'center' });
        doc.text(`${t('clientDashboard.pdf.footer.generatedOn')}: ${new Date().toLocaleDateString('es-ES')} ${t('clientDashboard.pdf.footer.at')} ${new Date().toLocaleTimeString('es-ES')}`, pageWidth / 2, footerY + 5, { align: 'center' });
      };

      // Construir el PDF
      addLogo();
      addCompanyHeader();
      addDocumentTitle();
      addOrderBasicInfo();
      
      addSection(t('clientDashboard.pdf.sections.clientInfo'), addClientInfo);
      addSection(t('clientDashboard.pdf.sections.vehicleInfo'), addVehicleInfo);
      addSection(t('clientDashboard.pdf.sections.vehicleModifications'), addVehicleModifications);
      addSection(t('clientDashboard.pdf.sections.additionalServices'), addAdditionalServices);
      addSection(t('clientDashboard.pdf.sections.clientFiles'), addClientFiles);
      addSection(t('clientDashboard.pdf.sections.additionalInfo'), addAdditionalInfo);
      addFinancialSummary();
      addFooter();

      // Guardar el PDF
      doc.save(`pedido-${order.id.slice(-8)}-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success(t('clientDashboard.messages.pdfGenerated'));
    } catch (error) {
      console.error('Error al generar PDF:', error);
      toast.error(t('clientDashboard.messages.pdfError'));
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
          <h3 className="text-lg font-semibold text-white mb-2">{t('clientDashboard.orders.stats.total')}</h3>
          <p className="text-3xl font-bold text-primary">{stats?.totalOrders || 0}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-2">{t('clientDashboard.orders.stats.completed')}</h3>
          <p className="text-3xl font-bold text-green-400">
            {stats?.completedOrders || 0}
          </p>
        </div>
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-2">{t('clientDashboard.orders.stats.inProgress')}</h3>
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
                placeholder={t('clientDashboard.orders.filters.searchPlaceholder')}
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
              <option value="all">{t('clientDashboard.orders.filters.allStatuses')}</option>
              <option value="pending">{t('clientDashboard.orders.filters.pending')}</option>
              <option value="in_progress">{t('clientDashboard.orders.filters.inProgress')}</option>
              <option value="completed">{t('clientDashboard.orders.filters.completed')}</option>
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
               placeholder={t('clientDashboard.orders.filters.dateTo')}
             />
           </div>
           
           {/* Ordenamiento */}
           <div className="min-w-[160px]">
             <select
               value={sortBy}
               onChange={(e) => setSortBy(e.target.value)}
               className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-primary focus:border-transparent"
             >
               <option value="newest">{t('clientDashboard.orders.filters.newest')}</option>
               <option value="oldest">{t('clientDashboard.orders.filters.oldest')}</option>
               <option value="price_high">{t('clientDashboard.orders.filters.priceHigh')}</option>
               <option value="price_low">{t('clientDashboard.orders.filters.priceLow')}</option>
             </select>
           </div>
          

          
          {/* Limpiar filtros */}
           {(searchTerm || statusFilter !== 'all' || dateFrom || dateTo || sortBy !== 'newest') && (
             <button
               onClick={clearFilters}
               className="px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
               title={t('clientDashboard.orders.filters.clearFilters')}
             >
               <X className="h-4 w-4" />
             </button>
           )}
        </div>
        
        {/* Contador de resultados */}
        <div className="mt-4 text-sm text-gray-400">
          {t('clientDashboard.orders.showing')} {paginatedOrders.length} {t('clientDashboard.orders.of')} {filteredOrders.length} {t('clientDashboard.orders.orders')}
          {filteredOrders.length !== orders.length && ` (${t('clientDashboard.orders.filteredFrom')} ${orders.length} ${t('clientDashboard.orders.total')})`}
        </div>
      </div>
      
      {/* Lista de pedidos */}
      {ordersLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-gray-400 mt-4">{t('clientDashboard.orders.loading')}</p>
        </div>
      ) : ordersError ? (
        <div className="text-center py-8">
          <p className="text-red-400">{t('clientDashboard.orders.error')}: {ordersError}</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-gray-800/30 rounded-xl p-8 border border-gray-700">
              <ShoppingCart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">{t('clientDashboard.orders.empty.title')}</h3>
              <p className="text-gray-500 mb-6">{t('clientDashboard.orders.empty.description')}</p>
              <button
                onClick={() => navigate('/services')}
                className="bg-primary hover:bg-primary/80 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300"
              >
                {t('clientDashboard.orders.empty.viewServices')}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="bg-gray-800/30 rounded-xl p-8 border border-gray-700">
              <p className="text-gray-400 mb-4">{t('clientDashboard.orders.noResults')}</p>
              <button
                onClick={clearFilters}
                className="text-primary hover:text-primary/80 font-semibold"
              >
                {t('clientDashboard.orders.filters.clearFilters')}
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
                order={order}
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
              <label className="block text-gray-300 mb-2">{t('clientDashboard.profile.fullName')}</label>
              <input
                type="text"
                name="full_name"
                defaultValue={fullProfile?.full_name || ''}
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-primary focus:outline-none"
                placeholder={t('clientDashboard.profile.fullNamePlaceholder')}
                required
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-2">{t('clientDashboard.profile.email')}</label>
              <input
                type="email"
                name="email"
                defaultValue={fullProfile?.email || user?.email || ''}
                className="w-full bg-gray-600/30 border border-gray-500 rounded-lg px-4 py-2 text-gray-300 cursor-not-allowed"
                placeholder={t('clientDashboard.profile.emailPlaceholder')}
                readOnly
              />
              <p className="text-xs text-gray-400 mt-1">{t('clientDashboard.profile.emailNote')}</p>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-gray-300 mb-2">{t('clientDashboard.profile.phone')}</label>
              <input
                type="tel"
                name="phone"
                defaultValue={fullProfile?.phone || ''}
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-primary focus:outline-none"
                placeholder={t('clientDashboard.profile.phonePlaceholder')}
              />
            </div>
            
            {/* Información de Facturación */}
            <div className="sm:col-span-2 border-t border-gray-600 pt-6 mt-6">
              <h4 className="text-xl font-semibold text-white mb-4">{t('clientDashboard.profile.billingInfo')}</h4>
            </div>
            
            <div>
              <label className="block text-gray-300 mb-2">{t('clientDashboard.profile.billingName')}</label>
              <input
                type="text"
                name="billing_name"
                defaultValue={fullProfile?.billing_name || ''}
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-primary focus:outline-none"
                placeholder={t('clientDashboard.profile.billingNamePlaceholder')}
              />
            </div>
            
            <div>
              <label className="block text-gray-300 mb-2">{t('clientDashboard.profile.taxId')}</label>
              <input
                type="text"
                name="tax_id"
                defaultValue={fullProfile?.tax_id || ''}
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-primary focus:outline-none"
                placeholder={t('clientDashboard.profile.taxIdPlaceholder')}
              />
            </div>
            
            <div className="sm:col-span-2">
              <label className="block text-gray-300 mb-2">{t('clientDashboard.profile.address')}</label>
              <input
                type="text"
                name="billing_address"
                defaultValue={fullProfile?.billing_address || ''}
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-primary focus:outline-none"
                placeholder={t('clientDashboard.profile.addressPlaceholder')}
              />
            </div>
            
            <div>
              <label className="block text-gray-300 mb-2">{t('clientDashboard.profile.city')}</label>
              <input
                type="text"
                name="billing_city"
                defaultValue={fullProfile?.billing_city || ''}
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-primary focus:outline-none"
                placeholder={t('clientDashboard.profile.cityPlaceholder')}
              />
            </div>
            
            <div>
              <label className="block text-gray-300 mb-2">{t('clientDashboard.profile.state')}</label>
              <input
                type="text"
                name="billing_state"
                defaultValue={fullProfile?.billing_state || ''}
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-primary focus:outline-none"
                placeholder={t('clientDashboard.profile.statePlaceholder')}
              />
            </div>
            
            <div>
              <label className="block text-gray-300 mb-2">{t('clientDashboard.profile.postalCode')}</label>
              <input
                type="text"
                name="billing_postal_code"
                defaultValue={fullProfile?.billing_postal_code || ''}
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-primary focus:outline-none"
                placeholder={t('clientDashboard.profile.postalCodePlaceholder')}
              />
            </div>
            
            <div>
              <label className="block text-gray-300 mb-2">{t('clientDashboard.profile.country')}</label>
              <input
                type="text"
                name="billing_country"
                defaultValue={fullProfile?.billing_country || ''}
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-primary focus:outline-none"
                placeholder={t('clientDashboard.profile.countryPlaceholder')}
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
              <h4 className="text-white text-lg font-semibold mb-4">{t('clientDashboard.profile.personalInfo')}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-gray-400 text-sm font-medium">{t('clientDashboard.profile.fullName')}</p>
                  <p className="text-white text-base font-semibold">{fullProfile?.full_name || t('clientDashboard.profile.notSpecified')}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-gray-400 text-sm font-medium">{t('clientDashboard.profile.email')}</p>
                  <p className="text-white text-base break-all font-semibold">{fullProfile?.email || user?.email || t('clientDashboard.profile.notSpecified')}</p>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <p className="text-gray-400 text-sm font-medium">{t('clientDashboard.profile.phone')}</p>
                  <p className="text-white text-base font-semibold">{fullProfile?.phone || t('clientDashboard.profile.notSpecified')}</p>
                </div>
              </div>
            </div>
            
            {/* Información de Facturación */}
            <div className="bg-gray-700/30 rounded-lg p-6">
              <h4 className="text-white text-lg font-semibold mb-4">{t('clientDashboard.profile.billingInfo')}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-gray-400 text-sm font-medium">{t('clientDashboard.profile.billingName')}</p>
                  <p className="text-white text-base font-semibold">{fullProfile?.billing_name || t('clientDashboard.profile.notSpecified')}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-gray-400 text-sm font-medium">{t('clientDashboard.profile.taxId')}</p>
                  <p className="text-white text-base font-semibold">{fullProfile?.tax_id || t('clientDashboard.profile.notSpecified')}</p>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <p className="text-gray-400 text-sm font-medium">{t('clientDashboard.profile.address')}</p>
                  <p className="text-white text-base font-semibold">{fullProfile?.billing_address || t('clientDashboard.profile.notSpecified')}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-gray-400 text-sm font-medium">{t('clientDashboard.profile.city')}</p>
                  <p className="text-white text-base font-semibold">{fullProfile?.billing_city || t('clientDashboard.profile.notSpecified')}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-gray-400 text-sm font-medium">{t('clientDashboard.profile.state')}</p>
                  <p className="text-white text-base font-semibold">{fullProfile?.billing_state || t('clientDashboard.profile.notSpecified')}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-gray-400 text-sm font-medium">{t('clientDashboard.profile.postalCode')}</p>
                  <p className="text-white text-base font-semibold">{fullProfile?.billing_postal_code || t('clientDashboard.profile.notSpecified')}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-gray-400 text-sm font-medium">{t('clientDashboard.profile.country')}</p>
                  <p className="text-white text-base font-semibold">{fullProfile?.billing_country || t('clientDashboard.profile.notSpecified')}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-700/30 rounded-lg p-6">
              <h4 className="text-white text-lg font-semibold mb-4">{t('clientDashboard.profile.accountInfo')}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-gray-400 text-sm font-medium">{t('clientDashboard.profile.userId')}</p>
                  <p className="text-white text-base font-mono text-sm">{fullProfile?.id || user?.id || t('clientDashboard.profile.notSpecified')}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-gray-400 text-sm font-medium">{t('clientDashboard.profile.registrationDate')}</p>
                  <p className="text-white text-base">{fullProfile?.created_at ? new Date(fullProfile.created_at).toLocaleDateString() : t('clientDashboard.profile.notSpecified')}</p>
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
                {t('clientDashboard.common.cancel')}
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
          <div className="text-white text-xl">{t('clientDashboard.messages.loadingDashboard')}</div>
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
      
      {/* Modal de información completa del pedido */}
      {selectedOrderForModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Header del Modal */}
            <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">{t('clientDashboard.modal.completeInfo')} - {t('clientDashboard.modal.orderNumber', { id: selectedOrderForModal.id })}</h2>
              <button
                onClick={() => setSelectedOrderForModal(null)}
                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Contenido del Modal */}
            <div className="p-6 space-y-6">
              {/* Información Básica del Pedido */}
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  {t('clientDashboard.modal.orderInfo')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">{t('clientDashboard.modal.orderId')}</p>
                    <p className="text-white font-medium">#{selectedOrderForModal.id}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">{t('clientDashboard.modal.orderDate')}</p>
                    <p className="text-white font-medium">{new Date(selectedOrderForModal.created_at).toLocaleDateString('es-ES')}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">{t('clientDashboard.modal.status')}</p>
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                      selectedOrderForModal.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                      selectedOrderForModal.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-orange-500/20 text-orange-400'
                    }`}>
                      {getStatusText(selectedOrderForModal.status)}
                    </span>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">{t('clientDashboard.modal.totalPrice')}</p>
                    <p className="text-white font-bold text-lg">€{parseFloat(selectedOrderForModal.total_price || '0').toFixed(2)}</p>
                  </div>
                  {selectedOrderForModal.estimated_delivery && (
                    <div className="md:col-span-2">
                      <p className="text-gray-400 text-sm">{t('clientDashboard.modal.estimatedDelivery')}</p>
                      <p className="text-white font-medium">{new Date(selectedOrderForModal.estimated_delivery).toLocaleDateString('es-ES')}</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Información del Cliente */}
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  {t('clientDashboard.modal.clientInfo')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">{t('clientDashboard.modal.name')}</p>
                    <p className="text-white font-medium">{fullProfile?.full_name || user?.email || t('clientDashboard.profile.notSpecified')}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">{t('clientDashboard.modal.email')}</p>
                    <p className="text-white font-medium">{user?.email || t('clientDashboard.profile.notSpecified')}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">{t('clientDashboard.modal.phone')}</p>
                    <p className="text-white font-medium">{fullProfile?.phone || t('clientDashboard.profile.notSpecified')}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">{t('clientDashboard.modal.address')}</p>
                    <p className="text-white font-medium">{fullProfile?.billing_address || t('clientDashboard.profile.notSpecified')}</p>
                  </div>
                </div>
              </div>
              
              {/* Información del Vehículo */}
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Car className="w-5 h-5" />
                  {t('clientDashboard.modal.vehicleInfo')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">{t('clientDashboard.modal.brand')}</p>
                    <p className="text-white font-medium">{selectedOrderForModal.vehicle_make || t('clientDashboard.profile.notSpecified')}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">{t('clientDashboard.modal.model')}</p>
                    <p className="text-white font-medium">{selectedOrderForModal.vehicle_model || t('clientDashboard.profile.notSpecified')}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">{t('clientDashboard.modal.generation')}</p>
                    <p className="text-white font-medium">{selectedOrderForModal.vehicle_generation || t('clientDashboard.profile.notSpecified')}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">{t('clientDashboard.modal.engine')}</p>
                    <p className="text-white font-medium">{selectedOrderForModal.vehicle_engine || t('clientDashboard.profile.notSpecified')}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">{t('clientDashboard.modal.ecu')}</p>
                    <p className="text-white font-medium">{selectedOrderForModal.vehicle_ecu || t('clientDashboard.profile.notSpecified')}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">{t('clientDashboard.modal.year')}</p>
                    <p className="text-white font-medium">{selectedOrderForModal.vehicle_year || t('clientDashboard.profile.notSpecified')}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">{t('clientDashboard.modal.gearbox')}</p>
                    <p className="text-white font-medium">{selectedOrderForModal.vehicle_gearbox || t('clientDashboard.profile.notSpecified')}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">{t('clientDashboard.modal.service')}</p>
                    <p className="text-white font-medium">{selectedOrderForModal.service_name || selectedOrderForModal.service_type || selectedOrderForModal.services?.title || t('clientDashboard.modal.service')}</p>
                  </div>
                </div>
              </div>
              
              {/* Información Adicional del Vehículo */}
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  {t('clientDashboard.modal.additionalInfo')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(selectedOrderForModal.engine_hp || selectedOrderForModal.engine_kw) && (
                    <div>
                      <p className="text-gray-400 text-sm">{t('clientDashboard.modal.enginePower')}</p>
                      <p className="text-white font-medium">
                        {selectedOrderForModal.engine_hp && `${selectedOrderForModal.engine_hp} HP`}
                        {selectedOrderForModal.engine_hp && selectedOrderForModal.engine_kw && ' / '}
                        {selectedOrderForModal.engine_kw && `${selectedOrderForModal.engine_kw} kW`}
                      </p>
                    </div>
                  )}
                  {selectedOrderForModal.vin && (
                    <div>
                      <p className="text-gray-400 text-sm">{t('clientDashboard.modal.vin')}</p>
                      <p className="text-white font-medium break-all">{selectedOrderForModal.vin}</p>
                    </div>
                  )}
                  {selectedOrderForModal.read_method && (
                    <div>
                      <p className="text-gray-400 text-sm">{t('clientDashboard.modal.readMethod')}</p>
                      <p className="text-white font-medium">{selectedOrderForModal.read_method}</p>
                    </div>
                  )}
                  {selectedOrderForModal.hardware_number && (
                    <div>
                      <p className="text-gray-400 text-sm">{t('clientDashboard.modal.hardwareNumber')}</p>
                      <p className="text-white font-medium">{selectedOrderForModal.hardware_number}</p>
                    </div>
                  )}
                  {selectedOrderForModal.software_number && (
                    <div>
                      <p className="text-gray-400 text-sm">{t('clientDashboard.modal.softwareNumber')}</p>
                      <p className="text-white font-medium">{selectedOrderForModal.software_number}</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Piezas Modificadas */}
              {selectedOrderForModal.has_modified_parts && (
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Wrench className="w-5 h-5" />
                    {t('clientDashboard.modal.modifiedParts')}
                  </h3>
                  <div className="space-y-3">
                    {selectedOrderForModal.aftermarket_exhaust && (
                      <div className="bg-gray-700/30 rounded-lg p-3">
                        <p className="text-white font-medium">{t('clientDashboard.modal.aftermarketExhaust')}</p>
                        {selectedOrderForModal.aftermarket_exhaust_remarks && (
                          <p className="text-gray-300 text-sm mt-1">{selectedOrderForModal.aftermarket_exhaust_remarks}</p>
                        )}
                      </div>
                    )}
                    {selectedOrderForModal.aftermarket_intake_manifold && (
                      <div className="bg-gray-700/30 rounded-lg p-3">
                        <p className="text-white font-medium">{t('clientDashboard.modal.aftermarketIntakeManifold')}</p>
                        {selectedOrderForModal.aftermarket_intake_manifold_remarks && (
                          <p className="text-gray-300 text-sm mt-1">{selectedOrderForModal.aftermarket_intake_manifold_remarks}</p>
                        )}
                      </div>
                    )}
                    {selectedOrderForModal.cold_air_intake && (
                      <div className="bg-gray-700/30 rounded-lg p-3">
                        <p className="text-white font-medium">{t('clientDashboard.modal.coldAirIntake')}</p>
                        {selectedOrderForModal.cold_air_intake_remarks && (
                          <p className="text-gray-300 text-sm mt-1">{selectedOrderForModal.cold_air_intake_remarks}</p>
                        )}
                      </div>
                    )}
                    {selectedOrderForModal.decat && (
                      <div className="bg-gray-700/30 rounded-lg p-3">
                        <p className="text-white font-medium">{t('clientDashboard.modal.decat')}</p>
                        {selectedOrderForModal.decat_remarks && (
                          <p className="text-gray-300 text-sm mt-1">{selectedOrderForModal.decat_remarks}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Servicios Adicionales */}
              {selectedOrderForModal.additional_services_details && selectedOrderForModal.additional_services_details.length > 0 && (
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Wrench className="w-5 h-5" />
                    {t('clientDashboard.modal.additionalServices')}
                  </h3>
                  <div className="space-y-3">
                    {selectedOrderForModal.additional_services_details.map((service, index) => (
                      <div key={index} className="bg-gray-700/30 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <p className="text-white font-medium">{service.title}</p>
                          <p className="text-green-400 font-semibold">€{service.price}</p>
                        </div>
                        {service.description && (
                          <p className="text-gray-400 text-sm mt-2">{service.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Información Adicional */}
              {selectedOrderForModal.additional_info && (
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    {t('clientDashboard.modal.additionalInfo')}
                  </h3>
                  <div>
                    <p className="text-gray-400 text-sm mb-2">{t('clientDashboard.modal.additionalComments')}</p>
                    <p className="text-white whitespace-pre-wrap">{selectedOrderForModal.additional_info}</p>
                  </div>
                </div>
              )}
              
              {/* Información de Precios */}
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  {t('clientDashboard.modal.priceInfo')}
                </h3>
                <div className="space-y-3">
                  {selectedOrderForModal.base_price && (
                    <div className="flex justify-between">
                      <p className="text-gray-400 text-sm">{t('clientDashboard.modal.basePrice')}</p>
                      <p className="text-white font-medium">€{selectedOrderForModal.base_price}</p>
                    </div>
                  )}
                  {selectedOrderForModal.additional_services_price && selectedOrderForModal.additional_services_price > 0 && (
                    <div className="flex justify-between">
                      <p className="text-gray-400 text-sm">{t('clientDashboard.modal.additionalServicesPrice')}</p>
                      <p className="text-white font-medium">€{selectedOrderForModal.additional_services_price}</p>
                    </div>
                  )}
                  {selectedOrderForModal.total_price && (
                    <div className="flex justify-between border-t border-gray-600 pt-3">
                      <p className="text-white font-semibold">{t('clientDashboard.modal.total')}</p>
                      <p className="text-white font-bold text-lg">€{selectedOrderForModal.total_price}</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Documentos del Cliente */}
              {(selectedOrderForModal.main_file_url || selectedOrderForModal.optional_attachments_urls) && (
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    {t('clientDashboard.modal.clientDocuments')}
                  </h3>
                  
                  {/* Archivo Principal */}
                  {selectedOrderForModal.main_file_url && (
                    <div className="mb-4">
                      <h4 className="text-md font-medium text-blue-300 mb-3">{t('clientDashboard.modal.mainFile')}</h4>
                      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 flex justify-between items-center">
                        <div>
                          <p className="text-white font-medium">
                            {selectedOrderForModal.main_file_url.split('/').pop()?.split('?')[0] || 'Archivo principal'}
                          </p>
                          <p className="text-gray-400 text-sm">
                            {new Date(selectedOrderForModal.created_at).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDownload(selectedOrderForModal.main_file_url, selectedOrderForModal.main_file_url.split('/').pop()?.split('?')[0] || 'archivo_principal')}
                          className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 text-sm"
                        >
                          <Download className="w-4 h-4" />
                          {t('clientDashboard.common.download')}
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Archivos Adicionales */}
                  {selectedOrderForModal.optional_attachments_urls && selectedOrderForModal.optional_attachments_urls.length > 0 && (
                    <div>
                      <h4 className="text-md font-medium text-gray-300 mb-3">{t('clientDashboard.modal.additionalFiles')}</h4>
                      <div className="space-y-2">
                        {selectedOrderForModal.optional_attachments_urls.map((url, index) => (
                          <div key={index} className="bg-gray-700/30 rounded-lg p-3 flex justify-between items-center">
                            <div>
                              <p className="text-white font-medium">
                                {url.split('/').pop()?.split('?')[0] || `Archivo adicional ${index + 1}`}
                              </p>
                              <p className="text-gray-400 text-sm">
                                {new Date(selectedOrderForModal.created_at).toLocaleDateString('es-ES')}
                              </p>
                            </div>
                            <button
                              onClick={() => handleDownload(url, url.split('/').pop()?.split('?')[0] || `archivo_adicional_${index + 1}`)}
                              className="bg-primary hover:bg-primary/80 text-white px-3 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 text-sm"
                            >
                              <Download className="w-4 h-4" />
                              {t('clientDashboard.common.download')}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Archivos */}
              {((orderFiles[selectedOrderForModal.id] && orderFiles[selectedOrderForModal.id].length > 0) || 
                (adminFiles[selectedOrderForModal.id] && adminFiles[selectedOrderForModal.id].length > 0)) && (
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    {t('clientDashboard.modal.orderFiles')}
                  </h3>
                  
                  {/* Archivos del Cliente */}
                  {orderFiles[selectedOrderForModal.id] && orderFiles[selectedOrderForModal.id].length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-md font-medium text-gray-300 mb-3">{t('clientDashboard.modal.originalFiles')}</h4>
                      <div className="space-y-2">
                        {orderFiles[selectedOrderForModal.id].map((file) => (
                          <div key={file.id} className="bg-gray-700/30 rounded-lg p-3 flex justify-between items-center">
                            <div>
                              <p className="text-white font-medium">{file.file_name}</p>
                              <p className="text-gray-400 text-sm">
                                {new Date(file.created_at).toLocaleDateString('es-ES')} • 
                                {file.file_size ? `${(file.file_size / 1024).toFixed(1)} KB` : t('clientDashboard.modal.unknownSize')}
                              </p>
                            </div>
                            <button
                              onClick={() => handleDownload(file.file_url, file.file_name)}
                              className="bg-primary hover:bg-primary/80 text-white px-3 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 text-sm"
                            >
                              <Download className="w-4 h-4" />
                              {t('clientDashboard.common.download')}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Archivos del Admin */}
                  {adminFiles[selectedOrderForModal.id] && adminFiles[selectedOrderForModal.id].length > 0 && (
                    <div>
                      <h4 className="text-md font-medium text-green-300 mb-3">{t('clientDashboard.modal.tunedFiles')}</h4>
                      <div className="space-y-2">
                        {adminFiles[selectedOrderForModal.id].map((file) => (
                          <div key={file.id} className="bg-green-900/20 border border-green-500/30 rounded-lg p-3 flex justify-between items-center">
                            <div>
                              <p className="text-white font-medium">{file.file_name}</p>
                              <p className="text-gray-400 text-sm">
                                {new Date(file.created_at).toLocaleDateString('es-ES')} • 
                                {file.file_size ? `${(file.file_size / 1024).toFixed(1)} KB` : t('clientDashboard.modal.unknownSize')}
                              </p>
                              {file.admin_comments && (
                                <p className="text-green-200 text-sm mt-2 italic">{file.admin_comments}</p>
                              )}
                            </div>
                            <button
                              onClick={() => handleDownload(file.file_url, file.file_name)}
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
                </div>
              )}
              
              {/* Facturas */}
              {orderInvoices[selectedOrderForModal.id] && orderInvoices[selectedOrderForModal.id].length > 0 && (
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    {t('clientDashboard.modal.invoices')}
                  </h3>
                  <div className="space-y-2">
                    {orderInvoices[selectedOrderForModal.id].map((invoice) => (
                      <div key={invoice.id} className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 flex justify-between items-center">
                        <div>
                          <p className="text-white font-medium">{invoice.file_name || `Factura ${invoice.invoice_number}`}</p>
                          <p className="text-gray-400 text-sm">
                            {new Date(invoice.created_at).toLocaleDateString('es-ES')} • €{invoice.amount} • 
                            <span className={getStatusColor(invoice.status)}>{getStatusText(invoice.status)}</span>
                          </p>
                          {invoice.admin_comments && (
                            <p className="text-blue-200 text-sm mt-2 italic">{invoice.admin_comments}</p>
                          )}
                        </div>
                        {invoice.file_url && (
                          <button
                              onClick={() => handleDownload(invoice.file_url, invoice.file_name || `Factura_${invoice.invoice_number}.pdf`)}
                              className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 text-sm"
                            >
                              <Download className="w-4 h-4" />
                              {t('clientDashboard.common.download')}
                            </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Información Extra */}
              {selectedOrderForModal.additional_info && (
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    {t('clientDashboard.modal.extraInfo')}
                  </h3>
                  <div className="bg-gray-700/30 rounded-lg p-4">
                    <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{selectedOrderForModal.additional_info}</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Footer del Modal */}
            <div className="sticky bottom-0 bg-gray-900 border-t border-gray-700 p-6 flex justify-between items-center">
              <button
                onClick={() => generatePDF(selectedOrderForModal)}
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2"
              >
                <Printer className="w-5 h-5" />
                {t('clientDashboard.common.printPDF')}
              </button>
              <button
                onClick={() => setSelectedOrderForModal(null)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300"
              >
                {t('clientDashboard.common.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDashboard;