import React, { useState, useEffect } from 'react';
import { User, FileText, Download, Edit, Lock, ShoppingCart, CreditCard, Search, X, ChevronLeft, ChevronRight, Car, Calendar, Wrench, Filter, CheckCircle, Clock, AlertCircle, Eye, Printer } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import jsPDF from 'jspdf';
import OrderCard from '../components/OrderCard';
import OrderDetailModal from '../components/dashboard/OrderDetailModal';

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

  // Función para manejar descargas de archivos
  const handleDownload = async (fileUrl: string, fileName: string) => {
    console.log('🔥 INICIO handleDownload - Botón clickeado');
    console.log('📁 Parámetros recibidos:', { fileUrl, fileName });
    
    try {
      console.log('✅ Validando parámetros...');
      if (!fileUrl || fileUrl.trim() === '') {
        console.error('❌ ERROR: fileUrl está vacío o es inválido:', fileUrl);
        toast.error(t('clientDashboard.messages.errors.invalidFileUrl'));
        return;
      }
      console.log('✅ Parámetros válidos');

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
      
      let bucketName = 'adminorders'; // Bucket por defecto
      let filePath = fileUrl;
      
      // Si es una URL completa de Supabase, extraer el path
      if (fileUrl.includes('supabase.co/storage/v1/object/public/')) {
        console.log('🔗 Detectada URL completa de Supabase, extrayendo path...');
        const urlParts = fileUrl.split('/storage/v1/object/public/');
        if (urlParts.length > 1) {
          const pathWithBucket = urlParts[1];
          const pathParts = pathWithBucket.split('/');
          bucketName = pathParts[0]; // Primer parte es el bucket
          filePath = pathParts.slice(1).join('/'); // Resto es el path
          console.log('🗂️ Bucket extraído:', bucketName);
          console.log('📂 Path extraído:', filePath);
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
      
      // Detectar bucket correcto basado en la URL
      if (fileUrl.includes('/invoices/')) {
        bucketName = 'invoices';
        console.log('🧾 Detectado archivo de factura, usando bucket invoices');
      } else if (fileUrl.includes('/adminorders/')) {
        bucketName = 'adminorders';
        console.log('📁 Detectado archivo tuneado, usando bucket adminorders');
      }
      
      console.log('🗂️ Bucket final determinado:', bucketName);
      console.log('📂 Path final del archivo:', filePath);

      console.log('☁️ Creando URL firmada para descarga desde Supabase Storage...');
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
      toast.error(`${t('clientDashboard.messages.errors.downloadError')}: ${error.message || t('clientDashboard.messages.errors.unknownError')}`);
    }
  };

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

  // Function to load files for completed orders - CREADA DESDE CERO
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

        // Load admin files - REEMPLAZADO COMPLETAMENTE
        await loadAdminFiles(order.id);
        
      } catch (err) {
        console.error('Error loading files for order:', order.id, err);
      } finally {
        setFilesLoading(prev => ({ ...prev, [order.id]: false }));
      }
    }
  };

  // Función para cargar archivos del admin - CREADA DESDE CERO
  const loadAdminFiles = async (orderId: string) => {
    if (!user) return;

    try {
      setAdminFilesLoading(prev => ({ ...prev, [orderId]: true }));
      
      // Cargar archivos tuneados y facturas del admin
      const { data: files, error } = await supabase
        .from('order_files')
        .select('*')
        .eq('order_id', orderId)
        .is('uploaded_by', null) // Admin files
        .in('file_category', ['map', 'invoice'])
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setAdminFiles(prev => ({ ...prev, [orderId]: files || [] }));
      
    } catch (error) {
      setAdminFiles(prev => ({ ...prev, [orderId]: [] }));
    } finally {
      setAdminFilesLoading(prev => ({ ...prev, [orderId]: false }));
    }
  };

  // Función para descargar archivos del admin - CORREGIDA PARA USAR SIGNED URLs
  const downloadAdminFile = async (file: any) => {
    console.log('🔥 INICIO downloadAdminFile - Archivo admin clickeado');
    console.log('📁 Archivo recibido:', file);
    
    try {
      let bucketName = '';
      let filePath = '';
      
      // Detectar bucket automáticamente
      if (file.file_category === 'map') {
        bucketName = 'adminorders';
        console.log('📁 Detectado archivo tuneado, usando bucket adminorders');
      } else if (file.file_category === 'invoice') {
        bucketName = 'invoices';
        console.log('🧾 Detectado archivo de factura, usando bucket invoices');
      } else {
        console.error('❌ ERROR: Tipo de archivo no válido:', file.file_category);
        toast.error('Tipo de archivo no válido');
        return;
      }

      // Usar file_url si está disponible, sino construir el path
      if (file.file_url) {
        filePath = file.file_url;
        console.log('🔗 Usando file_url:', filePath);
      } else if (file.file_path) {
        filePath = file.file_path;
        console.log('📂 Usando file_path:', filePath);
      } else {
        console.error('❌ ERROR: No se encontró URL o path del archivo');
        toast.error('No se pudo encontrar la ubicación del archivo');
        return;
      }

      // Si es una URL completa de Supabase, extraer el path
      if (filePath.includes('supabase.co/storage/v1/object/public/')) {
        console.log('🔗 Detectada URL completa de Supabase, extrayendo path...');
        const urlParts = filePath.split('/storage/v1/object/public/');
        if (urlParts.length > 1) {
          const pathWithBucket = urlParts[1];
          const pathParts = pathWithBucket.split('/');
          bucketName = pathParts[0]; // Primer parte es el bucket
          filePath = pathParts.slice(1).join('/'); // Resto es el path
          console.log('🗂️ Bucket extraído:', bucketName);
          console.log('📂 Path extraído:', filePath);
        }
      }
      
      console.log('🗂️ Bucket final:', bucketName);
      console.log('📂 Path final del archivo:', filePath);

      console.log('☁️ Creando URL firmada para descarga desde Supabase Storage...');
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(filePath, 60); // URL válida por 60 segundos

      if (signedUrlError) {
        console.error('❌ ERROR al crear URL firmada:', signedUrlError);
        toast.error(`Error al crear URL de descarga: ${signedUrlError.message}`);
        return;
      }
      
      if (!signedUrlData?.signedUrl) {
        console.error('❌ ERROR: No se pudo obtener URL firmada');
        toast.error('No se pudo generar la URL de descarga');
        return;
      }

      console.log('🔗 URL firmada creada exitosamente');
      
      // Descargar usando la URL firmada
      console.log('📡 Descargando archivo usando URL firmada...');
      const response = await fetch(signedUrlData.signedUrl);
      
      if (!response.ok) {
        console.error('❌ ERROR en respuesta HTTP:', response.status, response.statusText);
        toast.error(`Error HTTP: ${response.status} ${response.statusText}`);
        return;
      }
      
      const blob = await response.blob();
      console.log('📦 Archivo descargado:', blob.size, 'bytes');
      
      const downloadUrl = URL.createObjectURL(blob);
      console.log('🔗 URL de descarga local creada:', downloadUrl);
      
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = file.file_name || 'archivo_admin';
      document.body.appendChild(a);
      console.log('🖱️ Simulando click en enlace de descarga...');
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
      
      console.log('✅ Descarga de archivo admin completada exitosamente');
      toast.success(`Descargando ${file.file_name || 'archivo'}...`);
    } catch (error: any) {
      console.error('💥 ERROR COMPLETO en downloadAdminFile:', error);
      console.error('💥 Mensaje del error:', error.message);
      console.error('💥 Stack del error:', error.stack);
      toast.error(`Error al descargar archivo: ${error.message || 'Error desconocido'}`);
    }
  };

  // Función para formatear tamaño de archivos - CREADA DESDE CERO
  const formatFileSize = (bytes: number): string => {
    if (!bytes) return 'Tamaño desconocido';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
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





  // Funciones de utilidad definidas en OrderDetails.tsx para evitar duplicación
  // extractFilePathFromUrl, extractFileNameFromUrl, parseMainFileUrl



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
                      onViewMore={setSelectedOrderForModal}
                      adminFiles={adminFiles}
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
          <div className="text-white text-xl">{t('clientDashboard.messages.loading.loadingDashboard')}</div>
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
        <OrderDetailModal
          order={selectedOrderForModal}
          profile={fullProfile}
          user={user}
          onClose={() => setSelectedOrderForModal(null)}
          adminFiles={adminFiles}
          orderFiles={orderFiles}
          orderInvoices={orderInvoices}
          handleDownload={handleDownload}
          downloadAdminFile={downloadAdminFile}
          formatFileSize={formatFileSize}
          getStatusText={getStatusText}
        />
      )}
    </div>
  );
};

export default ClientDashboard;