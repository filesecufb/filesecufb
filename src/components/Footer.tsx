import React from 'react';
import { Facebook, Instagram, Twitter, MapPin, Phone, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';

const Footer = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleHomeClick = () => {
    navigate('/');
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 100);
  };

  const handleProcessClick = () => {
    if (window.location.pathname === '/') {
      scrollToSection('process');
    } else {
      navigate('/');
      setTimeout(() => {
        scrollToSection('process');
      }, 100);
    }
  };

  const handleServiceClick = (serviceType: string) => {
    navigate('/services');
    setTimeout(() => {
      window.scrollTo(0, 0);
      // Scroll to specific service section if it exists
      const serviceSection = document.getElementById(serviceType);
      if (serviceSection) {
        setTimeout(() => {
          serviceSection.scrollIntoView({ behavior: 'smooth' });
        }, 200);
      }
    }, 100);
  };

  const handleServicesPageClick = () => {
    navigate('/services');
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 100);
  };

  const handleContactClick = () => {
    navigate('/contact');
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 100);
  };
  return (
    <footer className="bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Información de la empresa */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-blue-corporate">
              {t('footer.company.name')}
            </h3>
            <p className="text-gray-300 leading-relaxed">
              {t('footer.company.description')}
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-blue-corporate transition-colors duration-300">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-corporate transition-colors duration-300">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-corporate transition-colors duration-300">
                <Twitter size={20} />
              </a>
            </div>
          </div>

          {/* Navegación */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">{t('footer.navigation.title')}</h4>
            <ul className="space-y-2">
              <li><button onClick={handleHomeClick} className="text-gray-300 hover:text-blue-corporate transition-colors duration-300 text-left">{t('footer.navigation.links.home')}</button></li>
              <li><button onClick={handleProcessClick} className="text-gray-300 hover:text-blue-corporate transition-colors duration-300 text-left">{t('footer.navigation.links.process')}</button></li>
              <li><button onClick={handleServicesPageClick} className="text-gray-300 hover:text-blue-corporate transition-colors duration-300 text-left">{t('footer.navigation.links.services')}</button></li>
              <li><button onClick={handleContactClick} className="text-gray-300 hover:text-blue-corporate transition-colors duration-300 text-left">{t('footer.navigation.links.contact')}</button></li>
            </ul>
          </div>

          {/* Servicios */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">{t('footer.services.title')}</h4>
            <ul className="space-y-2">
              <li><button onClick={() => handleServiceClick('car-tuning')} className="text-gray-300 hover:text-white transition-colors duration-300 text-left">{t('footer.services.links.carTuning')}</button></li>
              <li><button onClick={() => handleServiceClick('trucks-agriculture')} className="text-gray-300 hover:text-white transition-colors duration-300 text-left">{t('footer.services.links.trucks')}</button></li>
              <li><button onClick={() => handleServiceClick('tcu-tuning')} className="text-gray-300 hover:text-white transition-colors duration-300 text-left">{t('footer.services.links.tcuTuning')}</button></li>
              <li><button onClick={() => handleServiceClick('other-services')} className="text-gray-300 hover:text-white transition-colors duration-300 text-left">{t('footer.services.links.others')}</button></li>
            </ul>
          </div>

          {/* Contacto */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">{t('footer.contact.title')}</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Phone size={16} className="text-blue-corporate" />
                <span className="text-gray-300 text-sm">{t('footer.contact.phone')}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail size={16} className="text-blue-corporate" />
                <span className="text-gray-300 text-sm">{t('footer.contact.email')}</span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin size={16} className="text-blue-corporate" />
                <span className="text-gray-300 text-sm">{t('footer.contact.address')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Línea divisoria y copyright */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400 text-sm">
              {t('footer.legal.copyright')}
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap justify-center items-center gap-4 sm:gap-6">
              <Link to="/privacy-policy" className="text-gray-400 hover:text-blue-corporate transition-colors duration-300 text-sm">
                {t('footer.legal.privacy')}
              </Link>
              <Link to="/terms-of-service" className="text-gray-400 hover:text-blue-corporate transition-colors duration-300 text-sm">
                {t('footer.legal.terms')}
              </Link>
              <Link to="/cookie-policy" className="text-gray-400 hover:text-blue-corporate transition-colors duration-300 text-sm">
                {t('footer.legal.cookies')}
              </Link>
              <Link to="/refund-policy" className="text-gray-400 hover:text-blue-corporate transition-colors duration-300 text-sm">
                {t('footer.legal.refund')}
              </Link>
              <Link to="/disclaimer" className="text-gray-400 hover:text-blue-corporate transition-colors duration-300 text-sm">
                {t('footer.legal.disclaimer')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;