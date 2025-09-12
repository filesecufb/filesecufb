import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSEO } from '../hooks/useSEO';

const TermsOfService: React.FC = () => {
  const { t } = useTranslation();
  
  // Usar el hook useSEO para gestionar metadatos dinámicos
  useSEO('terms');
  return (
    <div className="min-h-screen bg-dark-primary text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center">
{t('termsOfService.title')}
          </h1>
          
          <div className="bg-dark-secondary p-8 rounded-lg space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">{t('termsOfService.section1.title')}</h2>
              <p className="text-gray-300 leading-relaxed">
                {t('termsOfService.section1.content')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">{t('termsOfService.section2.title')}</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                {t('termsOfService.section2.content')}
              </p>
              <p className="text-gray-300 leading-relaxed">
                {t('termsOfService.section2.additionalContent')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">{t('termsOfService.section3.title')}</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                {t('termsOfService.section3.content')}
              </p>
              <p className="text-gray-300 leading-relaxed mb-4">
                <strong>{t('termsOfService.section3.noReturns')}</strong>
              </p>
              <p className="text-gray-300 leading-relaxed mb-4">
                {t('termsOfService.section3.legalBasis')}
              </p>
              <p className="text-gray-300 leading-relaxed">
                {t('termsOfService.section3.consent')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">{t('termsOfService.section4.title')}</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                <strong>{t('termsOfService.section4.disclaimer')}</strong>
              </p>
              <p className="text-gray-300 leading-relaxed mb-4">
                {t('termsOfService.section4.content')}
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>{t('termsOfService.section4.items.0')}</li>
                <li>{t('termsOfService.section4.items.1')}</li>
                <li>{t('termsOfService.section4.items.2')}</li>
                <li>{t('termsOfService.section4.items.3')}</li>
                <li>{t('termsOfService.section4.items.4')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">{t('termsOfService.section5.title')}</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                {t('termsOfService.section5.content')}
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>{t('termsOfService.section5.items.0')}</li>
                <li>{t('termsOfService.section5.items.1')}</li>
                <li>{t('termsOfService.section5.items.2')}</li>
                <li>{t('termsOfService.section5.items.3')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">{t('termsOfService.section6.title')}</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                {t('termsOfService.section6.content')}
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>{t('termsOfService.section6.items.0')}</li>
                <li>{t('termsOfService.section6.items.1')}</li>
                <li>{t('termsOfService.section6.items.2')}</li>
                <li>{t('termsOfService.section6.items.3')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">{t('termsOfService.section7.title')}</h2>
              <p className="text-gray-300 leading-relaxed">
                {t('termsOfService.section7.content')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">{t('termsOfService.section8.title')}</h2>
              <p className="text-gray-300 leading-relaxed">
                {t('termsOfService.section8.content')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">{t('termsOfService.section9.title')}</h2>
              <p className="text-gray-300 leading-relaxed">
                {t('termsOfService.section9.content')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">{t('termsOfService.section10.title')}</h2>
              <p className="text-gray-300 leading-relaxed">
                {t('termsOfService.section10.content')}
              </p>
            </section>

            <div className="mt-8 pt-6 border-t border-gray-600">
              <p className="text-sm text-gray-400 text-center">
                {t('termsOfService.lastUpdated', { date: new Date().toLocaleDateString('es-ES') })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;