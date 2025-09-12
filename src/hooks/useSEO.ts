import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { updateMetaTagsForLanguage } from '../i18n';

// Hook personalizado para gestionar SEO dinámico
export const useSEO = (pageKey?: string) => {
  const location = useLocation();
  const { i18n } = useTranslation();
  
  // Mapear rutas a claves de página
  const getPageKey = (pathname: string): string => {
    if (pageKey) return pageKey;
    
    // Remover prefijo de idioma si existe
    const cleanPath = pathname.replace(/^\/en/, '').replace(/^\/$/, '') || '/';
    
    const routeMap: { [key: string]: string } = {
      '/': 'home',
      '/services': 'services',
      '/contact': 'contact',
      '/login': 'login',
      '/register': 'register',
      '/dashboard': 'dashboard',
      '/privacy-policy': 'privacy',
      '/terms-of-service': 'terms',
      '/cookie-policy': 'cookies'
    };
    
    return routeMap[cleanPath] || 'home';
  };
  
  useEffect(() => {
    const currentPageKey = getPageKey(location.pathname);
    const currentLanguage = i18n.language;
    
    // Actualizar metadatas cuando cambie la página o el idioma
    updateMetaTagsForLanguage(currentLanguage, currentPageKey);
  }, [location.pathname, i18n.language, pageKey]);
  
  // Función para actualizar metadatas manualmente
  const updateSEO = (customPageKey?: string) => {
    const pageToUpdate = customPageKey || getPageKey(location.pathname);
    updateMetaTagsForLanguage(i18n.language, pageToUpdate);
  };
  
  return { updateSEO };
};

// Hook simplificado para páginas específicas
export const usePageSEO = (pageKey: string) => {
  return useSEO(pageKey);
};