import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Importar traducciones base
import translationES from './locales/es/translation.json';
import translationEN from './locales/en/translation.json';

// Importar traducciones de páginas
import homeES from './locales/es/pages/home.json';
import homeEN from './locales/en/pages/home.json';

// Importar traducciones de componentes
import navbarES from './locales/es/components/navbar.json';
import navbarEN from './locales/en/components/navbar.json';
import footerES from './locales/es/components/footer.json';
import footerEN from './locales/en/components/footer.json';
import servicesES from './locales/es/components/services.json';
import servicesEN from './locales/en/components/services.json';
import serviceConfigurationES from './locales/es/components/service-configuration.json';
import serviceConfigurationEN from './locales/en/components/service-configuration.json';
import contactES from './locales/es/components/contact.json';
import contactEN from './locales/en/components/contact.json';
import clientDashboardES from './locales/es/components/client-dashboard.json';
import clientDashboardEN from './locales/en/components/client-dashboard.json';

// Importar traducciones de páginas específicas
import orderDetailsES from './locales/es/pages/order-details.json';
import orderDetailsEN from './locales/en/pages/order-details.json';
import authES from './locales/es/pages/auth.json';
import authEN from './locales/en/pages/auth.json';
import termsOfServiceES from './locales/es/pages/terms-of-service.json';
import termsOfServiceEN from './locales/en/pages/terms-of-service.json';
import cookiePolicyES from './locales/es/pages/cookiePolicy.json';
import cookiePolicyEN from './locales/en/pages/cookiePolicy.json';
import refundPolicyES from './locales/es/pages/refundPolicy.json';
import refundPolicyEN from './locales/en/pages/refundPolicy.json';
import disclaimerES from './locales/es/pages/disclaimer.json';
import disclaimerEN from './locales/en/pages/disclaimer.json';
import privacyPolicyES from './locales/es/pages/privacy-policy.json';
import privacyPolicyEN from './locales/en/pages/privacy-policy.json';

// Importar traducciones SEO
import seoES from './locales/es/seo.json';
import seoEN from './locales/en/seo.json';

// Importar traducciones comunes
import commonES from './locales/es/common.json';
import commonEN from './locales/en/common.json';

// Lista de países hispanohablantes
const SPANISH_COUNTRIES = [
  'ES', 'MX', 'AR', 'CO', 'PE', 'VE', 'CL', 'EC', 'GT', 'CU',
  'BO', 'DO', 'HN', 'PY', 'SV', 'NI', 'CR', 'PA', 'UY', 'PR',
  'GQ', 'PH' // Guinea Ecuatorial y partes de Filipinas
];

// Función para detectar si el usuario debe ver el sitio en español
const detectUserLanguage = (): string => {
  // 1. Verificar si hay un idioma guardado en localStorage
  const savedLanguage = localStorage.getItem('i18nextLng');
  if (savedLanguage) return savedLanguage;

  // 2. Detectar idioma del navegador
  const browserLang = navigator.language || (navigator as any).userLanguage;
  
  // 3. Si el idioma del navegador es español, usar español
  if (browserLang && browserLang.toLowerCase().startsWith('es')) {
    return 'es';
  }

  // 4. Intentar detectar por zona horaria (para Latinoamérica)
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const americanSpanishTimeZones = [
      'America/Mexico_City', 'America/Buenos_Aires', 'America/Bogota',
      'America/Lima', 'America/Caracas', 'America/Santiago', 'America/Guayaquil',
      'America/La_Paz', 'America/Santo_Domingo', 'America/Tegucigalpa',
      'America/Asuncion', 'America/San_Salvador', 'America/Managua',
      'America/Costa_Rica', 'America/Panama', 'America/Montevideo',
      'America/Havana', 'America/Guatemala', 'America/Puerto_Rico'
    ];
    
    if (americanSpanishTimeZones.some(tz => timeZone.includes(tz.split('/')[1]))) {
      return 'es';
    }
  } catch (e) {
    // Could not detect timezone
  }

  // 5. Por defecto, inglés
  return 'en';
};

