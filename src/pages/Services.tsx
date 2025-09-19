import React, { useState, useMemo, useEffect } from 'react';
import { Search, Settings, Gauge, Wrench, Cog, Car, Zap, Loader2, Hammer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useSEO } from '../hooks/useSEO';
import { useTranslation } from 'react-i18next';
import { useServices, getServiceTitle, getServiceSubtitle, getServiceDescription, getServiceFeatures, getServiceBadge, Service } from '../hooks/useServices';
import { useServiceCategories, getCategoryTitle, getCategorySubtitle } from '../hooks/useServiceCategories';
import { useCategoryContext } from '../contexts/CategoryContext';

const Services = () => {
  const { t, i18n } = useTranslation(['translation', 'services']);
  const language = i18n.language;
  
  // Función para obtener traducciones de services
  const getServicesTranslation = (key: string) => {
    const translations = {
      es: {
        all: 'Todos',
        searchPlaceholder: 'BUSCAR SERVICIOS...'
      },
      en: {
        all: 'All',
        searchPlaceholder: 'SEARCH SERVICES...'
      }
    };
    return translations[language as keyof typeof translations]?.[key as keyof typeof translations.es] || translations.en[key as keyof typeof translations.en];
  };
  const { services, loading, error } = useServices();
  const { categories, loading: categoriesLoading, error: categoriesError } = useServiceCategories();
  const { refreshTrigger } = useCategoryContext();
  
  // Debug logs para rastrear cambios en categorías
  useEffect(() => {
    console.log('🔍 Services: Categories updated', { 
      categoriesCount: categories.length, 
      categories: categories.map(c => ({ id: c.id, icon: c.icon, title: c.title_part1 + ' ' + c.title_part2 })) 
    });
  }, [categories]);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [forceRender, setForceRender] = useState(0);
  
  // Usar el hook useSEO para gestionar metadatos dinámicos
  useSEO('services');

  // Available icons mapping
  const availableIcons = [
    { name: 'Car', component: Car },
    { name: 'Settings', component: Settings },
    { name: 'Zap', component: Zap },
    { name: 'Cog', component: Cog },
    { name: 'Hammer', component: Hammer },
    { name: 'Gauge', component: Gauge }
  ];

  // Get icon component by name
  const getIconComponent = (iconName: string) => {
    const icon = availableIcons.find(i => i.name === iconName);
    return icon ? icon.component : Car;
  };

  // Force re-render when language changes
  useEffect(() => {
    console.log('[Services] Language changed to:', language);
    setForceRender(prev => prev + 1);
  }, [language]);

  // Agrupar servicios por categoría
  const groupedServices = useMemo(() => {
    const grouped: { [key: string]: Service[] } = {};
    
    categories.forEach(category => {
      const categoryTitle = getCategoryTitle(category, language);
      grouped[categoryTitle] = services.filter(service => {
        // Normalize both strings for comparison
        const serviceCategoryNormalized = service.category.toLowerCase().trim().replace(/\s+/g, ' ');
        const categoryTitleNormalized = categoryTitle.toLowerCase().trim().replace(/\s+/g, ' ');
        
        // Also check against the original Spanish category title
        const spanishCategoryTitle = `${category.title_part1} ${category.title_part2}`.toLowerCase().trim().replace(/\s+/g, ' ');
        
        // Try different matching strategies
        return serviceCategoryNormalized === categoryTitleNormalized ||
               serviceCategoryNormalized === spanishCategoryTitle ||
               serviceCategoryNormalized.includes(categoryTitleNormalized) ||
               categoryTitleNormalized.includes(serviceCategoryNormalized) ||
               serviceCategoryNormalized.includes(spanishCategoryTitle) ||
               spanishCategoryTitle.includes(serviceCategoryNormalized);
      });
    });
    
    return grouped;
  }, [services, categories, language, forceRender]);
  
  // Filtrar servicios por término de búsqueda y categoría
  const filteredServices = useMemo(() => {
    let filtered = services;
    
    // Filtrar por categoría seleccionada
    if (selectedCategory !== 'all') {
      // Find the category object that matches the selected category
      const selectedCategoryObj = categories.find(cat => getCategoryTitle(cat, language) === selectedCategory);
      
      filtered = filtered.filter(service => {
        if (!selectedCategoryObj) return false;
        
        // Use the same matching logic as groupedServices
        const serviceCategoryNormalized = service.category.toLowerCase().trim().replace(/\s+/g, ' ');
        const categoryTitleNormalized = selectedCategory.toLowerCase().trim().replace(/\s+/g, ' ');
        const spanishCategoryTitle = `${selectedCategoryObj.title_part1} ${selectedCategoryObj.title_part2}`.toLowerCase().trim().replace(/\s+/g, ' ');
        
        return serviceCategoryNormalized === categoryTitleNormalized ||
               serviceCategoryNormalized === spanishCategoryTitle ||
               serviceCategoryNormalized.includes(categoryTitleNormalized) ||
               categoryTitleNormalized.includes(serviceCategoryNormalized) ||
               serviceCategoryNormalized.includes(spanishCategoryTitle) ||
               spanishCategoryTitle.includes(serviceCategoryNormalized);
      });
    }
    
    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(service => 
        getServiceTitle(service, language).toLowerCase().includes(searchTerm.toLowerCase()) ||
        getServiceDescription(service, language).toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  }, [services, searchTerm, selectedCategory, categories, language, forceRender]);
  

  
  // Servicios eliminados - ahora solo se usan los de Supabase

  

  // Servicios de TCU eliminados - solo Supabase

  // Servicios otros eliminados - solo Supabase

  const renderServiceCard = (service: Service, category?: any) => (
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
            {(() => {
              const IconComponent = category ? getIconComponent(category.icon) : Settings;
              return <IconComponent className="text-primary w-6 h-6" />;
            })()}
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">
              {getServiceTitle(service, language)}
            </h3>
            {getServiceSubtitle(service, language) && (
              <p className="text-primary font-semibold">
                {getServiceSubtitle(service, language)}
              </p>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-300 text-sm mb-6 leading-relaxed">
          {getServiceDescription(service, language)}
        </p>

        {/* Features */}
        <div className="space-y-2 mb-6">
          {getServiceFeatures(service, language).slice(0, 3).map((feature: string, index: number) => (
            <div key={index} className="flex items-center text-sm text-gray-400">
              <Gauge className="w-4 h-4 text-primary mr-2 flex-shrink-0" />
              {feature}
            </div>
          ))}
          {getServiceFeatures(service, language).length > 3 && (
            <p className="text-xs text-gray-500">+{getServiceFeatures(service, language).length - 3} características más...</p>
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
          {getServiceBadge(service, language) && (
            <div className="bg-primary/20 px-3 py-1 rounded-full border border-primary/30">
              <span className="text-primary text-sm font-semibold">
                {getServiceBadge(service, language)}
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
        >{t('services.hireButton')}</button>
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
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            SERVICIOS TUNING
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
            DESCUBRE NUESTRA GAMA COMPLETA DE SERVICIOS DE OPTIMIZACIÓN EXTREMA
          </p>
          {loading && (
            <div className="flex items-center justify-center mt-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2 text-gray-300">{t('loading', { ns: 'services' })}</span>
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
        <div className="max-w-4xl mx-auto">
          {/* Search Input */}
          <div className="relative max-w-2xl mx-auto mb-8">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={getServicesTranslation('searchPlaceholder')}
              className="w-full bg-gray-900/80 border border-gray-700 rounded-lg py-4 pl-12 pr-4 text-white placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-300"
            />
          </div>
          
          {/* Category Filter Buttons - Horizontal Scrollable */}
          <div className="relative">
            {/* Gradient indicators for scroll */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-gray-900/50 to-transparent z-10 pointer-events-none md:hidden" />
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-gray-900/50 to-transparent z-10 pointer-events-none md:hidden" />
            
            {/* Scrollable container */}
            <div className="overflow-x-auto scrollbar-hide pb-2">
              <div className="flex gap-3 px-4 md:justify-center md:flex-wrap md:px-0" style={{ minWidth: 'max-content' }}>
                {/* Botón "Todos" */}
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`flex-shrink-0 px-4 py-3 md:px-6 rounded-lg font-semibold transition-all duration-300 flex items-center space-x-2 text-sm md:text-base ${
                    selectedCategory === 'all'
                      ? 'bg-primary text-white shadow-lg scale-105'
                      : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700/80 hover:text-white border border-gray-600'
                  }`}
                >
                  <Settings className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="whitespace-nowrap">{getServicesTranslation('all')}</span>
                </button>
                
                {/* Botones de categorías */}
                {categories.map((category) => {
                  const categoryTitle = getCategoryTitle(category, language);
                  const IconComponent = getIconComponent(category.icon);
                  
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(categoryTitle)}
                      className={`flex-shrink-0 px-4 py-3 md:px-6 rounded-lg font-semibold transition-all duration-300 flex items-center space-x-2 text-sm md:text-base ${
                        selectedCategory === categoryTitle
                          ? 'bg-primary text-white shadow-lg scale-105'
                          : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700/80 hover:text-white border border-gray-600'
                      }`}
                    >
                      <IconComponent className="w-4 h-4 md:w-5 md:h-5" />
                      <span className="whitespace-nowrap">{categoryTitle}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Category Sections */}
      {categoriesLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-gray-300">Cargando categorías...</span>
        </div>
      ) : categoriesError ? (
        <div className="text-center py-12">
          <p className="text-red-400">Error al cargar las categorías: {categoriesError}</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No hay categorías disponibles</p>
        </div>
      ) : selectedCategory === 'all' ? (
        // Mostrar todas las categorías cuando se selecciona "Todos"
        categories.map((category) => {
          const categoryTitle = getCategoryTitle(category, language);
          const categorySubtitle = getCategorySubtitle(category, language);
          const categoryServices = groupedServices[categoryTitle] || [];
          
          // Filtrar servicios por término de búsqueda si existe
          const displayServices = searchTerm 
            ? categoryServices.filter(service => 
                getServiceTitle(service, language).toLowerCase().includes(searchTerm.toLowerCase()) ||
                getServiceDescription(service, language).toLowerCase().includes(searchTerm.toLowerCase()) ||
                service.category.toLowerCase().includes(searchTerm.toLowerCase())
              )
            : categoryServices;
          
          // Solo mostrar la categoría si tiene servicios después del filtrado
          if (searchTerm && displayServices.length === 0) return null;
          
          return (
            <div key={category.id} id={category.id} className="py-20 px-4">
              <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                  <div className="flex items-center justify-center mb-4">
                    {(() => {
                      const IconComponent = getIconComponent(category.icon);
                      return <IconComponent className="text-primary w-8 h-8 mr-3" />;
                    })()}
                    <h2 className="text-4xl md:text-5xl font-bold">
                      {getCategoryTitle(category, language).toUpperCase()}
                    </h2>
                  </div>
                  <p className="text-gray-400 text-lg">
                    {categorySubtitle}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {displayServices.length > 0 ? (
                    displayServices.map(service => renderServiceCard(service, category))
                  ) : (
                    <div className="col-span-full text-center py-12">
                      <div className="bg-gray-900/50 rounded-xl p-8 border border-gray-700">
                        {(() => {
                          console.log('🎨 Services: Rendering icon for category', { 
                            categoryId: category.id, 
                            icon: category.icon, 
                            title: category.title_part1 + ' ' + category.title_part2 
                          });
                          const IconComponent = getIconComponent(category.icon);
                          return <IconComponent className="w-16 h-16 text-gray-600 mx-auto mb-4" />;
                        })()}
                        <h3 className="text-xl font-semibold text-gray-400 mb-2">No hay servicios disponibles para {categoryTitle}</h3>
                        <p className="text-gray-500">Los servicios se mostrarán aquí cuando se agreguen desde el panel de administración.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })
      ) : (
        // Mostrar solo la categoría seleccionada
        (() => {
          const selectedCategoryObj = categories.find(cat => getCategoryTitle(cat, language) === selectedCategory);
          if (!selectedCategoryObj) return null;
          
          const categoryTitle = getCategoryTitle(selectedCategoryObj, language);
          const categorySubtitle = getCategorySubtitle(selectedCategoryObj, language);
          
          return (
            <div key={selectedCategoryObj.id} id={selectedCategoryObj.id} className="py-20 px-4">
              <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                  <div className="flex items-center justify-center mb-4">
                    {(() => {
                      const IconComponent = getIconComponent(selectedCategoryObj.icon);
                      return <IconComponent className="text-primary w-8 h-8 mr-3" />;
                    })()}
                    <h2 className="text-4xl md:text-5xl font-bold">
                      {categoryTitle.toUpperCase()}
                    </h2>
                  </div>
                  <p className="text-gray-400 text-lg">
                    {categorySubtitle}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredServices.length > 0 ? (
                    filteredServices.map(service => renderServiceCard(service, selectedCategoryObj))
                  ) : (
                    <div className="col-span-full text-center py-12">
                      <div className="bg-gray-900/50 rounded-xl p-8 border border-gray-700">
                        {(() => {
                          const IconComponent = getIconComponent(selectedCategoryObj.icon);
                          return <IconComponent className="w-16 h-16 text-gray-600 mx-auto mb-4" />;
                        })()}
                        <h3 className="text-xl font-semibold text-gray-400 mb-2">
                          {searchTerm 
                            ? `No se encontraron servicios para "${searchTerm}" en ${categoryTitle}`
                            : `No hay servicios disponibles para ${categoryTitle}`
                          }
                        </h3>
                        <p className="text-gray-500">
                          {searchTerm 
                            ? 'Intenta con otros términos de búsqueda o selecciona otra categoría.'
                            : 'Los servicios se mostrarán aquí cuando se agreguen desde el panel de administración.'
                          }
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()
      )}
    </div>
  );
};

export default Services;