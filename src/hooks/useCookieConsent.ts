import { useState, useEffect } from 'react';

export interface CookieConsent {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: number;
  version: string;
}

const COOKIE_CONSENT_KEY = 'cookie-consent';
const CONSENT_VERSION = '1.0';

const createFreshConsent = (): CookieConsent => ({
  necessary: true,
  analytics: false,
  marketing: false,
  timestamp: 0,
  version: CONSENT_VERSION
});

export const useCookieConsent = () => {
  const [consent, setConsent] = useState<CookieConsent>(createFreshConsent());
  const [showBanner, setShowBanner] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Cargar consentimiento desde localStorage al inicializar
  useEffect(() => {
    const loadSavedConsent = () => {
      try {
        const savedConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
        
        if (savedConsent) {
          const parsed: CookieConsent = JSON.parse(savedConsent);
          
          // Verificar si la versión es actual y el consentimiento es válido
          if (parsed.version === CONSENT_VERSION && parsed.timestamp > 0) {
            setConsent(parsed);
            setShowBanner(false);
          } else {
            // Versión antigua o consentimiento inválido
            localStorage.removeItem(COOKIE_CONSENT_KEY);
            setConsent(createFreshConsent());
            setShowBanner(true);
          }
        } else {
          // No hay consentimiento guardado
          setConsent(createFreshConsent());
          setShowBanner(true);
        }
      } catch (error) {
        localStorage.removeItem(COOKIE_CONSENT_KEY);
        setConsent(createFreshConsent());
        setShowBanner(true);
      } finally {
        setIsInitialized(true);
      }
    };

    loadSavedConsent();
  }, []);

  // Guardar consentimiento en localStorage
  const saveConsent = (newConsent: CookieConsent) => {
    const consentWithTimestamp = {
      ...newConsent,
      necessary: true, // Siempre forzar a true
      timestamp: Date.now(),
      version: CONSENT_VERSION
    };
    
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consentWithTimestamp));
      setConsent(consentWithTimestamp);
    } catch (error) {
      // Error silencioso al guardar
    }
  };

  // Aceptar todas las cookies
  const acceptAll = () => {
    const newConsent: CookieConsent = {
      necessary: true,
      analytics: true,
      marketing: true,
      timestamp: Date.now(),
      version: CONSENT_VERSION
    };
    
    saveConsent(newConsent);
    setShowBanner(false);
    
    // Cargar scripts de terceros
    loadGoogleAnalytics();
  };

  // Rechazar cookies no esenciales
  const rejectAll = () => {
    const newConsent: CookieConsent = {
      necessary: true,
      analytics: false,
      marketing: false,
      timestamp: Date.now(),
      version: CONSENT_VERSION
    };
    
    saveConsent(newConsent);
    setShowBanner(false);
    
    // Limpiar cookies existentes de terceros
    clearThirdPartyCookies();
  };

  // Guardar configuración personalizada
  const saveCustomConsent = (customConsent: Partial<CookieConsent>) => {
    const newConsent: CookieConsent = {
      ...consent,
      ...customConsent,
      necessary: true, // Siempre true
      timestamp: Date.now(),
      version: CONSENT_VERSION
    };
    
    saveConsent(newConsent);
    setShowBanner(false);
    
    // Cargar/limpiar scripts según configuración
    if (newConsent.analytics && !consent.analytics) {
      loadGoogleAnalytics();
    } else if (!newConsent.analytics && consent.analytics) {
      clearAnalyticsCookies();
    }
    
    if (!newConsent.marketing && consent.marketing) {
      clearMarketingCookies();
    }
  };

  // Cargar Google Analytics
  const loadGoogleAnalytics = () => {
    if (typeof window !== 'undefined' && !window.gtag) {
      // Solo cargar si no está ya cargado
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID';
      document.head.appendChild(script);
      
      script.onload = () => {
        window.dataLayer = window.dataLayer || [];
        window.gtag = function() {
          window.dataLayer.push(arguments);
        };
        window.gtag('js', new Date());
        window.gtag('config', 'GA_MEASUREMENT_ID', {
          anonymize_ip: true,
          cookie_flags: 'SameSite=None;Secure'
        });
      };
    }
  };

  // Limpiar cookies de terceros
  const clearThirdPartyCookies = () => {
    clearAnalyticsCookies();
    clearMarketingCookies();
  };

  // Limpiar cookies de analytics
  const clearAnalyticsCookies = () => {
    const cookiesToClear = ['_ga', '_ga_', '_gid', '_gat'];
    cookiesToClear.forEach(cookie => {
      document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`;
    });
  };

  // Limpiar cookies de marketing
  const clearMarketingCookies = () => {
    const cookiesToClear = ['_fbp', '_fbc', '__utma', '__utmb', '__utmc', '__utmz'];
    cookiesToClear.forEach(cookie => {
      document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`;
    });
  };

  // Calcular si hay consentimiento válido
  const hasConsent = isInitialized && consent.timestamp > 0;

  return {
    consent,
    showBanner: isInitialized && showBanner,
    acceptAll,
    rejectAll,
    saveCustomConsent,
    hasConsent,
    isInitialized
  };
};

// Declaraciones globales para TypeScript
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}