// Función para combinar traducciones
const combineTranslations = (baseTranslations: any, pageTranslations: any) => {
  return {
    ...baseTranslations,
    ...pageTranslations
  };
};

const resources = {
  es: {
    translation: combineTranslations(translationES, { 
      home: homeES, 
      contact: contactES, 
      clientDashboard: clientDashboardES,
      orderDetails: orderDetailsES,
      auth: authES,
      termsOfService: termsOfServiceES,
      ...cookiePolicyES,
      ...refundPolicyES,
      ...disclaimerES,
      ...privacyPolicyES,
      ...navbarES, 
      ...footerES, 
      ...servicesES,
      common: commonES
    }),
    'service-configuration': serviceConfigurationES,
    seo: seoES
  },
  en: {
    translation: combineTranslations(translationEN, { 
      home: homeEN, 
      contact: contactEN, 
      clientDashboard: clientDashboardEN,
      orderDetails: orderDetailsEN,
      auth: authEN,
      termsOfService: termsOfServiceEN,
      ...cookiePolicyEN,
      ...refundPolicyEN,
      ...disclaimerEN,
      ...privacyPolicyEN,
      ...navbarEN, 
      ...footerEN, 
      ...servicesEN,
      common: commonEN
    }),
    'service-configuration': serviceConfigurationEN,
    seo: seoEN
  }
}

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    lng: detectUserLanguage(), // Usar nuestra función de detección
    debug: false,

    interpolation: {
      escapeValue: false // React ya hace escape de XSS
    },

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng'
    }
  });

// Función para cambiar idioma manualmente
export const changeLanguage = (language: string) => {
  i18n.changeLanguage(language);
  localStorage.setItem('i18nextLng', language);
  
  // Actualizar el atributo lang del HTML
  document.documentElement.lang = language;
  
  // Actualizar meta tags para SEO
  updateMetaTagsForLanguage(language);
};

// Function to update meta tags based on language and page
export const updateMetaTagsForLanguage = (language: string, page: string = 'home') => {
  const baseUrl = 'https://filesecufb.com';
  
  // Get SEO translations from the dedicated SEO namespace
  const seoTranslations = i18n.getResourceBundle(language, 'seo');
  const seoData = seoTranslations?.[page] || seoTranslations?.home;
  
  if (!seoData) {
    // Silently return if SEO data is not found to avoid console warnings
    return;
  }
  
  // Update basic meta tags
  const titleElement = document.querySelector('title');
  const descriptionElement = document.querySelector('meta[name="description"]');
  const keywordsElement = document.querySelector('meta[name="keywords"]');
  const languageElement = document.querySelector('meta[name="language"]');
  const geoRegionElement = document.querySelector('meta[name="geo.region"]');
  
  if (titleElement) {
    titleElement.textContent = seoData.title;
  }
  
  if (descriptionElement) {
    descriptionElement.setAttribute('content', seoData.description);
  }
  
  if (keywordsElement) {
    keywordsElement.setAttribute('content', seoData.keywords);
  }
  
  if (languageElement) {
    languageElement.setAttribute('content', language);
  }
  
  if (geoRegionElement) {
    geoRegionElement.setAttribute('content', 'ES');
  }
  
  // Update canonical URL
  updateCanonicalUrl(language, baseUrl, page);
  
  // Update hreflang tags
  updateHreflangTags(baseUrl, page);
  
  // Update OpenGraph tags
  updateOpenGraphTags(language, baseUrl, seoData);
  
  // Update Twitter Card tags
  updateTwitterCardTags(language, seoData);
  
  // Update structured data
  updateStructuredData(language, baseUrl, seoData);
};

// Helper function to update canonical URL
const updateCanonicalUrl = (language: string, baseUrl: string, page: string = 'home') => {
  let canonicalElement = document.querySelector('link[rel="canonical"]');
  if (!canonicalElement) {
    canonicalElement = document.createElement('link');
    canonicalElement.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalElement);
  }
  
  const currentPath = window.location.pathname;
  const canonicalUrl = language === 'es' 
    ? `${baseUrl}${currentPath}`
    : `${baseUrl}/en${currentPath}`;
  
  canonicalElement.setAttribute('href', canonicalUrl);
};

