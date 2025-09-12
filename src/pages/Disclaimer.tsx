import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Disclaimer: React.FC = () => {
  const { t } = useTranslation('translation');
  const currentDate = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-dark-primary text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Botón de regreso */}
          <Link 
            to="/" 
            className="inline-flex items-center text-primary hover:text-primary-light mb-8 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Volver al inicio
          </Link>
          <h1 className="text-4xl font-bold mb-8 text-center">
            {t('disclaimer.title')}
          </h1>
          
          <div className="bg-dark-secondary p-8 rounded-lg space-y-6">
            <div className="bg-red-900/20 border border-red-500 p-6 rounded-lg">
              <h2 className="text-xl font-bold text-red-300 mb-4">
                {t('disclaimer.generalDisclaimer.title')}
              </h2>
              <p className="text-red-200 leading-relaxed">
                {t('disclaimer.generalDisclaimer.content')}
              </p>
            </div>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">
                {t('disclaimer.professionalAdvice.title')}
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                {t('disclaimer.professionalAdvice.content')}
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>{t('disclaimer.professionalAdvice.list.0')}</li>
                <li>{t('disclaimer.professionalAdvice.list.1')}</li>
                <li>{t('disclaimer.professionalAdvice.list.2')}</li>
                <li>{t('disclaimer.professionalAdvice.list.3')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">
                {t('disclaimer.accuracyOfInformation.title')}
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                {t('disclaimer.accuracyOfInformation.content')}
              </p>
              <p className="text-gray-300 leading-relaxed">
                {t('disclaimer.accuracyOfInformation.noGuarantee')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">
                {t('disclaimer.externalLinks.title')}
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                {t('disclaimer.externalLinks.content')}
              </p>
              <p className="text-gray-300 leading-relaxed">
                {t('disclaimer.externalLinks.noResponsibility')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">
                {t('disclaimer.limitationOfLiability.title')}
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                {t('disclaimer.limitationOfLiability.content')}
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>{t('disclaimer.limitationOfLiability.exclusions.0')}</li>
                <li>{t('disclaimer.limitationOfLiability.exclusions.1')}</li>
                <li>{t('disclaimer.limitationOfLiability.exclusions.2')}</li>
                <li>{t('disclaimer.limitationOfLiability.exclusions.3')}</li>
                <li>{t('disclaimer.limitationOfLiability.exclusions.4')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">
                {t('disclaimer.technicalIssues.title')}
              </h2>
              <p className="text-gray-300 leading-relaxed">
                {t('disclaimer.technicalIssues.content')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">
                {t('disclaimer.userResponsibility.title')}
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                {t('disclaimer.userResponsibility.content')}
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>{t('disclaimer.userResponsibility.responsibilities.0')}</li>
                <li>{t('disclaimer.userResponsibility.responsibilities.1')}</li>
                <li>{t('disclaimer.userResponsibility.responsibilities.2')}</li>
                <li>{t('disclaimer.userResponsibility.responsibilities.3')}</li>
                <li>{t('disclaimer.userResponsibility.responsibilities.4')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">
                {t('disclaimer.modifications.title')}
              </h2>
              <p className="text-gray-300 leading-relaxed">
                {t('disclaimer.modifications.content')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">
                {t('disclaimer.governingLaw.title')}
              </h2>
              <p className="text-gray-300 leading-relaxed">
                {t('disclaimer.governingLaw.content')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">
                {t('disclaimer.contact.title')}
              </h2>
              <p className="text-gray-300 leading-relaxed">
                {t('disclaimer.contact.content')}
              </p>
            </section>



            <div className="text-center text-gray-400 text-sm mt-8">
              <p>{t('disclaimer.lastUpdated')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Disclaimer;