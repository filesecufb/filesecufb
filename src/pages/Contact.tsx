import React from 'react'
import { Phone, MessageCircle, Mail, MapPin, Clock } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const Contact: React.FC = () => {
  const { t } = useTranslation();

  // Agregar datos estructurados para SEO de contacto
  React.useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.innerHTML = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": "FILESECUFB",
      "description": "Servicio profesional de tuning files y reprogramación ECU",
      "url": "https://filesecufb.com",
      "telephone": "+34630841047",
      "email": "info@filesecufb.com",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Paraje Narcisos, 21, MEDIALEGUA",
        "addressLocality": "Cuevas de Reyllo",
        "addressRegion": "Murcia",
        "postalCode": "30320",
        "addressCountry": "ES"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": "37.987654",
        "longitude": "-1.234567"
      },
      "openingHours": [
        "Mo-Fr 09:00-13:00",
        "Mo-Fr 16:00-20:00",
        "Sa 09:00-13:00"
      ],
      "sameAs": [
        "https://wa.me/34630841047"
      ],
      "priceRange": "€€",
      "serviceArea": {
        "@type": "Country",
        "name": "Spain"
      }
    });
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  // Actualizar meta tags para la página de contacto
  React.useEffect(() => {
    const originalTitle = document.title;
    const originalDescription = document.querySelector('meta[name="description"]')?.getAttribute('content');
    
    document.title = t('contact.header.title') + ' - FILESECUFB';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', t('contact.header.subtitle') + ' | Teléfono: +34 630 84 10 47 | Email: info@filesecufb.com');
    }

    return () => {
      document.title = originalTitle;
      if (metaDescription && originalDescription) {
        metaDescription.setAttribute('content', originalDescription);
      }
    };
  }, [t]);
  const scheduleData = [
    { day: t('contact.schedule.days.monday'), hours: `${t('contact.schedule.hours.morning')}, ${t('contact.schedule.hours.afternoon')}` },
    { day: t('contact.schedule.days.tuesday'), hours: `${t('contact.schedule.hours.morning')}, ${t('contact.schedule.hours.afternoon')}` },
    { day: t('contact.schedule.days.wednesday'), hours: `${t('contact.schedule.hours.morning')}, ${t('contact.schedule.hours.afternoon')}` },
    { day: t('contact.schedule.days.thursday'), hours: `${t('contact.schedule.hours.morning')}, ${t('contact.schedule.hours.afternoon')}` },
    { day: t('contact.schedule.days.friday'), hours: `${t('contact.schedule.hours.morning')}, ${t('contact.schedule.hours.afternoon')}` },
    { day: t('contact.schedule.days.saturday'), hours: t('contact.schedule.hours.morning') },
    { day: t('contact.schedule.days.sunday'), hours: t('contact.schedule.closed') }
  ]

  return (
    <div className="min-h-screen bg-gradient-dark pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 
            className="text-4xl md:text-5xl font-bold text-white mb-6 font-accent"
            dangerouslySetInnerHTML={{ __html: t('contact.header.title') }}
          />
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            {t('contact.header.subtitle')}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div className="space-y-8">
            {/* Phone & WhatsApp */}
            <div className="bg-gradient-subtle p-8 rounded-2xl border border-elegant shadow-elegant hover:shadow-primary transition-all duration-300">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-gradient-primary rounded-lg">
                  <Phone className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-2">{t('contact.methods.phone.title')}</h3>
                  <p className="text-gray-300 mb-4">{t('contact.methods.phone.description')}</p>
                  <a 
                    href="tel:+34630841047" 
                    className="text-primary hover:text-secondary transition-colors duration-300 font-medium text-lg"
                  >
                    +34 630 84 10 47
                  </a>
                </div>
              </div>
            </div>

            {/* WhatsApp */}
            <div className="bg-gradient-subtle p-8 rounded-2xl border border-elegant shadow-elegant hover:shadow-primary transition-all duration-300">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-gradient-primary rounded-lg">
                  <MessageCircle className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-2">{t('contact.methods.whatsapp.title')}</h3>
                  <p className="text-gray-300 mb-4">{t('contact.methods.whatsapp.description')}</p>
                  <a 
                    href="https://wa.me/34630841047" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:text-secondary transition-colors duration-300 font-medium text-lg"
                  >
                    +34 630 84 10 47
                  </a>
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="bg-gradient-subtle p-8 rounded-2xl border border-elegant shadow-elegant hover:shadow-primary transition-all duration-300">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-gradient-primary rounded-lg">
                  <Mail className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-2">{t('contact.methods.email.title')}</h3>
                  <p className="text-gray-300 mb-4">{t('contact.methods.email.description')}</p>
                  <a 
                    href="mailto:info@filesecufb.com" 
                    className="text-primary hover:text-secondary transition-colors duration-300 font-medium text-lg"
                  >
                    info@filesecufb.com
                  </a>
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="bg-gradient-subtle p-8 rounded-2xl border border-elegant shadow-elegant hover:shadow-primary transition-all duration-300">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-gradient-primary rounded-lg">
                  <MapPin className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-2">{t('contact.methods.address.title')}</h3>
              <p className="text-gray-400 mb-4">{t('contact.methods.address.description')}</p>
                  <address className="text-primary not-italic text-lg leading-relaxed">
                    Paraje Narcisos, 21, MEDIALEGUA<br />
                    30320 Cuevas de Reyllo, Murcia<br />
                    España
                  </address>
                </div>
              </div>
            </div>

            {/* Schedule */}
            <div className="bg-gradient-subtle p-8 rounded-2xl border border-elegant shadow-elegant hover:shadow-primary transition-all duration-300">
              <div className="flex items-start space-x-4 mb-6">
                <div className="p-3 bg-gradient-primary rounded-lg">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-2">{t('contact.methods.schedule.title')}</h3>
              <p className="text-gray-400 mb-6">{t('contact.methods.schedule.description')}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
                {scheduleData.map((item, index) => (
                  <div 
                    key={index} 
                    className={`p-4 rounded-xl transition-all duration-300 hover:scale-105 ${
                      item.hours === 'Cerrado' 
                        ? 'bg-red-900/20 border border-red-800/30 hover:bg-red-900/30' 
                        : 'bg-gray-800/50 border border-gray-700/50 hover:bg-gray-800/70 hover:border-primary/30'
                    }`}
                  >
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-white font-semibold text-sm">{item.day}</span>
                        <div className={`w-2 h-2 rounded-full ${
                          item.hours === 'Cerrado' ? 'bg-red-400' : 'bg-green-400'
                        }`}></div>
                      </div>
                      <span className={`text-sm font-medium ${
                        item.hours === 'Cerrado' ? 'text-red-400' : 'text-primary'
                      }`}>
                        {item.hours}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-700/50">
                <p className="text-sm text-gray-400 text-center italic">
                  Horarios confirmados por la empresa
                </p>
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="lg:sticky lg:top-24">
            <div className="bg-gradient-subtle p-8 rounded-2xl border border-elegant shadow-elegant">
              <h3 className="text-2xl font-semibold text-white mb-6 text-center">{t('contact.map.title')}</h3>
              <div className="relative overflow-hidden rounded-xl shadow-elegant">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3142.123456789!2d-1.234567!3d37.987654!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzfCsDU5JzE1LjYiTiAxwrAxNCcwNC40Ilc!5e0!3m2!1ses!2ses!4v1234567890123!5m2!1ses!2ses"
                  width="100%"
                  height="400"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Ubicación de FILESECUFB - Paraje Narcisos, 21, MEDIALEGUA, 30320 Cuevas de Reyllo, Murcia"
                  className="w-full h-96 rounded-lg"
                ></iframe>
              </div>
              <div className="mt-6 text-center">
                <a
                  href="https://share.google/2xFhuCXL0iA2ZRcw4"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary inline-flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 hover:scale-105 shadow-subtle hover:shadow-elegant"
                >
                  <MapPin className="h-5 w-5" />
                  <span>{t('contact.map.button')}</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-subtle p-12 rounded-2xl border border-elegant shadow-elegant">
            <h2 className="text-3xl font-bold text-white mb-4 font-accent">
              {t('contact.cta.title')}
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              {t('contact.cta.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="tel:+34630841047"
                className="btn-primary px-8 py-4 rounded-lg font-medium transition-all duration-300 hover:scale-105 shadow-subtle hover:shadow-elegant inline-flex items-center justify-center space-x-2"
              >
                <Phone className="h-5 w-5" />
                <span>{t('contact.cta.button')}</span>
              </a>
              <a
                href="https://wa.me/34630841047"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary px-8 py-4 rounded-lg font-medium transition-all duration-300 hover:scale-105 shadow-subtle hover:shadow-elegant inline-flex items-center justify-center space-x-2"
              >
                <MessageCircle className="h-5 w-5" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Contact