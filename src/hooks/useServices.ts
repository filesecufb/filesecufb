import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Service {
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
  status: 'Activo' | 'Inactivo';
  is_additional?: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  translations?: {
    en?: {
      badge?: string;
      title?: string;
      subtitle?: string;
      description?: string;
      features?: string[];
    };
    es?: {
      badge?: string;
      title?: string;
      subtitle?: string;
      description?: string;
      features?: string[];
    };
  };
}

export const useServices = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('services')
        .select('*')
        .eq('status', 'Activo')
        .order('created_at', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      setServices(data || []);
    } catch (err) {
      console.error('Error fetching services:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  return {
    services,
    loading,
    error,
    refetch: fetchServices
  };
};

// Helper functions for service translations
export const getServiceTitle = (service: Service, language: string): string => {
  // Priorizar el idioma solicitado
  if (language === 'en' && service.translations?.en?.title) {
    return service.translations.en.title;
  }
  if (language === 'es' && service.translations?.es?.title) {
    return service.translations.es.title;
  }
  // Fallback al español si no hay traducción en el idioma solicitado
  if (language === 'en' && service.translations?.es?.title) {
    return service.translations.es.title;
  }
  // Finalmente usar el valor original
  return service.title;
};

export const getServiceSubtitle = (service: Service, language: string): string => {
  // Priorizar el idioma solicitado
  if (language === 'en' && service.translations?.en?.subtitle) {
    return service.translations.en.subtitle;
  }
  if (language === 'es' && service.translations?.es?.subtitle) {
    return service.translations.es.subtitle;
  }
  // Fallback al español si no hay traducción en el idioma solicitado
  if (language === 'en' && service.translations?.es?.subtitle) {
    return service.translations.es.subtitle;
  }
  // Finalmente usar el valor original
  return service.subtitle || '';
};

export const getServiceDescription = (service: Service, language: string): string => {
  // Priorizar el idioma solicitado
  if (language === 'en' && service.translations?.en?.description) {
    return service.translations.en.description;
  }
  if (language === 'es' && service.translations?.es?.description) {
    return service.translations.es.description;
  }
  // Fallback al español si no hay traducción en el idioma solicitado
  if (language === 'en' && service.translations?.es?.description) {
    return service.translations.es.description;
  }
  // Finalmente usar el valor original
  return service.description;
};

export const getServiceFeatures = (service: Service, language: string): string[] => {
  // Priorizar el idioma solicitado
  if (language === 'en' && service.translations?.en?.features) {
    return service.translations.en.features;
  }
  if (language === 'es' && service.translations?.es?.features) {
    return service.translations.es.features;
  }
  // Fallback al español si no hay traducción en el idioma solicitado
  if (language === 'en' && service.translations?.es?.features) {
    return service.translations.es.features;
  }
  // Finalmente usar el valor original
  return service.features || [];
};

export const getServiceBadge = (service: Service, language: string): string => {
  // Priorizar el idioma solicitado
  if (language === 'en' && service.translations?.en?.badge) {
    return service.translations.en.badge;
  }
  if (language === 'es' && service.translations?.es?.badge) {
    return service.translations.es.badge;
  }
  // Fallback al español si no hay traducción en el idioma solicitado
  if (language === 'en' && service.translations?.es?.badge) {
    return service.translations.es.badge;
  }
  // Finalmente usar el valor original
  return service.badge || '';
};