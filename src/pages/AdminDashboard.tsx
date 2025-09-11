import React, { useState, useEffect } from 'react';
import { Users, ShoppingCart, Upload, FileText, Settings, BarChart3, Download, ImageIcon, Star, Plus, Trash2, Eye, X, User, Car, Search, CreditCard, ChevronRight, Package } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

type AdminSection = 'overview' | 'services' | 'clients' | 'orders';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, profile, loading: authLoading, isAdmin } = useAuth();
  
  // Leer la sección de la URL o usar 'overview' por defecto
  const sectionFromURL = searchParams.get('section') as AdminSection;
  const [activeSection, setActiveSection] = useState<AdminSection>(
    sectionFromURL && ['overview', 'services', 'clients', 'orders'].includes(sectionFromURL) 
      ? sectionFromURL 
      : 'overview'
  );
  
  // Protección de ruta - solo para administradores
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/login');
        return;
      }
      
      // Solo redirigir si el perfil está cargado y el rol está definido
      if (profile && profile.role) {
        if (profile.role === 'client') {
          navigate('/client-dashboard');
          return;
        }
        // Si no es client, debe quedarse en admin dashboard (no redirigir)
      }
    }
  }, [user, profile, authLoading, navigate]);

  // Actualizar la sección activa cuando cambie la URL
  useEffect(() => {
    const sectionFromURL = searchParams.get('section') as AdminSection;
    if (sectionFromURL && ['overview', 'services', 'clients', 'orders'].includes(sectionFromURL)) {
      setActiveSection(sectionFromURL);
    }
  }, [searchParams]);

  // Función para cambiar de sección y actualizar la URL
  const handleSectionChange = (section: AdminSection) => {
    setActiveSection(section);
    setSearchParams({ section });
  };

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

  // Si no hay usuario o no es admin, no mostrar nada (se redirigirá)
  if (!user || !isAdmin) {
    return null;
  }

  const sidebarItems = [
    { id: 'overview' as AdminSection, label: 'Resumen', icon: BarChart3 },
    { id: 'services' as AdminSection, label: 'Crear Servicios', icon: Settings },
    { id: 'clients' as AdminSection, label: 'Clientes', icon: Users },
    { id: 'orders' as AdminSection, label: 'Pedidos', icon: ShoppingCart },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return <OverviewSection />;
      case 'services':
        return <ServicesSection />;
      case 'clients':
        return <ClientsSection />;
      case 'orders':
        return <OrdersSection />;
      default:
        return <OverviewSection />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="flex w-full max-w-full overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-64 flex-shrink-0 bg-gray-900/50 backdrop-blur-sm border-r border-gray-700 min-h-screen">
          <div className="p-4 xl:p-6">
            <h1 className="text-xl xl:text-2xl font-bold text-white mb-6 xl:mb-8">
              <span className="text-primary">ADMIN</span> PANEL
            </h1>
            <nav className="space-y-1 xl:space-y-2">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSectionChange(item.id)}
                    className={`w-full flex items-center space-x-2 xl:space-x-3 px-3 xl:px-4 py-2 xl:py-3 rounded-lg transition-all duration-200 text-sm xl:text-base ${
                      activeSection === item.id
                        ? 'bg-primary/20 text-primary border border-primary/30'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4 xl:w-5 xl:h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0 overflow-hidden">
          {/* Mobile Navigation */}
          <div className="lg:hidden bg-gray-900/95 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-30">
            <div className="px-3 sm:px-4 py-2 sm:py-3">
              <h1 className="text-base sm:text-lg font-bold text-white mb-2 sm:mb-3">
                <span className="text-primary">ADMIN</span> PANEL
              </h1>
              {/* Horizontal Scroll Container with Gradient Indicators */}
              <div className="relative overflow-hidden" style={{ width: '100%' }}>
                {/* Left Gradient Indicator */}
                <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-gray-900/95 to-transparent z-10 pointer-events-none opacity-0 transition-opacity duration-300" id="left-gradient"></div>
                
                {/* Right Gradient Indicator */}
                <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-gray-900/95 to-transparent z-10 pointer-events-none opacity-100 transition-opacity duration-300" id="right-gradient"></div>
                
                {/* Scrollable Buttons Container */}
                <div 
                  className="flex overflow-x-auto overflow-y-hidden space-x-2 pb-2 scrollbar-hide scroll-smooth"
                  style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    WebkitOverflowScrolling: 'touch',
                    width: '100%',
                    maxWidth: '100vw'
                  }}
                  onScroll={(e) => {
                    const container = e.currentTarget;
                    const leftGradient = document.getElementById('left-gradient');
                    const rightGradient = document.getElementById('right-gradient');
                    
                    if (leftGradient && rightGradient) {
                      // Show/hide left gradient
                      if (container.scrollLeft > 10) {
                        leftGradient.style.opacity = '1';
                      } else {
                        leftGradient.style.opacity = '0';
                      }
                      
                      // Show/hide right gradient
                      const isAtEnd = container.scrollLeft >= (container.scrollWidth - container.clientWidth - 10);
                      if (isAtEnd) {
                        rightGradient.style.opacity = '0';
                      } else {
                        rightGradient.style.opacity = '1';
                      }
                    }
                  }}
                >
                  {sidebarItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSectionChange(item.id)}
                        className={`flex-shrink-0 flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 touch-manipulation text-sm min-w-max ${
                          activeSection === item.id
                            ? 'bg-primary text-white shadow-lg'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700 active:bg-gray-600'
                        }`}
                        style={{
                          WebkitTapHighlightColor: 'transparent'
                        }}
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
          <div className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-full overflow-hidden">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

// Overview Section
const OverviewSection: React.FC = () => {
  const [stats, setStats] = useState([
    { label: 'Pedidos Pendientes', value: '0', color: 'text-yellow-400' },
    { label: 'Clientes Activos', value: '0', color: 'text-green-400' },
    { label: 'Servicios Creados', value: '0', color: 'text-blue-400' },
    { label: 'Ingresos del Mes', value: '€0', color: 'text-primary' },
  ]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOverviewData = async () => {
      try {
        // Cargar estadísticas reales
        const [pendingOrdersRes, clientsRes, servicesRes, ordersRes] = await Promise.all([
          // Pedidos pendientes
          supabase
            .from('orders')
            .select('*', { count: 'exact' })
            .eq('status', 'pending'),
          // Clientes activos
          supabase
            .rpc('admin_get_all_clients'),
          // Servicios creados
          supabase
            .from('services')
            .select('*', { count: 'exact' }),
          // Pedidos para calcular ingresos del mes
          supabase
            .from('orders')
            .select('total_price')
            .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
            .eq('status', 'completed')
        ]);

        // Handle potential errors gracefully
        if (pendingOrdersRes.error) {
          console.warn('Error loading pending orders:', pendingOrdersRes.error);
        }
        if (clientsRes.error) {
          console.warn('Error loading clients:', clientsRes.error);
        }
        if (servicesRes.error) {
          console.warn('Error loading services:', servicesRes.error);
        }
        if (ordersRes.error) {
          console.warn('Error loading monthly orders:', ordersRes.error);
        }

        const pendingCount = pendingOrdersRes.count || 0;
        const clientsCount = clientsRes.data?.length || 0;
        const servicesCount = servicesRes.count || 0;
        
        // Calcular ingresos del mes
        const monthlyIncome = ordersRes.data?.reduce((sum, order) => sum + (order.total_price || 0), 0) || 0;

        setStats([
          { label: 'Pedidos Pendientes', value: pendingCount.toString(), color: 'text-yellow-400' },
          { label: 'Clientes Activos', value: clientsCount.toString(), color: 'text-green-400' },
          { label: 'Servicios Creados', value: servicesCount.toString(), color: 'text-blue-400' },
          { label: 'Ingresos del Mes', value: `€${monthlyIncome.toLocaleString()}`, color: 'text-primary' },
        ]);

        // Cargar actividad reciente - últimos pedidos
        const { data: recentOrders } = await supabase
          .from('orders')
          .select(`
            id, 
            status, 
            created_at, 
            client_id,
            service_id
          `)
          .order('created_at', { ascending: false })
          .limit(3);

        if (recentOrders) {
          const activityWithProfiles = [];
          for (const order of recentOrders) {
            try {
              // Load profile and service info separately
              const [profileResult, serviceResult] = await Promise.all([
                supabase.from('profiles').select('full_name, email').eq('id', order.client_id).single(),
                supabase.from('services').select('title').eq('id', order.service_id).single()
              ]);
              
              const profile = profileResult.data;
              const service = serviceResult.data;
              const clientName = profile?.full_name || profile?.email?.split('@')[0] || `Cliente #${order.client_id.slice(-4)}`;
              const serviceName = service?.title || 'Servicio';
              
              let activityText = '';
              switch (order.status) {
                case 'pending':
                  activityText = `Nuevo pedido de ${serviceName} - ${clientName}`;
                  break;
                case 'in_progress':
                  activityText = `Pedido en proceso de ${serviceName} - ${clientName}`;
                  break;
                case 'completed':
                  activityText = `Pedido completado de ${serviceName} - ${clientName}`;
                  break;
                default:
                  activityText = `Pedido ${order.status} de ${serviceName} - ${clientName}`;
              }

              activityWithProfiles.push({
                text: activityText,
                time: new Date(order.created_at).toLocaleString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit',
                  day: '2-digit',
                  month: '2-digit'
                })
              });
            } catch (error) {
              console.error('Error loading profile for order:', order.id, error);
            }
          }
          setRecentActivity(activityWithProfiles);
        }

      } catch (error) {
        console.error('Error loading overview data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOverviewData();
  }, []);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Panel de Control</h2>
        <div className="text-xs sm:text-sm text-gray-400">
          Última actualización: {new Date().toLocaleString()}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-3 sm:p-4 lg:p-6 hover:border-primary/50 transition-all duration-300">
            <h3 className="text-gray-400 text-xs sm:text-sm font-medium mb-2 truncate">{stat.label}</h3>
            <p className={`text-lg sm:text-xl lg:text-2xl font-bold ${stat.color} truncate`}>{stat.value}</p>
            </div>
          ))}
      </div>
      
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-3 sm:p-4 lg:p-6">
        <h3 className="text-sm sm:text-base lg:text-lg font-bold text-white mb-3 sm:mb-4">Actividad Reciente</h3>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 border-b border-gray-700 space-y-1 sm:space-y-0 last:border-b-0">
                  <span className="text-gray-300 text-sm sm:text-base">{activity.text}</span>
                  <span className="text-xs sm:text-sm text-gray-500">{activity.time}</span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                <span className="text-sm">No hay actividad reciente</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Services Section
const ServicesSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'create' | 'view'>('create');
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serviceSearchTerm, setServiceSearchTerm] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Form data for creating new service
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    price: '',
    original_price: '',
    badge: '',
    category: 'Car Tuning',
    status: 'Activo',
    popular: false,
    isAdditional: false,
    image_url: ''
  });

  const [features, setFeatures] = useState<string[]>(['']);

  // Form data for editing service
  const [editFormData, setEditFormData] = useState<any>({});

  // Load services from Supabase
  const loadServices = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setServices(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error loading services:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load services on component mount
  useEffect(() => {
    loadServices();
  }, []);

  // Handle form input changes
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const serviceData = {
        title: formData.title,
        subtitle: formData.subtitle || null,
        description: formData.description,
        price: parseFloat(formData.price),
        original_price: formData.original_price ? parseFloat(formData.original_price) : null,
        badge: formData.badge || null,
        category: formData.category,
        status: formData.status,
        popular: formData.popular,
        is_additional: formData.isAdditional,
        image_url: formData.image_url || null,
        features: features.filter(f => f.trim() !== '')
      };

      const { data, error } = await supabase
        .from('services')
        .insert([serviceData])
        .select();

      if (error) throw error;

      // Reset form
      setFormData({
        title: '',
        subtitle: '',
        description: '',
        price: '',
        original_price: '',
        badge: '',
        category: 'Car Tuning',
        status: 'Activo',
        popular: false,
        isAdditional: false,
        image_url: ''
      });
      setFeatures(['']);
      setImagePreview(null);

      // Reload services
      loadServices();
      
      // Switch to view tab
      setActiveTab('view');

      console.log('Service created successfully:', data);
    } catch (err: any) {
      setError(err.message);
      console.error('Error creating service:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle service deletion
  const handleDeleteService = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este servicio?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Reload services
      loadServices();
      console.log('Service deleted successfully');
    } catch (err: any) {
      setError(err.message);
      console.error('Error deleting service:', err);
    }
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setFormData(prev => ({ ...prev, image_url: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Features management
  const addFeature = () => {
    setFeatures(prev => [...prev, '']);
  };

  const updateFeature = (index: number, value: string) => {
    setFeatures(prev => prev.map((f, i) => i === index ? value : f));
  };

  const removeFeature = (index: number) => {
    setFeatures(prev => prev.filter((_, i) => i !== index));
  };

  // Edit modal functions
  const openEditModal = (service: any) => {
    setEditingService(service);
    setEditFormData({
      ...service,
      features: service.features || []
    });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingService(null);
    setEditFormData({});
  };

  const handleEditInputChange = (field: string, value: any) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('services')
        .update({
          title: editFormData.title,
          subtitle: editFormData.subtitle || null,
          description: editFormData.description,
          price: parseFloat(editFormData.price || editFormData.priceFrom),
          original_price: editFormData.original_price ? parseFloat(editFormData.original_price || editFormData.priceTo) : null,
          badge: editFormData.badge || null,
          category: editFormData.category,
          status: editFormData.status,
          popular: editFormData.popular || editFormData.isPopular || false,
          is_additional: editFormData.is_additional || editFormData.isAdditional || false,
          image_url: editFormData.image_url || editFormData.imageUrl || null,
          features: (editFormData.features || []).filter(f => f.trim() !== '')
        })
        .eq('id', editingService.id);

      if (error) throw error;

      closeEditModal();
      loadServices();
      console.log('Service updated successfully');
    } catch (err: any) {
      setError(err.message);
      console.error('Error updating service:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setEditFormData(prev => ({ ...prev, imageUrl: result, image_url: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const updateEditFeature = (index: number, value: string) => {
    setEditFormData(prev => ({
      ...prev,
      features: (prev.features || []).map((f, i) => i === index ? value : f)
    }));
  };

  const addEditFeature = () => {
    setEditFormData(prev => ({
      ...prev,
      features: [...(prev.features || []), '']
    }));
  };

  const removeEditFeature = (index: number) => {
    setEditFormData(prev => ({
      ...prev,
      features: (prev.features || []).filter((_, i) => i !== index)
    }));
  };

  return (
    <div>
      {/* TODO: Implementar banner de estado de autenticación */}
      
      <div className="flex flex-col mb-4 sm:mb-6 lg:mb-8">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-4">Gestión de Servicios</h2>
        <div className="flex flex-row space-x-2">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-3 rounded-lg transition-colors touch-manipulation text-sm sm:text-base ${
              activeTab === 'create'
                ? 'bg-primary text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Crear Servicio
          </button>
          <button
            onClick={() => setActiveTab('view')}
            className={`px-4 py-3 rounded-lg transition-colors touch-manipulation text-sm sm:text-base ${
              activeTab === 'view'
                ? 'bg-primary text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Ver Servicios ({services.length})
          </button>
        </div>
      </div>

      {activeTab === 'create' ? (
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4 sm:p-6 lg:p-8">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Título y Subtítulo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                  Título del Servicio
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Ej: CAR TUNING"
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-primary focus:ring-1 focus:ring-primary text-sm sm:text-base"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                  Subtítulo
                </label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) => handleInputChange('subtitle', e.target.value)}
                  placeholder="Ej: (STAGE 1)"
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-primary focus:ring-1 focus:ring-primary text-sm sm:text-base"
                />
              </div>
            </div>

            {/* Precios y Badge */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Precio Actual (€)
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  placeholder="299"
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Precio Original (€)
                </label>
                <input
                  type="number"
                  value={formData.original_price}
                  onChange={(e) => handleInputChange('original_price', e.target.value)}
                  placeholder="399"
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Badge/Etiqueta
                </label>
                <input
                  type="text"
                  value={formData.badge}
                  onChange={(e) => handleInputChange('badge', e.target.value)}
                  placeholder="Ej: BÁSICO, MÁS POPULAR"
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* Categoría y Configuraciones */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Categoría
                </label>
                <select 
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white focus:border-primary focus:ring-1 focus:ring-primary"
                >
                  <option>Car Tuning</option>
                  <option>Truck/Agriculture Tuning</option>
                  <option>TCU Tuning</option>
                  <option>Otros Servicios</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Estado
                </label>
                <select 
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value as 'Activo' | 'Inactivo')}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white focus:border-primary focus:ring-1 focus:ring-primary"
                >
                  <option>Activo</option>
                  <option>Inactivo</option>
                </select>
              </div>
              <div className="flex items-center space-x-4 pt-8">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formData.popular}
                    onChange={(e) => handleInputChange('popular', e.target.checked)}
                    className="w-4 h-4 text-primary bg-gray-900 border-gray-600 rounded focus:ring-primary" 
                  />
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span className="text-gray-300">Servicio Popular</span>
                </label>
                
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formData.isAdditional}
                    onChange={(e) => handleInputChange('isAdditional', e.target.checked)}
                    className="w-4 h-4 text-primary bg-gray-900 border-gray-600 rounded focus:ring-primary" 
                  />
                  <span className="text-gray-300">Es un servicio adicional</span>
                </label>
              </div>
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Descripción
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="OPTIMIZACIÓN BÁSICA DEL MOTOR PARA MEJORAR RENDIMIENTO Y EFICIENCIA"
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Imagen del Servicio */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Imagen del Servicio
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                <div>
                  <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-300 mb-2">Arrastra una imagen aquí o</p>
                      <span className="text-primary hover:text-primary/80 font-medium">
                        selecciona un archivo
                      </span>
                      <p className="text-sm text-gray-500 mt-2">PNG, JPG hasta 5MB</p>
                    </label>
                  </div>
                </div>
                {imagePreview && (
                  <div>
                    <p className="text-sm text-gray-300 mb-2">Vista previa:</p>
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded-lg border border-gray-600"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Características/Features */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-medium text-gray-300">
                  Características del Servicio
                </label>
                <button
                  type="button"
                  onClick={addFeature}
                  className="flex items-center space-x-2 px-3 py-1 bg-primary/20 text-primary border border-primary/30 rounded-lg hover:bg-primary/30 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Añadir</span>
                </button>
              </div>
              <div className="space-y-3">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <input
                      type="text"
                      value={feature}
                      onChange={(e) => updateFeature(index, e.target.value)}
                      placeholder="Ej: AUMENTO DE POTENCIA +15-25%"
                      className="flex-1 px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                    {features.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeFeature(index)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creando...' : 'Crear Servicio'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Vista de Servicios Creados */
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
            <p className="text-gray-300">Servicios creados: {(() => {
              const filteredCount = services.filter(service => {
                if (!serviceSearchTerm) return true;
                const searchLower = serviceSearchTerm.toLowerCase();
                return (
                  service.title.toLowerCase().includes(searchLower) ||
                  service.description.toLowerCase().includes(searchLower) ||
                  service.category.toLowerCase().includes(searchLower) ||
                  (service.subtitle && service.subtitle.toLowerCase().includes(searchLower))
                );
              }).length;
              return serviceSearchTerm ? `${filteredCount} de ${services.length}` : services.length;
            })()}</p>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Buscar servicios..."
                value={serviceSearchTerm}
                onChange={(e) => setServiceSearchTerm(e.target.value)}
                className="w-full sm:w-auto px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-primary focus:ring-1 focus:ring-primary text-sm sm:text-base"
              />
              <select className="w-full sm:w-auto px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white focus:border-primary focus:ring-1 focus:ring-primary text-sm sm:text-base">
                <option>Todas las categorías</option>
                <option>Car Tuning</option>
                <option>Truck/Agriculture</option>
                <option>TCU Tuning</option>
                <option>Otros Servicios</option>
              </select>
            </div>
          </div>
          
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-300">Cargando servicios...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-400">Error al cargar servicios: {error}</p>
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(() => {
              // Función de filtrado
              const filteredServices = services.filter(service => {
                if (!serviceSearchTerm) return true;
                const searchLower = serviceSearchTerm.toLowerCase();
                return (
                  service.title.toLowerCase().includes(searchLower) ||
                  service.description.toLowerCase().includes(searchLower) ||
                  service.category.toLowerCase().includes(searchLower) ||
                  (service.subtitle && service.subtitle.toLowerCase().includes(searchLower))
                );
              });
              
              if (filteredServices.length === 0 && serviceSearchTerm) {
                return (
                  <div className="col-span-full text-center py-8">
                    <p className="text-gray-400">No se encontraron servicios que coincidan con "<span className="text-white">{serviceSearchTerm}</span>"</p>
                  </div>
                );
              }
              
              return filteredServices.map((service) => (
              <div key={service.id} className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden hover:border-primary/30 transition-all duration-300">
                <div className="relative">
                  <img
                    src={service.image_url || 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600'}
                    alt={service.title}
                    className="w-full h-48 object-cover"
                  />
                  {service.badge && (
                    <div className="absolute top-4 right-4 bg-primary px-3 py-1 rounded-full text-xs font-bold text-white">
                      {service.badge}
                    </div>
                  )}
                  <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm px-2 py-1 rounded text-xs text-white">
                    {service.category}
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-white">
                      {service.title}
                    </h3>

                  </div>
                  
                  {service.subtitle && (
                    <p className="text-primary font-medium mb-3">{service.subtitle}</p>
                  )}
                  
                  <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                    {service.description}
                  </p>
                  
                  <div className="space-y-2 mb-4">
                    {service.features && service.features.slice(0, 2).map((feature, index) => (
                      <div key={index} className="flex items-center text-sm text-gray-300">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full mr-2"></div>
                        {feature}
                      </div>
                    ))}
                    {service.features && service.features.length > 2 && (
                      <p className="text-xs text-gray-500">+{service.features.length - 2} más...</p>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold text-primary">€{parseFloat(service.price).toFixed(2)}</span>
                      {service.original_price && (
                        <span className="text-sm text-gray-500 line-through">€{parseFloat(service.original_price).toFixed(2)}</span>
                      )}
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      service.status === 'Activo' 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {service.status}
                    </span>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-primary/20 text-primary border border-primary/30 rounded-lg hover:bg-primary/30 transition-colors">
                      <Eye className="w-4 h-4" />
                      <span>Ver</span>
                    </button>
                    <button 
                      onClick={() => openEditModal(service)}
                      className="flex-1 px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Editar
                    </button>
                    <button 
                      onClick={() => handleDeleteService(service.id)}
                      className="px-3 py-2 bg-red-600/20 text-red-400 border border-red-600/30 rounded-lg hover:bg-red-600/30 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ));
            })()}
          </div>
          )}
        </div>
      )}
      
      {/* Modal de Edición */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Editar Servicio</h3>
              <button
                onClick={closeEditModal}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Título del Servicio
                  </label>
                  <input
                    type="text"
                    value={editFormData.title}
                    onChange={(e) => handleEditInputChange('title', e.target.value)}
                    className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Subtítulo
                  </label>
                  <input
                    type="text"
                    value={editFormData.subtitle}
                    onChange={(e) => handleEditInputChange('subtitle', e.target.value)}
                    className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Precio Actual (€)
                  </label>
                  <input
                    type="number"
                    value={editFormData.priceFrom}
                    onChange={(e) => handleEditInputChange('priceFrom', e.target.value)}
                    className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="299"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Precio Original (€)
                  </label>
                  <input
                    type="number"
                    value={editFormData.priceTo}
                    onChange={(e) => handleEditInputChange('priceTo', e.target.value)}
                    className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="399"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Badge/Etiqueta
                  </label>
                  <input
                    type="text"
                    value={editFormData.badge || ''}
                    onChange={(e) => handleEditInputChange('badge', e.target.value)}
                    placeholder="Ej: BÁSICO, MÁS POPULAR"
                    className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Categoría
                  </label>
                  <select
                    value={editFormData.category}
                    onChange={(e) => handleEditInputChange('category', e.target.value)}
                    className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white focus:border-primary focus:ring-1 focus:ring-primary"
                    required
                  >
                    <option value="Car Tuning">Car Tuning</option>
                    <option value="Truck/Agriculture Tuning">Truck/Agriculture Tuning</option>
                    <option value="TCU Tuning">TCU Tuning</option>
                    <option value="Otros Servicios">Otros Servicios</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Estado
                  </label>
                  <select
                    value={editFormData.status || 'active'}
                    onChange={(e) => handleEditInputChange('status', e.target.value)}
                    className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                  </select>
                </div>
                
                <div className="flex flex-col space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editFormData.isPopular || false}
                      onChange={(e) => handleEditInputChange('isPopular', e.target.checked)}
                      className="w-5 h-5 text-primary bg-gray-900/50 border-gray-600 rounded focus:ring-primary focus:ring-2"
                    />
                    <span className="text-sm font-medium text-gray-300">Servicio Popular</span>
                  </label>
                  
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editFormData.isAdditional || false}
                      onChange={(e) => handleEditInputChange('isAdditional', e.target.checked)}
                      className="w-5 h-5 text-primary bg-gray-900/50 border-gray-600 rounded focus:ring-primary focus:ring-2"
                    />
                    <span className="text-sm font-medium text-gray-300">Es un servicio adicional</span>
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Descripción
                </label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => handleEditInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Imagen del Servicio
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleEditImageUpload}
                    className="hidden"
                    id="edit-image-upload"
                  />
                  <label
                    htmlFor="edit-image-upload"
                    className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors cursor-pointer"
                  >
                    Cambiar Imagen
                  </label>
                  {editFormData.imageUrl && (
                    <img
                      src={editFormData.imageUrl}
                      alt="Preview"
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Características
                </label>
                <div className="space-y-2">
                  {(editFormData.features || []).map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => updateEditFeature(index, e.target.value)}
                        className="flex-1 px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-primary focus:ring-1 focus:ring-primary"
                        placeholder="Característica del servicio"
                      />
                      <button
                        type="button"
                        onClick={() => removeEditFeature(index)}
                        className="p-2 text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addEditFeature}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Agregar Característica</span>
                  </button>
                </div>
              </div>
              
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-700">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-6 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Actualizando...' : 'Actualizar Servicio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Clients Section
const ClientsSection: React.FC = () => {
  const navigate = useNavigate();
  const [clientSearchTerm, setClientSearchTerm] = useState<string>('');
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [clientOrders, setClientOrders] = useState<any[]>([]);

  // Cargar clientes desde Supabase
  useEffect(() => {
    const loadClients = async () => {
      try {
        setLoading(true);
        
        // Intentar usar la función RPC admin_get_all_clients
        const clientsData = [];
        
        try {
          const { data: rpcClients, error: rpcError } = await supabase
            .rpc('admin_get_all_clients');


          if (!rpcError && rpcClients) {
            // Usar datos de la función RPC
            for (const client of rpcClients) {
              const { count } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .eq('client_id', client.id);

              clientsData.push({
                ...client,
                orders_count: count || 0
              });
            }
          } else {
            throw new Error('RPC function not available, falling back to orders method');
          }
        } catch (rpcErr) {
          // RPC method failed, using fallback method
          
          // Método de fallback: obtener desde orders
          const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('client_id')
            .order('created_at', { ascending: false });


          if (ordersError) {
            throw ordersError;
          }

          // Obtener IDs únicos de clientes
          const uniqueClientIds = [...new Set(orders?.map(order => order.client_id))];
          
          for (const clientId of uniqueClientIds) {
            try {
              // Usar query directo para obtener datos del cliente
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', clientId)
                .single();

              if (profileError) {
                console.error('Error fetching profile for client', clientId, ':', profileError);
                continue;
              }

              const profile = profileData;
              if (!profile) continue;

              // Contar pedidos del cliente
              const { count, error: countError } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .eq('client_id', clientId);

              if (countError) {
                console.error('Error counting orders for client', clientId, ':', countError);
              }

              clientsData.push({
                id: profile.id,
                email: profile.email,
                full_name: profile.full_name,
                phone: profile.phone,
                role: 'client',
                billing_name: '',
                tax_id: '',
                billing_address: '',
                billing_city: '',
                billing_postal_code: '',
                billing_country: '',
                billing_state: '',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                orders_count: count || 0
              });
            } catch (profileErr) {
              console.error('Error processing client', clientId, ':', profileErr);
            }
          }
        }

        setClients(clientsData);
      } catch (err: any) {
        console.error('Error loading clients:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadClients();
  }, []);

  // Filtrado de clientes por término de búsqueda
  const filteredClients = clients.filter(client => {
    const searchLower = clientSearchTerm.toLowerCase();
    return clientSearchTerm === '' || 
      client.id.toLowerCase().includes(searchLower) ||
      (client.full_name?.toLowerCase() || '').includes(searchLower) ||
      client.email.toLowerCase().includes(searchLower) ||
      (client.billing_name?.toLowerCase() || '').includes(searchLower);
  });

  // Cargar pedidos del cliente seleccionado
  const loadClientOrders = async (clientId: string) => {
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          *,
          services (
            id,
            title,
            category
          )
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setClientOrders(orders || []);
    } catch (err: any) {
      console.error('Error loading client orders:', err);
      setClientOrders([]);
    }
  };

  // Manejar clic en "Ver detalles"
  const handleViewClientDetails = async (client: any) => {
    setSelectedClient(client);
    await loadClientOrders(client.id);
  };

  // Función para formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Función para mostrar estado del pedido
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'in_progress': return 'En Proceso';
      case 'completed': return 'Completado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  // Componente Modal de detalles del cliente
  const ClientDetailsModal = () => {
    if (!selectedClient) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-700 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">Detalles del Cliente</h2>
            <button 
              onClick={() => setSelectedClient(null)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Información Personal */}
            <div className="bg-gray-800/50 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <User className="w-5 h-5 text-primary mr-2" />
                Información Personal
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-sm">Nombre Completo</label>
                  <p className="text-white font-medium">{selectedClient.full_name || 'No especificado'}</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Email</label>
                  <p className="text-white font-medium">{selectedClient.email}</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Teléfono</label>
                  <p className="text-white font-medium">{selectedClient.phone || 'No especificado'}</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Fecha de Registro</label>
                  <p className="text-white font-medium">{formatDate(selectedClient.created_at)}</p>
                </div>
              </div>
            </div>

            {/* Información de Facturación */}
            <div className="bg-gray-800/50 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <CreditCard className="w-5 h-5 text-primary mr-2" />
                Información de Facturación
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-sm">Nombre de Facturación</label>
                  <p className="text-white font-medium">{selectedClient.billing_name || 'No especificado'}</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">NIF/CIF</label>
                  <p className="text-white font-medium">{selectedClient.tax_id || 'No especificado'}</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Dirección</label>
                  <p className="text-white font-medium">{selectedClient.billing_address || 'No especificado'}</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Ciudad</label>
                  <p className="text-white font-medium">{selectedClient.billing_city || 'No especificado'}</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Código Postal</label>
                  <p className="text-white font-medium">{selectedClient.billing_postal_code || 'No especificado'}</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">País</label>
                  <p className="text-white font-medium">{selectedClient.billing_country || 'No especificado'}</p>
                </div>
              </div>
            </div>

            {/* Pedidos del Cliente */}
            <div className="bg-gray-800/50 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <Package className="w-5 h-5 text-primary mr-2" />
                Pedidos ({clientOrders.length})
              </h3>
              
              {clientOrders.length === 0 ? (
                <p className="text-gray-400 text-center py-4">Este cliente no tiene pedidos aún.</p>
              ) : (
                <div className="space-y-3">
                  {clientOrders.map((order) => (
                    <div 
                      key={order.id}
                      onClick={() => {
                        setSelectedClient(null);
                        navigate(`/admin/order-details/${order.id}`);
                      }}
                      className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-900/70 hover:border-primary/50 transition-all duration-200"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="text-white font-medium">#{order.id.slice(-8).toUpperCase()}</h4>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                              order.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                              order.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {getStatusDisplay(order.status)}
                            </span>
                          </div>
                          <p className="text-gray-300 text-sm mb-1">
                            {order.services?.title || 'Servicio no especificado'}
                          </p>
                          <p className="text-gray-400 text-xs">
                            {formatDate(order.created_at)} • €{parseFloat(order.total_price || '0').toFixed(2)}
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-4 sm:mb-6 lg:mb-8">Gestión de Clientes</h2>
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-700">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
            <h3 className="text-lg sm:text-xl font-bold text-white">Lista de Clientes</h3>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar cliente..."
                  value={clientSearchTerm}
                  onChange={(e) => setClientSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-primary focus:ring-1 focus:ring-primary text-sm sm:text-base"
                />
              </div>
              <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors text-sm sm:text-base">
                Exportar
              </button>
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-gray-300">Cargando clientes...</span>
          </div>
        ) : error ? (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 m-4">
            <p className="text-red-300 text-sm">Error al cargar clientes: {error}</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Nombre</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Teléfono</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Pedidos</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Registro</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredClients.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                        No se encontraron clientes que coincidan con la búsqueda
                      </td>
                    </tr>
                  ) : (
                    filteredClients.map((client) => (
                      <tr key={client.id} className="hover:bg-gray-800/30">
                        <td className="px-6 py-4 text-sm text-white font-medium">
                          {client.full_name || 'Sin nombre'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">{client.email}</td>
                        <td className="px-6 py-4 text-sm text-gray-300">
                          {client.phone || 'No especificado'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">{client.orders_count}</td>
                        <td className="px-6 py-4 text-sm text-gray-300">
                          {formatDate(client.created_at)}
                        </td>
                        <td className="px-6 py-4">
                          <button 
                            onClick={() => handleViewClientDetails(client)}
                            className="text-primary hover:text-primary/80 text-sm font-medium"
                          >
                            Ver Detalles
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Mobile Cards */}
            <div className="md:hidden p-4 space-y-3">
              {filteredClients.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 text-sm">No se encontraron clientes que coincidan con la búsqueda</p>
                </div>
              ) : (
                filteredClients.map((client) => (
                  <div key={client.id} className="bg-gray-700/30 border border-gray-600 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-white font-medium text-sm mb-1">
                          {client.full_name || 'Sin nombre'}
                        </h4>
                        <p className="text-gray-400 text-xs">{client.email}</p>
                      </div>
                    </div>
                    <div className="space-y-1 mb-3">
                      <p className="text-gray-300 text-xs">
                        📱 {client.phone || 'No especificado'}
                      </p>
                      <p className="text-gray-300 text-xs">
                        📦 {client.orders_count} pedidos
                      </p>
                      <p className="text-gray-300 text-xs">
                        📅 {formatDate(client.created_at)}
                      </p>
                    </div>
                    <button 
                      onClick={() => handleViewClientDetails(client)}
                      className="text-primary hover:text-primary/80 text-xs font-medium"
                    >
                      Ver Detalles
                    </button>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
      
      {/* Modal de detalles del cliente */}
      <ClientDetailsModal />
    </div>
  );
};

// Orders Section
const OrdersSection: React.FC = () => {
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState('Pendiente');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar todos los pedidos (admin tiene acceso completo)
  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        setError(null);


        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            services (
              id,
              title,
              category,
              image_url
            )
          `)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading orders:', error);
          throw error;
        }

        // Get profile data separately using direct query
        const ordersWithProfiles = [];
        for (const order of data || []) {
          try {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('full_name, email, phone, created_at')
              .eq('id', order.client_id)
              .maybeSingle();

            if (profileError) {
              console.error('Error fetching profile for order', order.id, ':', profileError);
            }
            
            // Silently handle missing profiles without logging
            // Profile data will be null if not found, which is handled gracefully

            ordersWithProfiles.push({
              ...order,
              profiles: profileData || null
            });
          } catch (profileErr) {
            console.error('Error fetching profile:', profileErr);
            // Add order without profile data if there's an error
            ordersWithProfiles.push({
              ...order,
              profiles: null
            });
          }
        }

        setOrders(ordersWithProfiles);
      } catch (err: any) {
        console.error('Error loading orders:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  // Función para actualizar estado del pedido
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) {
        throw error;
      }

      // Actualizar el estado local
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId
            ? { ...order, status: newStatus, updated_at: new Date().toISOString() }
            : order
        )
      );

      // Notificar a otros componentes que se actualizó un pedido
      // Esto permitirá que UploadMapsSection se refresque
      window.dispatchEvent(new CustomEvent('orderStatusUpdated', { 
        detail: { orderId, newStatus } 
      }));

      toast.success('Estado del pedido actualizado correctamente');
    } catch (err: any) {
      console.error('Error updating order status:', err);
      toast.error(`Error al actualizar estado: ${err.message}`);
    }
  };
  
  // Mapear estados de la base de datos a estados de la UI
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'in_progress': return 'En Proceso';
      case 'completed': return 'Completado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };
  
  // Formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-white">Cargando pedidos...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-red-400">Error al cargar pedidos: {error}</div>
      </div>
    );
  }

  // Filtrado combinado: por estado y por término de búsqueda
  const filteredOrders = orders.filter(order => {
    // Filtro por estado
    const displayStatus = getStatusDisplay(order.status);
    const statusMatch = filterStatus === 'Todos' || displayStatus === filterStatus;
    
    // Filtro por término de búsqueda
    const searchLower = searchTerm.toLowerCase();
    const searchMatch = searchTerm === '' || 
      order.id.toLowerCase().includes(searchLower) ||
      order.profiles?.full_name?.toLowerCase().includes(searchLower) ||
      order.profiles?.email?.toLowerCase().includes(searchLower) ||
      order.services?.title?.toLowerCase().includes(searchLower) ||
      order.services?.category?.toLowerCase().includes(searchLower) ||
      `${order.vehicle_make} ${order.vehicle_model}`.toLowerCase().includes(searchLower) ||
      displayStatus.toLowerCase().includes(searchLower);
    
    return statusMatch && searchMatch;
  });

  const filterButtons = ['Pendiente', 'En Proceso', 'Completado', 'Cancelado', 'Todos'];

  const handleOrderClick = (orderId: string) => {
    navigate(`/admin/order-details/${orderId}`);
  };

  return (
    <div>
      <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-4 sm:mb-6 lg:mb-8">Gestión de Pedidos</h2>
      
      {/* Campo de búsqueda */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar por cliente, ID, servicio o estado..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-colors text-sm"
          />
        </div>
      </div>
      
      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-6">
        {filterButtons.map((filter) => (
          <button
            key={filter}
            onClick={() => setFilterStatus(filter)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === filter
                ? 'bg-primary text-white'
                : 'bg-transparent border border-gray-600 text-gray-300 hover:bg-gray-800'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredOrders.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <p className="text-gray-400 text-lg">No se encontraron pedidos que coincidan con los criterios de búsqueda</p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const displayStatus = getStatusDisplay(order.status);
            return (
          <div 
            key={order.id} 
            onClick={() => handleOrderClick(order.id)}
            className="relative bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 cursor-pointer hover:border-primary/50 hover:from-gray-800/70 hover:to-gray-900/70 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-primary/10 hover:z-50"
          >
            {/* Header with ID and Status */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">#{order.id.slice(-8).toUpperCase()}</h3>
                <p className="text-sm text-gray-400">{formatDate(order.created_at)}</p>
              </div>
              <select
                value={order.status}
                onChange={(e) => {
                  e.stopPropagation();
                  updateOrderStatus(order.id, e.target.value);
                }}
                onClick={(e) => e.stopPropagation()}
                className={`relative z-50 px-3 py-1.5 text-xs font-semibold rounded-full border-0 cursor-pointer transition-colors focus:z-[100] ${
                  displayStatus === 'Pendiente' ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' :
                  displayStatus === 'En Proceso' ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' :
                  displayStatus === 'Completado' ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' :
                  'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                }`}
                style={{
                  position: 'relative',
                  zIndex: 50
                }}
                onFocus={(e) => {
                  e.currentTarget.parentElement?.parentElement?.parentElement?.classList.add('!z-[100]');
                }}
                onBlur={(e) => {
                  e.currentTarget.parentElement?.parentElement?.parentElement?.classList.remove('!z-[100]');
                }}
              >
                <option value="pending">Pendiente</option>
                <option value="in_progress">En Proceso</option>
                <option value="completed">Completado</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>

            {/* Client Info Section */}
            <div className="bg-gray-900/30 rounded-lg p-4 mb-4">
              <div className="flex items-center mb-2">
                <User className="w-4 h-4 text-primary mr-2" />
                <span className="text-xs font-semibold text-primary uppercase">Cliente</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <div>
                  <p className="text-white font-medium">{order.profiles?.full_name || 'Cliente no encontrado'}</p>
                  <p className="text-gray-400 text-sm">{order.profiles?.email || 'Email no disponible'}</p>
                </div>
              </div>
            </div>

            {/* Service Info */}
            <div className="bg-gray-900/30 rounded-lg p-4 mb-4">
              <div className="flex items-center mb-2">
                <Settings className="w-4 h-4 text-primary mr-2" />
                <span className="text-xs font-semibold text-primary uppercase">Servicio</span>
              </div>
              <p className="text-white font-medium">{order.services?.title || 'N/A'}</p>
              <p className="text-gray-400 text-sm">{order.services?.category || ''}</p>
            </div>

            {/* Vehicle Info */}
            <div className="bg-gray-900/30 rounded-lg p-4 mb-4">
              <div className="flex items-center mb-2">
                <Car className="w-4 h-4 text-primary mr-2" />
                <span className="text-xs font-semibold text-primary uppercase">Vehículo</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-white font-medium">
                    {order.vehicle_make} {order.vehicle_model}
                  </p>
                  <p className="text-gray-400">{order.vehicle_year || ''}</p>
                </div>
                <div>
                  <p className="text-white font-medium">{order.vehicle_engine || 'N/A'}</p>
                  <p className="text-gray-400">{order.engine_hp ? `${order.engine_hp} HP` : ''}</p>
                </div>
              </div>
            </div>

            {/* Price and Actions */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-700/50">
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">€{parseFloat(order.total_price || '0').toFixed(2)}</p>
                <p className="text-xs text-gray-400">Precio total</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/admin/order-details/${order.id}`);
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors font-medium shadow-lg hover:shadow-xl"
              >
                <Eye className="w-4 h-4" />
                <span>Ver Detalles</span>
              </button>
            </div>
          </div>
          );
          })
        )}
      </div>
    </div>
  );
};












export default AdminDashboard;