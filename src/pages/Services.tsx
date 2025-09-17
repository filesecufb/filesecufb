import React, { useState, useMemo, useEffect } from 'react';
import { Search, Settings, Gauge, Wrench, Cog, Car } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useSEO } from '../hooks/useSEO';

interface Service {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  category: string;
  price: string;
  original_price?: string;
  image_url?: string;
  features?: string[];
  badge?: string;
  popular?: boolean;
}

const Services = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Usar el hook useSEO para gestionar metadatos dinámicos
  useSEO('services');
  
  // State for services from Supabase
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load services from Supabase
  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .eq('status', 'Activo')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setServices(data || []);
      } catch (err: any) {
        console.error('Error loading services:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadServices();
  }, []);
  
  // Filtrar servicios por término de búsqueda
  const filteredServices = useMemo(() => {
    if (!searchTerm) return services;
    return services.filter(service => 
      service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [services, searchTerm]);
  
  // Agrupar servicios por categoría - solo servicios de Supabase
  const groupedServices = useMemo(() => {
    // Mapear categorías del admin dashboard a las categorías de filtrado
    
    const grouped = {
      car_tuning: filteredServices.filter(service => {
        return service.category === 'Car Tuning' || service.category === 'car_tuning';
      }),

      tcu: filteredServices.filter(service => {
        return service.category === 'TCU Tuning' || service.category === 'tcu';
      }),
      other: filteredServices.filter(service => {
        return service.category === 'Otros Servicios' || service.category === 'other';
      })
    };
    
    return grouped;
  }, [filteredServices]);
  
  // Servicios eliminados - ahora solo se usan los de Supabase

  

  // Servicios de TCU eliminados - solo Supabase

  // Servicios otros eliminados - solo Supabase

  const renderServiceCard = (service: Service) => (
    <div
      key={service.id}
      className={`relative bg-dark-secondary rounded-2xl overflow-hidden border transition-all duration-300 hover:scale-105 hover:shadow-2xl group ${
        service.popular ? 'border-primary shadow-elegant' : 'border-elegant'
      }`}
    >


      {/* Service Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={service.image_url || 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600'}
          alt={service.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-primary/80 to-transparent" />
      </div>

      {/* Service Content */}
      <div className="p-6">
        {/* Service Icon and Title */}
        <div className="flex items-center mb-4">
          <div className="bg-primary/20 p-2 rounded-lg mr-3">
            <Settings className="text-primary w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">
              {service.title}
            </h3>
            {service.subtitle && (
              <p className="text-primary font-semibold">
                {service.subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-300 text-sm mb-6 leading-relaxed">
          {service.description}
        </p>

        {/* Features */}
        <div className="space-y-2 mb-6">
          {service.features && service.features.slice(0, 3).map((feature: string, index: number) => (
            <div key={index} className="flex items-center text-sm text-gray-400">
              <Gauge className="w-4 h-4 text-primary mr-2 flex-shrink-0" />
              {feature}
            </div>
          ))}
          {service.features && service.features.length > 3 && (
            <p className="text-xs text-gray-500">+{service.features.length - 3} características más...</p>
          )}
        </div>

        {/* Pricing */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="text-3xl font-bold text-white">
              {service.price === 'GRATIS' ? 'GRATIS' : `€${parseFloat(service.price || '0').toFixed(2)}`}
            </span>
            {service.original_price && service.original_price !== '' && (
              <span className="text-gray-500 line-through ml-2">
                €{parseFloat(service.original_price || '0').toFixed(2)}
              </span>
            )}
          </div>
          {service.badge && (
            <div className="bg-primary/20 px-3 py-1 rounded-full border border-primary/30">
              <span className="text-primary text-sm font-semibold">
                {service.badge}
              </span>
            </div>
          )}
        </div>

        {/* CTA Button */}
        <button 
          onClick={() => {
            if (user) {
              // Usuario logueado, ir directamente a configuración
              navigate(`/service-configuration/${service.id}`);
            } else {
              // Usuario no logueado, ir a login con redirección
              navigate(`/login?redirect=${encodeURIComponent(`/service-configuration/${service.id}`)}`);
            }
          }}
          className="w-full btn-primary py-3 px-6 btn-text-style btn-hover-effect shadow-subtle hover:shadow-elegant"
        >
          VER DETALLES
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section - Compact */}
      <div className="relative h-80 flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1503376780353-7e6692767b70?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1920&h=1080)'
          }}
        />
        <div className="absolute inset-0 bg-black/60" />
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold mb-4" dangerouslySetInnerHTML={{ __html: t('services.title') }}>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
            {t('services.subtitle')}
          </p>
          {loading && (
            <div className="flex items-center justify-center mt-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2 text-gray-300">{t('services.loading')}</span>
            </div>
          )}
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mt-4 max-w-md mx-auto">
              <p className="text-red-300 text-sm">Error al cargar servicios: {error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Search Section */}
      <div className="py-12 px-4 bg-gray-900/50">
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('services.searchPlaceholder')}
              className="w-full bg-gray-900/80 border border-gray-700 rounded-lg py-4 pl-12 pr-4 text-white placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-300"
            />
          </div>
        </div>
      </div>

      {/* Car Tuning Section */}
      <div id="car-tuning" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center mb-4">
              <Car className="text-primary w-8 h-8 mr-3" />
              <h2 className="text-4xl md:text-5xl font-bold">
                CAR <span className="text-primary">TUNING</span>
              </h2>
            </div>
            <p className="text-gray-400 text-lg">
              {t('services.carTuning.title')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {groupedServices.car_tuning.length > 0 ? (
              groupedServices.car_tuning.map(renderServiceCard)
            ) : (
              <div className="col-span-full text-center py-12">
                <div className="bg-gray-900/50 rounded-xl p-8 border border-gray-700">
                  <Car className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-400 mb-2">No hay servicios de Car Tuning disponibles</h3>
                  <p className="text-gray-500">Los servicios se mostrarán aquí cuando se agreguen desde el panel de administración.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>



      {/* TCU Tuning Section */}
      <div id="tcu-tuning" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center mb-4">
              <Cog className="text-primary w-8 h-8 mr-3" />
              <h2 className="text-4xl md:text-5xl font-bold">
                TCU <span className="text-primary">TUNING</span>
              </h2>
            </div>
            <p className="text-gray-400 text-lg">
              {t('services.tcuTuning.subtitle')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {groupedServices.tcu.length > 0 ? (
              groupedServices.tcu.map(renderServiceCard)
            ) : (
              <div className="col-span-full text-center py-12">
                <div className="bg-gray-900/50 rounded-xl p-8 border border-gray-700">
                  <Cog className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-400 mb-2">No hay servicios de TCU Tuning disponibles</h3>
                  <p className="text-gray-500">Los servicios se mostrarán aquí cuando se agreguen desde el panel de administración.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Otros Servicios Section */}
      <div id="other-services" className="py-20 px-4 bg-gray-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center mb-4">
              <Wrench className="text-primary w-8 h-8 mr-3" />
              <h2 className="text-4xl md:text-5xl font-bold" dangerouslySetInnerHTML={{ __html: t('services.otherServices.title') }}>
              </h2>
            </div>
            <p className="text-gray-400 text-lg">
              {t('services.otherServices.subtitle')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {groupedServices.other.length > 0 ? (
              groupedServices.other.map(renderServiceCard)
            ) : (
              <div className="col-span-full text-center py-12">
                <div className="bg-gray-900/50 rounded-xl p-8 border border-gray-700">
                  <Settings className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-400 mb-2">No hay otros servicios disponibles</h3>
                  <p className="text-gray-500">Los servicios se mostrarán aquí cuando se agreguen desde el panel de administración.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Services;