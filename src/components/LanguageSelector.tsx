import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { changeLanguage } from '../i18n';

const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();

  const handleLanguageChange = (lng: string) => {
    changeLanguage(lng);
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'es' ? 'en' : 'es';
    handleLanguageChange(newLang);
  };

  return (
    <>
      {/* Desktop Version */}
      <div className="relative group hidden md:block">
        <button className="flex items-center space-x-2 px-3 py-2 text-white hover:text-primary transition-colors">
          <Globe className="h-5 w-5" />
          <span className="uppercase font-medium">{i18n.language}</span>
        </button>
        
        <div className="absolute right-0 mt-2 w-32 bg-dark-secondary rounded-lg shadow-lg border border-elegant opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
          <button
            onClick={() => handleLanguageChange('es')}
            className={`block w-full text-left px-4 py-2 hover:bg-primary/10 transition-colors ${
              i18n.language === 'es' ? 'text-primary' : 'text-white'
            }`}
          >
            🇪🇸 Español
          </button>
          <button
            onClick={() => handleLanguageChange('en')}
            className={`block w-full text-left px-4 py-2 hover:bg-primary/10 transition-colors rounded-b-lg ${
              i18n.language === 'en' ? 'text-primary' : 'text-white'
            }`}
          >
            🇬🇧 English
          </button>
        </div>
      </div>

      {/* Mobile Version - Simple toggle */}
      <button 
        onClick={toggleLanguage}
        className="md:hidden flex items-center space-x-2 text-white hover:text-primary transition-colors w-full px-3 py-2"
      >
        <Globe className="h-5 w-5" />
        <span className="uppercase font-medium">{i18n.language}</span>
        <span className="ml-auto text-xs opacity-60">
          {i18n.language === 'es' ? '→ EN' : '→ ES'}
        </span>
      </button>
    </>
  );
};

export default LanguageSelector;