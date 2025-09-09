import React, { useEffect, useCallback } from 'react';
import { useCookieConsent } from '../hooks/useCookieConsent';

/**
 * Componente que gestiona la carga de scripts de terceros
 * según el consentimiento de cookies del usuario
 */
const ThirdPartyScripts: React.FC = () => {
  const { consent, hasConsent, isInitialized } = useCookieConsent();

  const isGoogleAnalyticsLoaded = (): boolean => {
    return typeof window !== 'undefined' && !!window.gtag;
  };

  const loadGoogleAnalytics = () => {
    if (typeof window === 'undefined') return;

    const GA_MEASUREMENT_ID = 'G-1234567890';

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);

    script.onload = () => {
      window.dataLayer = window.dataLayer || [];
      window.gtag = function(...args: unknown[]) {
        window.dataLayer.push(args);
      };
      
      window.gtag('js', new Date());
      window.gtag('config', GA_MEASUREMENT_ID, {
        anonymize_ip: true,
        cookie_flags: 'SameSite=None;Secure',
        cookie_domain: 'auto',
        cookie_expires: 63072000,
        send_page_view: true
      });
    };
  };

  const removeAnalyticsScripts = () => {
    const gaScripts = document.querySelectorAll('script[src*="googletagmanager.com/gtag"]');
    gaScripts.forEach(script => script.remove());

    if (typeof window !== 'undefined') {
      delete (window as Window & { gtag?: unknown }).gtag;
      delete (window as Window & { dataLayer?: unknown }).dataLayer;
    }
  };

  const removeMarketingScripts = () => {
    const fbScripts = document.querySelectorAll('script[src*="facebook.net"]');
    fbScripts.forEach(script => script.remove());

    const adScripts = document.querySelectorAll('script[src*="googleadservices.com"]');
    adScripts.forEach(script => script.remove());

    if (typeof window !== 'undefined') {
      delete (window as Window & { fbq?: unknown }).fbq;
      delete (window as Window & { _fbq?: unknown })._fbq;
    }
  };

  const removeThirdPartyScripts = useCallback(() => {
    removeAnalyticsScripts();
    removeMarketingScripts();
  }, []);

  const clearAnalyticsCookies = () => {
    const analyticsCookies = ['_ga', '_ga_', '_gid', '_gat', '_gtag'];
    analyticsCookies.forEach(cookieName => {
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
      const domain = window.location.hostname.split('.').slice(-2).join('.');
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${domain};`;
    });
  };

  const clearMarketingCookies = () => {
    const marketingCookies = ['_fbp', '_fbc', 'fr', 'sb', 'datr'];
    marketingCookies.forEach(cookieName => {
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
      const domain = window.location.hostname.split('.').slice(-2).join('.');
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${domain};`;
    });
  };

  const clearThirdPartyCookies = useCallback(() => {
    clearAnalyticsCookies();
    clearMarketingCookies();
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    
    if (!hasConsent) {
      removeThirdPartyScripts();
      return;
    }

    if (consent.analytics && !isGoogleAnalyticsLoaded()) {
      loadGoogleAnalytics();
    } else if (!consent.analytics) {
      removeAnalyticsScripts();
    }

    if (consent.marketing) {
      // Marketing scripts temporarily disabled
    } else {
      removeMarketingScripts();
    }

  }, [consent, hasConsent, isInitialized, removeThirdPartyScripts]);

  useEffect(() => {
    if (!isInitialized) return;
    
    if (!hasConsent) {
      clearThirdPartyCookies();
    } else {
      if (!consent.analytics) {
        clearAnalyticsCookies();
      }
      if (!consent.marketing) {
        clearMarketingCookies();
      }
    }
  }, [consent.analytics, consent.marketing, hasConsent, isInitialized, clearThirdPartyCookies]);

  return null;
};

export default ThirdPartyScripts;


// Declaraciones globales están en useCookieConsent.ts
declare global {
  interface Window {
    fbq?: (action: string, event?: string, parameters?: Record<string, unknown>) => void;
    _fbq?: Record<string, unknown>;
    gtag_report_conversion?: (url?: string) => boolean;
  }
}