// Helper function to update hreflang tags
const updateHreflangTags = (baseUrl: string, page: string = 'home') => {
  // Remove existing hreflang tags
  const existingHreflangTags = document.querySelectorAll('link[hreflang]');
  existingHreflangTags.forEach(tag => tag.remove());
  
  const currentPath = window.location.pathname;
  
  // Add Spanish hreflang
  const esHreflang = document.createElement('link');
  esHreflang.setAttribute('rel', 'alternate');
  esHreflang.setAttribute('hreflang', 'es');
  esHreflang.setAttribute('href', `${baseUrl}${currentPath}`);
  document.head.appendChild(esHreflang);
  
  // Add English hreflang
  const enHreflang = document.createElement('link');
  enHreflang.setAttribute('rel', 'alternate');
  enHreflang.setAttribute('hreflang', 'en');
  enHreflang.setAttribute('href', `${baseUrl}/en${currentPath}`);
  document.head.appendChild(enHreflang);
  
  // Add x-default hreflang
  const defaultHreflang = document.createElement('link');
  defaultHreflang.setAttribute('rel', 'alternate');
  defaultHreflang.setAttribute('hreflang', 'x-default');
  defaultHreflang.setAttribute('href', `${baseUrl}${currentPath}`);
  document.head.appendChild(defaultHreflang);
};

// Helper function to update OpenGraph tags
const updateOpenGraphTags = (language: string, baseUrl: string, seoData: any) => {
  const ogTags = [
    { property: 'og:title', content: seoData.title },
    { property: 'og:description', content: seoData.description },
    { property: 'og:locale', content: language === 'es' ? 'es_ES' : 'en_US' },
    { property: 'og:url', content: `${baseUrl}${window.location.pathname}` },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: 'FILESECUFB' },
    { property: 'og:image', content: `${baseUrl}/og-image.png` },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' }
  ];
  
  ogTags.forEach(tag => {
    let ogElement = document.querySelector(`meta[property="${tag.property}"]`);
    if (!ogElement) {
      ogElement = document.createElement('meta');
      ogElement.setAttribute('property', tag.property);
      document.head.appendChild(ogElement);
    }
    ogElement.setAttribute('content', tag.content);
  });
};

// Helper function to update Twitter Card tags
const updateTwitterCardTags = (language: string, seoData: any) => {
  const twitterTags = [
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: seoData.title },
    { name: 'twitter:description', content: seoData.description },
    { name: 'twitter:site', content: '@filesecufb' },
    { name: 'twitter:image', content: 'https://filesecufb.com/social-image.png' }
  ];
  
  twitterTags.forEach(tag => {
    let twitterElement = document.querySelector(`meta[name="${tag.name}"]`);
    if (!twitterElement) {
      twitterElement = document.createElement('meta');
      twitterElement.setAttribute('name', tag.name);
      document.head.appendChild(twitterElement);
    }
    twitterElement.setAttribute('content', tag.content);
  });
};

// Helper function to update structured data
const updateStructuredData = (language: string, baseUrl: string, seoData: any) => {
  // Remove existing structured data
  const existingStructuredData = document.querySelector('script[type="application/ld+json"]');
  if (existingStructuredData) {
    existingStructuredData.remove();
  }
  
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "FILESECUFB",
    "url": baseUrl,
    "logo": `${baseUrl}/logo.png`,
    "description": seoData.description,
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+34-630-84-10-47",
      "contactType": "customer service",
      "email": "info@filesecufb.com",
      "availableLanguage": ["Spanish", "English"]
    },
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "ES"
    },
    "sameAs": [
      "https://www.facebook.com/filesecufb",
      "https://www.instagram.com/filesecufb"
    ],
    "offers": {
      "@type": "Offer",
      "description": language === 'es' 
        ? "Servicios de modificación de mapas ECU: Stage 1, Stage 2, DPF Off, EGR Off, AdBlue Off"
        : "ECU map modification services: Stage 1, Stage 2, DPF Off, EGR Off, AdBlue Off"
    }
  };
  
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(structuredData);
  document.head.appendChild(script);
};

export default i18n;