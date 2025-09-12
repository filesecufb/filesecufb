import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import Spanish translations - Components
import esClientDashboard from '../locales/es/components/client-dashboard.json';
import esContact from '../locales/es/components/contact.json';
import esFooter from '../locales/es/components/footer.json';
import esNavbar from '../locales/es/components/navbar.json';
import esOrderDetails from '../locales/es/components/order-details.json';
import esServiceConfiguration from '../locales/es/components/service-configuration.json';
import esServices from '../locales/es/components/services.json';

// Import Spanish translations - Pages
import esHome from '../locales/es/pages/home.json';
import esOrderDetailsPage from '../locales/es/pages/order-details.json';

// Import Spanish base translation
import esTranslation from '../locales/es/translation.json';

// Import English translations - Components
import enClientDashboard from '../locales/en/components/client-dashboard.json';
import enContact from '../locales/en/components/contact.json';
import enFooter from '../locales/en/components/footer.json';
import enNavbar from '../locales/en/components/navbar.json';
import enOrderDetails from '../locales/en/components/order-details.json';
import enServiceConfiguration from '../locales/en/components/service-configuration.json';
import enServices from '../locales/en/components/services.json';

// Import English translations - Pages
import enHome from '../locales/en/pages/home.json';
import enOrderDetailsPage from '../locales/en/pages/order-details.json';

// Import English base translation
import enTranslation from '../locales/en/translation.json';

const resources = {
  es: {
    translation: {
      ...esTranslation,
      clientDashboard: esClientDashboard,
      contact: esContact,
      footer: esFooter,
      navbar: esNavbar,
      orderDetails: esOrderDetails,
      serviceConfiguration: esServiceConfiguration,
      services: esServices,
      home: esHome,
      orderDetailsPage: esOrderDetailsPage
    }
  },
  en: {
    translation: {
      ...enTranslation,
      clientDashboard: enClientDashboard,
      contact: enContact,
      footer: enFooter,
      navbar: enNavbar,
      orderDetails: enOrderDetails,
      serviceConfiguration: enServiceConfiguration,
      services: enServices,
      home: enHome,
      orderDetailsPage: enOrderDetailsPage
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'es', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;