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
  if (language === 'en' && service.translations?.en?.title) {
    return service.translations.en.title;
  }
  return service.title;
};

export const getServiceSubtitle = (service: Service, language: string): string => {
  if (language === 'en' && service.translations?.en?.subtitle) {
    return service.translations.en.subtitle;
  }
  return service.subtitle || '';
};

export const getServiceDescription = (service: Service, language: string): string => {
  if (language === 'en' && service.translations?.en?.description) {
    return service.translations.en.description;
  }
  return service.description;
};

export const getServiceFeatures = (service: Service, language: string): string[] => {
  if (language === 'en' && service.translations?.en?.features) {
    return service.translations.en.features;
  }
  return service.features || [];
};