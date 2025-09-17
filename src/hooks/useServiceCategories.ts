import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useCategoryContext } from '../contexts/CategoryContext';

export interface ServiceCategory {
  id: string;
  title_part1: string;
  title_part2: string;
  subtitle: string;
  description?: string;
  status: 'active' | 'inactive';
  sort_order: number;
  icon: string;
  translations?: {
    title_part1?: string;
    title_part2?: string;
    subtitle?: string;
  };
  created_at: string;
  updated_at: string;
}

export const useServiceCategories = () => {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { refreshTrigger } = useCategoryContext();

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('service_categories')
        .select('*')
        .eq('status', 'active')
        .order('sort_order', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching service categories:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🔄 useServiceCategories: Initial fetch or refresh triggered', { refreshTrigger });
    fetchCategories();
  }, [refreshTrigger]);

  return {
    categories,
    loading,
    error,
    refetch: fetchCategories
  };
};

// Helper function to get category title based on language
export const getCategoryTitle = (category: ServiceCategory, language: string = 'es') => {
  console.log('getCategoryTitle called with:', { language, category: category.title_part1, translations: category.translations });
  
  if (language === 'en' && category.translations?.title_part1 && category.translations?.title_part2) {
    const title = `${category.translations.title_part1} ${category.translations.title_part2}`;
    console.log('Returning English title:', title);
    return title;
  }
  
  const title = `${category.title_part1} ${category.title_part2}`;
  console.log('Returning Spanish title:', title);
  return title;
};

// Helper function to get category subtitle based on language
export const getCategorySubtitle = (category: ServiceCategory, language: string = 'es') => {
  console.log('getCategorySubtitle called with:', { language, subtitle: category.subtitle, translations: category.translations });
  
  if (language === 'en' && category.translations?.subtitle) {
    console.log('Returning English subtitle:', category.translations.subtitle);
    return category.translations.subtitle;
  }
  
  console.log('Returning Spanish subtitle:', category.subtitle);
  return category.subtitle;
};