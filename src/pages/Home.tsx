import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Zap, Settings, Gauge, Shield, Clock, MessageCircle, ChevronDown, ChevronUp, RotateCcw, RefreshCw, Wrench, Star, Quote, TrendingUp, BarChart3 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useSEO } from '../hooks/useSEO'

interface FAQItemProps {
  question: string
  answer: string
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="bg-dark-primary/50 rounded-xl border border-elegant hover:border-primary/50 transition-all duration-300">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 text-left flex justify-between items-center group hover:bg-primary/5 transition-colors duration-300 rounded-xl"
      >
        <h3 className="text-lg font-semibold text-white group-hover:text-primary transition-colors duration-300">
          {question}
        </h3>
        <div className="text-primary group-hover:scale-110 transition-transform duration-300">
          {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
      </button>
      <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
        isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="px-6 pb-4">
          <p className="text-text-secondary leading-relaxed">
            {answer}
          </p>
        </div>
      </div>
    </div>
  )
}

const Home: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Usar el hook useSEO para gestionar metadatos dinámicos
  useSEO('home');
  
  // State for popular services
  const [popularServices, setPopularServices] = useState<any[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState<string | null>(null);

  // Load popular services from Supabase
  useEffect(() => {
    const loadPopularServices = async () => {
      try {
        setServicesLoading(true);
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .eq('status', 'Activo')
          .eq('popular', true)
          .order('created_at', { ascending: false })
          .limit(3);

        if (error) throw error;
        setPopularServices(data || []);
      } catch (err: any) {
        console.error('Error loading popular services:', err);
        setServicesError(err.message);
      } finally {
        setServicesLoading(false);
      }
    };

    loadPopularServices();
  }, []);
  
  // SEO structured data
  React.useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.innerHTML = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ProfessionalService",
      "name": "FILESECUFB",
      "description": "Servicio profesional de modificación de mapas ECU y tuning files. Especialistas en Stage 1, Stage 2, DPF, EGR, AdBlue.",
      "url": "https://filesecufb.com",
      "telephone": "+34630841047",
      "priceRange": "€€€",
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "ES"
      },
      "sameAs": [
        "https://wa.me/34630841047"
      ],
      "offers": [
        {
          "@type": "Offer",
          "name": "Stage 1 Tuning Files",
          "description": "Mapas optimizados para vehículos de serie",
          "price": "299.00",
          "priceCurrency": "EUR"
        },
        {
          "@type": "Offer",
          "name": "Stage 2 Performance Maps",
          "description": "Ficheros tuning para vehículos con hardware mejorado",
          "price": "499.00",
          "priceCurrency": "EUR"
        },
        {
          "@type": "Offer",
          "name": "DPF/EGR Solutions",
          "description": "Modificaciones especializadas para sistemas de emisiones",
          "price": "399.00",
          "priceCurrency": "EUR"
        }
      ]
    });
    document.head.appendChild(script);
    
    return () => {
      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  const features = [
    {
      icon: Gauge,
      titleKey: 'calibration',
    },
    {
      icon: Shield,
      titleKey: 'guaranteed',
    },
    {
      icon: Clock,
      titleKey: 'express',
    }
  ]


  const displayServices = popularServices && popularServices.length > 0 ? popularServices.slice(0, 3) : [];

  return (
    <div className="min-h-screen bg-dark-primary">
      {/* Breadcrumbs Schema para SEO */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [{
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://filesecufb.com"
          }]
        })}
      </script>
      
      {/* FAQ Schema para SEO */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "¿Qué tipos de tuning files ofrecen?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Ofrecemos ficheros modificados para Stage 1, Stage 2, solución DPF, EGR off, AdBlue off, pop & bang, hard cut limiter y calibraciones personalizadas."
              }
            },
            {
              "@type": "Question",
              "name": "¿Cuál es el tiempo de entrega?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "La entrega de ficheros tuning es inmediata para modelos en nuestra base de datos (30 minutos máximo)."
              }
            },
            {
              "@type": "Question",
              "name": "¿Son seguros los tuning files?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Sí, todas nuestras reprogramaciones respetan los límites seguros del motor."
              }
            }
          ]
        })}
      </script>
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden" aria-label="Hero section">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat" 
          style={{backgroundImage: `url('https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=1920&h=1080&fit=crop&crop=center&q=80')`}} 
          role="img" 
          aria-label="FILESECUFB - Modificación profesional de mapas ECU"
        ></div>
        <div className="absolute inset-0 bg-gradient-to-br from-dark-primary/90 via-dark-primary/70 to-transparent">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary rounded-full animate-pulse"></div>
          <div className="absolute top-3/4 right-1/3 w-1 h-1 bg-secondary rounded-full animate-pulse delay-1000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-accent rounded-full animate-pulse delay-500"></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pb-20 sm:pb-24">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 animate-fade-in tracking-tight">
            <span className="text-primary">{t('home.hero.title')}</span><br /><span className="text-white animate-pulse">{t('home.hero.subtitle')}</span>
          </h1>
          <div className="h-1 w-32 bg-gradient-to-r from-primary via-secondary to-accent mx-auto mb-12 animate-pulse"></div>
          <p className="text-xl md:text-2xl mb-12 max-w-4xl mx-auto text-text-secondary leading-relaxed animate-fade-in-up">
            {t('home.hero.description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center mb-16 animate-slide-in-left">
            <Link to="/services" className="btn-primary px-10 py-4 btn-text-style inline-flex items-center group btn-hover-effect shadow-subtle hover:shadow-elegant">
              <Zap className="mr-3 h-6 w-6 group-hover:animate-pulse" />{t('home.hero.cta.services')}<ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/register" className="btn-secondary px-10 py-4 btn-text-style btn-hover-effect shadow-subtle hover:shadow-elegant">{t('home.hero.cta.login')}</Link>
          </div>
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mt-8 sm:mt-12">
            <div className="section-center">
              <div className="stat-number text-primary">5000+</div>
              <div className="stat-label text-white">{t('home.hero.stats.files')}</div>
            </div>
            <div className="section-center">
              <div className="stat-number text-white">30min</div>
              <div className="stat-label text-white">{t('home.hero.stats.delivery')}</div>
            </div>
            <div className="section-center">
              <div className="stat-number text-accent">10+</div>
              <div className="stat-label text-white">{t('home.hero.stats.experience')}</div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 animate-bounce z-20">
          <div className="w-6 h-10 border-2 border-blue-corporate rounded-full flex justify-center">
            <div className="w-1 h-3 bg-blue-corporate rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-dark-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
              <span className="text-primary">{t('home.features.title.part1')}</span> <span className="text-white">{t('home.features.title.part2')}</span>
            </h2>
            <div className="h-1 w-24 bg-gradient-to-r from-primary to-secondary mx-auto mb-6"></div>
            <p className="text-xl text-text-secondary max-w-3xl mx-auto">
              {t('home.features.subtitle')}
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group section-center p-8 bg-gradient-dark rounded-xl border border-elegant hover:border-primary hover:shadow-elegant transition-all duration-300 hover:-translate-y-2 hover-elegant animate-fade-in-up" style={{animationDelay: `${index * 0.2}s`}}>
                <div className="text-primary mb-6 flex justify-center group-hover:animate-pulse">
                  <feature.icon className="h-12 w-12" />
                </div>
                <h3 className="text-h4 text-white mb-4 group-hover:text-primary transition-colors">
                  {t(`home.features.items.${feature.titleKey}.title`)}
                </h3>
                <p className="text-text-secondary group-hover:text-white transition-colors">
                  {t(`home.features.items.${feature.titleKey}.description`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 sm:py-20 md:py-24 bg-dark-secondary relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 via-transparent to-accent/10"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
              <span className="text-primary">{t('home.services.title.part1')}</span> <span className="text-white">{t('home.services.title.part2')}</span>
            </h2>
            <div className="h-1 w-32 bg-gradient-to-r from-primary to-secondary mx-auto mb-6"></div>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              {t('home.services.subtitle')}
            </p>
            {servicesLoading && (
              <div className="flex items-center justify-center mt-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span className="ml-2 text-gray-300 text-sm">{t('home.services.loadingPopular')}</span>
              </div>
            )}
            {servicesError && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mt-4 max-w-md mx-auto">
                <p className="text-red-300 text-sm">Error al cargar servicios: {servicesError}</p>
              </div>
            )}
          </div>
          
          {displayServices.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-8">
              {displayServices.map((service, index) => {
              // TODO: Simplificar lógica de servicios sin Supabase
              const serviceName = service.name || service.title || 'Servicio';
              const serviceDescription = service.description || 'Descripción del servicio';
              const servicePrice = service.price || '€0.00';
              const serviceBadge = service.badge;
              const serviceImage = service.image_url || 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=600&fit=crop&crop=center&q=80';
              
              return (
                <div key={service.id || index} className="group bg-dark-secondary rounded-xl border border-elegant overflow-hidden hover:border-primary hover:shadow-elegant transition-all duration-500 hover:-translate-y-3">
                  <div className="relative overflow-hidden">
                    <img
                      src={serviceImage}
                      alt={`${serviceName} - FILESECUFB tuning files profesionales`}
                      className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                      loading="lazy"
                      width="800"
                      height="600"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-primary/80 to-transparent"></div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-primary transition-colors">
                      {serviceName}
                    </h3>
                    <p className="text-text-secondary mb-4 group-hover:text-white transition-colors">
                      {serviceDescription}
                    </p>
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-3xl font-bold text-white">
                        {String(servicePrice).includes('€') ? servicePrice : `€${servicePrice}`}
                      </span>
                      {serviceBadge && (
                        <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-primary/30">
                          {serviceBadge}
                        </span>
                      )}
                    </div>
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
                      className="w-full btn-primary py-3 px-4 btn-text-style section-center block btn-hover-effect shadow-subtle hover:shadow-elegant"
                    >
                      {t('home.services.viewDetails')}
                    </button>
                  </div>
                </div>
              );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <Settings className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">No hay servicios disponibles</h3>
              <p className="text-gray-500">Los servicios se mostrarán aquí cuando se agreguen desde el panel de administración.</p>
            </div>
          )}
          
          <div className="section-center mt-16">
            <Link
              to="/services"
              className="btn-primary px-10 py-4 btn-text-style inline-flex items-center group btn-hover-effect shadow-subtle hover:shadow-elegant"
            >
              <Settings className="mr-3 h-6 w-6 group-hover:animate-spin" />
              {t('home.services.viewAll')}
              <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-16 sm:py-20 md:py-24 bg-black relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
              <span className="text-primary">{t('home.results.title.part1')}</span> <span className="text-white">{t('home.results.title.part2')}</span>
            </h2>
            <div className="h-1 w-32 bg-gradient-to-r from-primary to-secondary mx-auto mb-6"></div>
            <p className="text-xl text-text-secondary max-w-3xl mx-auto leading-relaxed">
              {t('home.results.subtitle')}
            </p>
          </div>
          
          {/* Contenedor centrado con max-width para las tarjetas */}
          <div className="w-full max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 justify-items-center">
              {/* BMW 320i Results */}
              <div className="group w-full max-w-sm bg-gradient-dark rounded-xl border border-elegant hover:border-primary hover:shadow-elegant transition-all duration-300 hover:-translate-y-2 hover-elegant">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors">
                      {t('home.results.bmw.model')}
                    </h3>
                    <TrendingUp className="h-6 w-6 text-primary group-hover:animate-pulse" />
                  </div>
                  
                  {/* Before/After Stats */}
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-text-secondary">{t('home.results.power')}:</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-red-400">{t('home.results.bmw.originalPower')}</span>
                        <ArrowRight className="h-4 w-4 text-primary" />
                        <span className="text-green-400 font-bold">{t('home.results.bmw.tunedPower')}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-text-secondary">{t('home.results.torque')}:</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-red-400">{t('home.results.bmw.originalTorque')}</span>
                        <ArrowRight className="h-4 w-4 text-primary" />
                        <span className="text-green-400 font-bold">{t('home.results.bmw.tunedTorque')}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Visual Bar Chart */}
                  <div className="space-y-3 mb-6">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-text-secondary">{t('home.results.power')}</span>
                        <span className="text-primary font-bold">{t('home.results.bmw.powerIncrease')}</span>
                      </div>
                      <div className="w-full bg-dark-secondary rounded-full h-2">
                        <div className="bg-gradient-to-r from-red-400 to-green-400 h-2 rounded-full" style={{width: '75%'}}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-text-secondary">{t('home.results.torque')}</span>
                        <span className="text-primary font-bold">{t('home.results.bmw.torqueIncrease')}</span>
                      </div>
                      <div className="w-full bg-dark-secondary rounded-full h-2">
                        <div className="bg-gradient-to-r from-red-400 to-green-400 h-2 rounded-full" style={{width: '80%'}}></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-primary/10 rounded-lg p-3 text-center">
                    <span className="text-primary font-bold text-lg">{t('home.results.bmw.powerGain')}</span>
                  </div>
                </div>
              </div>
            
            {/* Audi A4 Results */}
            <div className="group w-full max-w-sm bg-gradient-dark rounded-xl border border-elegant hover:border-secondary hover:shadow-elegant transition-all duration-300 hover:-translate-y-2 hover-elegant">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white group-hover:text-secondary transition-colors">
                    {t('home.results.audi.model')}
                  </h3>
                  <BarChart3 className="h-6 w-6 text-secondary group-hover:animate-pulse" />
                </div>
                
                {/* Before/After Stats */}
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">{t('home.results.power')}:</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-red-400">{t('home.results.audi.originalPower')}</span>
                      <ArrowRight className="h-4 w-4 text-secondary" />
                      <span className="text-green-400 font-bold">{t('home.results.audi.tunedPower')}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">{t('home.results.torque')}:</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-red-400">{t('home.results.audi.originalTorque')}</span>
                      <ArrowRight className="h-4 w-4 text-secondary" />
                      <span className="text-green-400 font-bold">{t('home.results.audi.tunedTorque')}</span>
                    </div>
                  </div>
                </div>
                
                {/* Visual Bar Chart */}
                <div className="space-y-3 mb-6">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-text-secondary">{t('home.results.power')}</span>
                      <span className="text-secondary font-bold">{t('home.results.audi.powerIncrease')}</span>
                    </div>
                    <div className="w-full bg-dark-secondary rounded-full h-2">
                      <div className="bg-gradient-to-r from-red-400 to-green-400 h-2 rounded-full" style={{width: '78%'}}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-text-secondary">{t('home.results.torque')}</span>
                      <span className="text-secondary font-bold">{t('home.results.audi.torqueIncrease')}</span>
                    </div>
                    <div className="w-full bg-dark-secondary rounded-full h-2">
                      <div className="bg-gradient-to-r from-red-400 to-green-400 h-2 rounded-full" style={{width: '82%'}}></div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-secondary/10 rounded-lg p-3 text-center">
                  <span className="text-secondary font-bold text-lg">{t('home.results.audi.powerGain')}</span>
                </div>
              </div>
            </div>
            
            {/* Golf GTI Results */}
            <div className="group w-full max-w-sm bg-gradient-dark rounded-xl border border-elegant hover:border-accent hover:shadow-elegant transition-all duration-300 hover:-translate-y-2 hover-elegant">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white group-hover:text-accent transition-colors">
                    {t('home.results.golf.model')}
                  </h3>
                  <TrendingUp className="h-6 w-6 text-accent group-hover:animate-pulse" />
                </div>
                
                {/* Before/After Stats */}
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">{t('home.results.power')}:</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-red-400">{t('home.results.golf.originalPower')}</span>
                      <ArrowRight className="h-4 w-4 text-accent" />
                      <span className="text-green-400 font-bold">{t('home.results.golf.tunedPower')}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">{t('home.results.torque')}:</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-red-400">{t('home.results.golf.originalTorque')}</span>
                      <ArrowRight className="h-4 w-4 text-accent" />
                      <span className="text-green-400 font-bold">{t('home.results.golf.tunedTorque')}</span>
                    </div>
                  </div>
                </div>
                
                {/* Visual Bar Chart */}
                <div className="space-y-3 mb-6">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-text-secondary">{t('home.results.power')}</span>
                      <span className="text-accent font-bold">{t('home.results.golf.powerIncrease')}</span>
                    </div>
                    <div className="w-full bg-dark-secondary rounded-full h-2">
                      <div className="bg-gradient-to-r from-red-400 to-green-400 h-2 rounded-full" style={{width: '74%'}}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-text-secondary">{t('home.results.torque')}</span>
                      <span className="text-accent font-bold">{t('home.results.golf.torqueIncrease')}</span>
                    </div>
                    <div className="w-full bg-dark-secondary rounded-full h-2">
                      <div className="bg-gradient-to-r from-red-400 to-green-400 h-2 rounded-full" style={{width: '77%'}}></div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-accent/10 rounded-lg p-3 text-center">
                  <span className="text-accent font-bold text-lg">{t('home.results.golf.powerGain')}</span>
                </div>
              </div>
            </div>
          </div>
          </div>
          
          <div className="section-center mt-16">
            <a
              href="https://wa.me/34630841047?text=Hola,%20necesito%20información%20sobre%20tuning%20files%20profesionales"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary px-10 py-4 btn-text-style inline-flex items-center group btn-hover-effect shadow-subtle hover:shadow-elegant"
            >
              <MessageCircle className="mr-3 h-6 w-6 group-hover:animate-pulse" />
              {t('home.results.contact')}
              <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </section>

      {/* Process Section - Completely Redesigned */}
      <section id="process" className="py-16 sm:py-20 md:py-24 bg-dark-secondary relative overflow-hidden">
        {/* Clean Background Pattern */}
        <div className="absolute inset-0 opacity-3">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-corporate/5 via-transparent to-blue-corporate/5"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="text-center mb-20">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
              <span className="text-blue-corporate">{t('home.process.title.part1')}</span> <span className="text-white">{t('home.process.title.part2')}</span>
            </h2>
            <div className="h-1 w-32 bg-blue-corporate mx-auto mb-8 rounded-full"></div>
            <p className="text-xl md:text-2xl text-text-secondary max-w-4xl mx-auto leading-relaxed">
              {t('home.process.subtitle')}
            </p>
          </div>
          
          {/* Process Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 md:gap-8 lg:gap-12">
            {[
              {
                step: '1',
                title: t('home.process.steps.reception.title'),
                description: t('home.process.steps.reception.description')
              },
              {
                step: '2',
                title: t('home.process.steps.analysis.title'),
                description: t('home.process.steps.analysis.description')
              },
              {
                step: '3',
                title: t('home.process.steps.optimization.title'),
                description: t('home.process.steps.optimization.description')
              },
              {
                step: '4',
                title: t('home.process.steps.delivery.title'),
                description: t('home.process.steps.delivery.description')
              }
            ].map((item, index) => (
              <div key={index} className="group text-center relative">
                {/* Connection Line for Desktop */}
                {index < 3 && (
                  <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-blue-corporate/60 to-transparent z-0"></div>
                )}
                
                {/* Step Circle */}
                <div className="relative z-10 mb-6">
                  <div className="w-24 h-24 rounded-full bg-blue-corporate flex items-center justify-center mx-auto shadow-lg group-hover:shadow-blue-corporate/30 transition-all duration-300 group-hover:scale-110">
                    <span className="text-3xl font-bold text-white">{item.step}</span>
                  </div>
                </div>
                
                {/* Step Content */}
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-white mb-4 btn-text-style group-hover:text-blue-corporate transition-colors duration-300">
                    {item.title}
                  </h3>
                  <p className="text-text-secondary group-hover:text-white transition-colors duration-300 leading-relaxed px-2">
                    {item.description}
                  </p>
                </div>
                
                {/* Hover Effect Background */}
                <div className="absolute inset-0 bg-blue-corporate/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -m-4"></div>
              </div>
            ))}
          </div>
          
          {/* Bottom Accent */}
          <div className="text-center mt-20">
            <div className="inline-flex items-center space-x-2 text-blue-corporate">
              <div className="w-8 h-0.5 bg-blue-corporate rounded-full"></div>
              <span className="text-sm font-semibold uppercase tracking-widest">{t('home.process.professional')}</span>
              <div className="w-8 h-0.5 bg-blue-corporate rounded-full"></div>
            </div>
          </div>
        </div>
      </section>

      {/* After-Sales Support Section */}
      <section className="py-16 sm:py-20 md:py-24 bg-black relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 opacity-3">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
              <span className="text-primary">{t('home.support.title.part1')}</span> <span className="text-white">{t('home.support.title.part2')}</span>
            </h2>
            <div className="h-1 w-32 bg-gradient-to-r from-primary to-secondary mx-auto mb-6"></div>
            <p className="text-xl text-text-secondary max-w-3xl mx-auto leading-relaxed">
              {t('home.support.subtitle')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Reversión a Stock */}
            <div className="bg-gradient-dark section-center p-8 hover:shadow-elegant hover-elegant duration-300 rounded-xl border border-elegant">
              <div className="text-primary mb-6 flex justify-center group-hover:animate-pulse">
                <RotateCcw className="h-16 w-16" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 text-center group-hover:text-primary transition-colors">
                {t('home.support.services.reversion.title')}
              </h3>
              <p className="text-text-secondary group-hover:text-white transition-colors text-center leading-relaxed">
                {t('home.support.services.reversion.description')}
              </p>
            </div>
            
            {/* Actualizaciones */}
            <div className="bg-gradient-dark section-center p-8 hover:shadow-elegant hover-elegant duration-300 rounded-xl border border-elegant">
              <div className="text-secondary mb-6 flex justify-center group-hover:animate-pulse">
                <RefreshCw className="h-16 w-16" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 text-center group-hover:text-secondary transition-colors">
                {t('home.support.services.updates.title')}
              </h3>
              <p className="text-text-secondary group-hover:text-white transition-colors text-center leading-relaxed">
                {t('home.support.services.updates.description')}
              </p>
            </div>
            
            {/* Mantenimiento */}
            <div className="bg-gradient-dark section-center p-8 hover:shadow-elegant hover-elegant duration-300 rounded-xl border border-elegant">
              <div className="text-accent mb-6 flex justify-center group-hover:animate-pulse">
                <Wrench className="h-16 w-16" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 text-center group-hover:text-accent transition-colors">
                {t('home.support.services.maintenance.title')}
              </h3>
              <p className="text-text-secondary group-hover:text-white transition-colors text-center leading-relaxed">
                {t('home.support.services.maintenance.description')}
              </p>
            </div>
          </div>
          
          {/* Bottom CTA */}
          <div className="text-center mt-16">
            <div className="inline-flex items-center space-x-2 text-primary mb-8">
              <div className="w-8 h-0.5 bg-primary rounded-full"></div>
              <span className="text-sm font-semibold uppercase tracking-widest">{t('home.support.complete')}</span>
              <div className="w-8 h-0.5 bg-primary rounded-full"></div>
            </div>
            <p className="text-lg text-text-secondary mb-8">
              {t('home.support.question')}
            </p>
            <a
              href="https://wa.me/34630841047"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary px-10 py-4 btn-text-style inline-flex items-center group btn-hover-effect shadow-subtle hover:shadow-elegant"
            >
              <MessageCircle className="mr-3 h-6 w-6 group-hover:animate-pulse" />
              {t('home.support.contact')}
              <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-dark-secondary">
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "AggregateRating",
            "itemReviewed": {
              "@type": "LocalBusiness",
              "name": "Tuning Extremo"
            },
            "ratingValue": "4.8",
            "reviewCount": "127",
            "bestRating": "5"
          })}
        </script>
        
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight">
              {t('home.testimonials.title.part1')} <span className="text-primary">{t('home.testimonials.title.part2')}</span>
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto mb-8">{t('home.testimonials.subtitle')}</p>
            
            {/* Aggregate Rating - Mobile Optimized */}
            <div className="inline-flex flex-col sm:flex-row items-center bg-gradient-dark rounded-xl border border-elegant px-4 sm:px-6 py-4 sm:py-3 shadow-elegant">
              <div className="flex items-center mb-2 sm:mb-0 sm:mr-4">
                <div className="flex mr-2 gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-5 w-5 sm:h-4 sm:w-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <span className="text-xl sm:text-lg font-bold text-white mr-1">4.8</span>
                <span className="text-base sm:text-sm text-text-secondary">/5</span>
              </div>
              <div className="border-t sm:border-t-0 sm:border-l border-elegant pt-2 sm:pt-0 sm:pl-4">
                <span className="text-base sm:text-sm font-medium text-white">127 {t('home.testimonials.reviews')}</span>
              </div>
            </div>
          </div>
          
          {/* Testimonials Grid - Mobile Optimized */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 max-w-7xl mx-auto px-2 sm:px-0">
            {/* Testimonio 1 */}
            <div className="group bg-gradient-dark rounded-xl border border-elegant p-5 sm:p-4 hover:border-primary hover:shadow-elegant transition-all duration-300 hover:-translate-y-1">
              <script type="application/ld+json">
                {JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "Review",
                  "author": {"@type": "Person", "name": "Carlos M."},
                  "itemReviewed": {"@type": "LocalBusiness", "name": "FILESECUFB"},
                  "reviewRating": {"@type": "Rating", "ratingValue": "5", "bestRating": "5"},
                  "reviewBody": "Excelente servicio FILESECUFB. El Stage 1 para mi BMW funciona perfectamente.",
                  "datePublished": "2024-01-15"
                })}
              </script>
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-4 w-4 sm:h-3 sm:w-3 text-yellow-400 fill-current" />
                  ))}
                </div>
                <Quote className="h-5 w-5 sm:h-4 sm:w-4 text-primary" />
              </div>
              <p className="text-text-secondary text-base sm:text-sm mb-4 sm:mb-3 leading-relaxed">
                "{t('home.testimonials.items.carlos.text')}"
              </p>
              <div className="flex justify-between items-center text-sm sm:text-xs">
                <span className="font-semibold text-white">Carlos M.</span>
                <span className="text-text-secondary">BMW 320i</span>
              </div>
            </div>
            
            {/* Testimonio 2 */}
            <div className="group bg-gradient-dark rounded-xl border border-elegant p-5 sm:p-4 hover:border-secondary hover:shadow-elegant transition-all duration-300 hover:-translate-y-1">
              <script type="application/ld+json">
                {JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "Review",
                  "author": {"@type": "Person", "name": "Ana L."},
                  "itemReviewed": {"@type": "LocalBusiness", "name": "FILESECUFB"},
                  "reviewRating": {"@type": "Rating", "ratingValue": "5", "bestRating": "5"},
                  "reviewBody": "Mapas de calidad profesional. FILESECUFB cumple con la entrega rápida prometida.",
                  "datePublished": "2024-02-03"
                })}
              </script>
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-4 w-4 sm:h-3 sm:w-3 text-yellow-400 fill-current" />
                  ))}
                </div>
                <Quote className="h-5 w-5 sm:h-4 sm:w-4 text-secondary" />
              </div>
              <p className="text-text-secondary text-base sm:text-sm mb-4 sm:mb-3 leading-relaxed">
                "{t('home.testimonials.items.ana.text')}"
              </p>
              <div className="flex justify-between items-center text-sm sm:text-xs">
                <span className="font-semibold text-white">Ana L.</span>
                <span className="text-text-secondary">Audi A4</span>
              </div>
            </div>
            
            {/* Testimonio 3 */}
            <div className="group bg-gradient-dark rounded-xl border border-elegant p-5 sm:p-4 hover:border-accent hover:shadow-elegant transition-all duration-300 hover:-translate-y-1">
              <script type="application/ld+json">
                {JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "Review",
                  "author": {"@type": "Person", "name": "Miguel R."},
                  "itemReviewed": {"@type": "LocalBusiness", "name": "FILESECUFB"},
                  "reviewRating": {"@type": "Rating", "ratingValue": "5", "bestRating": "5"},
                  "reviewBody": "Los mejores tuning files del mercado. FILESECUFB transformó mi Golf GTI.",
                  "datePublished": "2024-01-28"
                })}
              </script>
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-4 w-4 sm:h-3 sm:w-3 text-yellow-400 fill-current" />
                  ))}
                </div>
                <Quote className="h-5 w-5 sm:h-4 sm:w-4 text-accent" />
              </div>
              <p className="text-text-secondary text-base sm:text-sm mb-4 sm:mb-3 leading-relaxed">
                "{t('home.testimonials.items.miguel.text')}"
              </p>
              <div className="flex justify-between items-center text-sm sm:text-xs">
                <span className="font-semibold text-white">Miguel R.</span>
                <span className="text-text-secondary">Golf GTI</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 sm:py-20 md:py-24 bg-black relative overflow-hidden">
        <div className="absolute inset-0 opacity-3">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5"></div>
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
              <span className="text-primary">{t('home.faq.title.part1')}</span> <span className="text-white">{t('home.faq.title.part2')}</span>
            </h2>
            <div className="h-1 w-32 bg-gradient-to-r from-primary to-secondary mx-auto mb-6"></div>
            <p className="text-xl text-text-secondary max-w-3xl mx-auto">
              {t('home.faq.subtitle.part1')} <span className="text-primary font-semibold">{t('home.faq.subtitle.part2')}</span>
            </p>
          </div>
          
          <div className="space-y-4">
            <FAQItem 
              question={t('home.faq.items.types.question')}
              answer={t('home.faq.items.types.answer')}
            />
            <FAQItem 
              question={t('home.faq.items.delivery.question')}
              answer={t('home.faq.items.delivery.answer')}
            />
            <FAQItem 
              question={t('home.faq.items.warranty.question')}
              answer={t('home.faq.items.warranty.answer')}
            />
            <FAQItem 
              question={t('home.faq.items.ecus.question')}
              answer={t('home.faq.items.ecus.answer')}
            />
            <FAQItem 
              question={t('home.faq.items.safety.question')}
              answer={t('home.faq.items.safety.answer')}
            />
            <FAQItem 
              question={t('home.faq.items.request.question')}
              answer={t('home.faq.items.request.answer')}
            />
          </div>
        </div>
      </section>




      {/* WhatsApp Community Section */}
      <section className="py-16 sm:py-20 md:py-24 bg-[#1A1A1A] relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-64 h-64 bg-primary/3 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-secondary/3 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
            <span className="text-primary">{t('home.whatsapp.title.part1')}</span><br />
            <span className="text-white">{t('home.whatsapp.title.part2')}</span>
          </h2>
          
          <div className="h-1 w-24 bg-gradient-to-r from-primary to-secondary mx-auto mb-8"></div>
          
          <p className="text-xl text-text-secondary max-w-3xl mx-auto mb-12 leading-relaxed">
            {t('home.whatsapp.description.part1')} <span className="text-primary font-semibold">{t('home.whatsapp.description.part2')}</span>. {t('home.whatsapp.description.part3')} <span className="text-white font-semibold">{t('home.whatsapp.description.part4')}</span>.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center mb-8">
            <a
              href="https://wa.me/34630841047"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary px-10 py-4 btn-text-style inline-flex items-center group btn-hover-effect shadow-subtle hover:shadow-elegant"
            >
              <MessageCircle className="mr-3 h-6 w-6 group-hover:animate-pulse" />
              {t('home.whatsapp.button')}
              <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;