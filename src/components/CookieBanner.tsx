import React, { useState, useEffect } from 'react';
// Removed unused lucide-react imports
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCookieConsent } from '../hooks/useCookieConsent';

const CookieBanner: React.FC = () => {
  const { t } = useTranslation();
  const { 
    consent, 
    showBanner, 
    acceptAll, 
    rejectAll, 
    saveCustomConsent
  } = useCookieConsent();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [localConsent, setLocalConsent] = useState({
    necessary: true,
    analytics: false,
    marketing: false
  });

  // Sincronizar estado local con el consentimiento global
  useEffect(() => {
    if (consent) {
      setLocalConsent({
        necessary: true,
        analytics: consent.analytics || false,
        marketing: consent.marketing || false
      });
    }
  }, [consent]);

  // Banner visibility is handled by showBanner prop

  if (!showBanner) {
    return null;
  }

  const handleToggle = (type: 'analytics' | 'marketing') => {
    setLocalConsent(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const handleSavePreferences = () => {
    saveCustomConsent({
      analytics: localConsent.analytics,
      marketing: localConsent.marketing
    });
    setIsExpanded(false);
  };

  const handleAcceptAll = () => {
    acceptAll();
    setIsExpanded(false);
  };

  const handleRejectAll = () => {
    rejectAll();
    setIsExpanded(false);
  };

  return (
    <div className={`fixed 
      /* Mobile: centrado horizontalmente, abajo, sin desbordamiento */
      bottom-2 left-2 right-2 mx-auto max-w-sm
      /* Desktop: esquina inferior derecha como antes */
      sm:bottom-4 sm:right-4 sm:left-auto sm:mx-0 
      bg-white rounded-xl shadow-2xl border border-gray-200 z-50 
      transition-all duration-500 ease-in-out hover:shadow-3xl transform hover:scale-105 
      /* Evitar desbordamiento en móvil */
      max-h-[calc(100vh-1rem)] overflow-y-auto
      ${!isExpanded ? 'sm:max-w-sm' : 'sm:max-w-md'}`}>
      <div className="p-3 sm:p-4 transition-all duration-300">
        {!isExpanded ? (
          // Estado minimizado
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                  {t('cookies.banner.title')}
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {t('cookies.banner.description')}
                </p>
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <button
                   onClick={handleRejectAll}
                   className="flex-1 px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 hover:shadow-md rounded-lg transition-all duration-200 transform hover:scale-105"
                 >
                   {t('cookies.banner.reject')}
                 </button>
                 <button
                   onClick={() => setIsExpanded(true)}
                   className="flex-1 px-3 py-2 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 hover:shadow-md rounded-lg transition-all duration-200 transform hover:scale-105"
                 >
                   {t('cookies.banner.configure')}
                 </button>
              </div>
              <button
                 onClick={handleAcceptAll}
                 className="w-full px-3 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 hover:shadow-lg rounded-lg transition-all duration-200 transform hover:scale-105"
               >
                 {t('cookies.banner.acceptAll')}
               </button>
            </div>
          </div>
        ) : (
          // Estado expandido - Diseño según imagen de referencia
          <div className="w-full sm:w-96 space-y-3 sm:space-y-4">
            {/* Header con título y botón X */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {t('cookies.banner.manageConsent')}
              </h2>
              <button
                 onClick={() => setIsExpanded(false)}
                 className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
               >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Texto descriptivo */}
            <div className="text-sm text-gray-600 leading-relaxed">
              <p>
                {t('cookies.banner.expandedDescription')}
              </p>
            </div>

            {/* Categorías organizadas verticalmente */}
            <div className="space-y-3">
              {/* Funcional - Siempre activo */}
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{t('cookies.banner.functional')}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-green-600 font-medium">{t('cookies.banner.alwaysActive')}</span>
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>

              {/* Estadísticas con toggle naranja */}
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{t('cookies.banner.statistics')}</h3>
                </div>
                <button
                  onClick={() => handleToggle('analytics')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                    localConsent.analytics ? 'bg-orange-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                      localConsent.analytics ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Marketing con toggle naranja */}
              <div className="flex items-center justify-between py-3">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{t('cookies.banner.marketing')}</h3>
                </div>
                <button
                  onClick={() => handleToggle('marketing')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                    localConsent.marketing ? 'bg-orange-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                      localConsent.marketing ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
            
            {/* Botones en la parte inferior */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4">
              <button
                onClick={handleAcceptAll}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all duration-200"
              >
                {t('cookies.banner.accept')}
              </button>
              <button
                onClick={handleRejectAll}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200"
              >
                {t('cookies.banner.reject')}
              </button>
              <button
                onClick={handleSavePreferences}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200"
              >
                {t('cookies.banner.savePreferences')}
              </button>
            </div>

            {/* Enlaces de políticas en la parte inferior */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 pt-2 text-xs text-blue-600">
              <Link to="/cookie-policy" className="hover:underline text-center sm:text-left">{t('cookies.banner.cookiePolicy')}</Link>
              <Link to="/privacy-policy" className="hover:underline text-center sm:text-left">{t('cookies.banner.privacyPolicy')}</Link>
              <Link to="/disclaimer" className="hover:underline text-center sm:text-left">{t('cookies.banner.legalNotice')}</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CookieBanner;

