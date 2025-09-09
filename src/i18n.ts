import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Importar traducciones
import translationES from './locales/es/translation.json';
import translationEN from './locales/en/translation.json';

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

const resources = {
  es: {
    translation: translationES
  },
  en: {
    translation: translationEN
  }
};

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

// Función para actualizar meta tags según el idioma
const updateMetaTagsForLanguage = (language: string) => {
  const isSpanish = language === 'es';
  
  // Actualizar title
  document.title = isSpanish 
    ? 'FILESECUFB | Modificación de Mapas ECU | Tuning Files Profesionales'
    : 'FILESECUFB | ECU Map Modification | Professional Tuning Files';
  
  // Actualizar meta description
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.setAttribute('content', isSpanish
      ? 'FILESECUFB - Especialistas en modificación de mapas de centralitas. Tuning files para Stage 1, Stage 2, solución DPF, EGR, AdBlue. Reprogramación profesional con garantía.'
      : 'FILESECUFB - Specialists in ECU map modification. Tuning files for Stage 1, Stage 2, DPF, EGR, AdBlue solutions. Professional remapping with warranty.'
    );
  }
  
  // Actualizar meta keywords
  const metaKeywords = document.querySelector('meta[name="keywords"]');
  if (metaKeywords) {
    metaKeywords.setAttribute('content', isSpanish
      ? 'filesecufb, tuning files, mapas ecu, modificación centralita, reprogramación ecu, ficheros tuning, calibración ecu, remap files, chip tuning, stage 1, stage 2, dpf off, egr off'
      : 'filesecufb, tuning files, ecu maps, ecu modification, ecu remapping, tuning files, ecu calibration, remap files, chip tuning, stage 1, stage 2, dpf off, egr off'
    );
  }
};

export default i18n;