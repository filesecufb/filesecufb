import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Disclaimer: React.FC = () => {
  const { t } = useTranslation();
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
            {t('disclaimer.title')}{' '}
            <span className="text-primary">{t('disclaimer.titleHighlight')}</span>
          </h1>
          
          <div className="bg-dark-secondary p-8 rounded-lg space-y-6">
            <div className="bg-red-900/20 border border-red-500 p-6 rounded-lg">
              <h2 className="text-xl font-bold text-red-300 mb-4">
                {t('disclaimer.warning.title')}
              </h2>
              <p className="text-red-200 leading-relaxed">
                {t('disclaimer.warning.content')}
              </p>
            </div>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">
                {t('disclaimer.section1.title')}
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                {t('disclaimer.section1.content')}
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                {(t('disclaimer.section1.risks', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                   <li key={index}>{item}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">
                {t('disclaimer.section2.title')}
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                {t('disclaimer.section2.content')}
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                {(t('disclaimer.section2.exemptions', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                   <li key={index}>{item}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">
                {t('disclaimer.section3.title')}
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                {t('disclaimer.section3.content')}
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                {(t('disclaimer.section3.noGuarantees', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                   <li key={index}>{item}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">
                {t('disclaimer.section4.title')}
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                {t('disclaimer.section4.content')}
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                {(t('disclaimer.section4.responsibilities', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                   <li key={index}>{item}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">
                {t('disclaimer.section5.title')}
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                {t('disclaimer.section5.content')}
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                {(t('disclaimer.section5.professionals', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                   <li key={index}>{item}</li>
                ))}
              </ul>
              <div className="bg-yellow-900/20 border border-yellow-500 p-4 rounded-lg mt-4">
                <p className="text-yellow-200 font-semibold">
                  {t('disclaimer.section5.warning')}
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">
                {t('disclaimer.section6.title')}
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                {t('disclaimer.section6.content')}
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                {(t('disclaimer.section6.limitations', { returnObjects: true }) as string[]).map((limitation: string, index: number) => (
                  <li key={index}>{limitation}</li>
                ))}
              </ul>
              <p className="text-gray-300 mt-4">
                {t('disclaimer.section6.note')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">
                {t('disclaimer.section7.title')}
              </h2>
              <p className="text-gray-300 leading-relaxed">
                {t('disclaimer.section7.content')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">
                {t('disclaimer.section8.title')}
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                {t('disclaimer.section8.content')}
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                {(t('disclaimer.section8.modifications', { returnObjects: true }) as string[]).map((modification: string, index: number) => (
                  <li key={index}>{modification}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">
                {t('disclaimer.section9.title')}
              </h2>
              <p className="text-gray-300 leading-relaxed">
                {t('disclaimer.section9.content')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">
                {t('disclaimer.section10.title')}
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                {t('disclaimer.section10.content')}
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                {(t('disclaimer.section10.acceptance', { returnObjects: true }) as string[]).map((acceptance: string, index: number) => (
                  <li key={index}>{acceptance}</li>
                ))}
              </ul>
            </section>

            <div className="bg-red-900/20 border border-red-500 p-6 rounded-lg mt-8">
              <h2 className="text-xl font-bold text-red-300 mb-4">
                {t('disclaimer.finalReminder.title')}
              </h2>
              <p className="text-red-200 leading-relaxed">
                {t('disclaimer.finalReminder.content')}
              </p>
            </div>

            <div className="text-center text-gray-400 text-sm mt-8">
              <p>{t('disclaimer.lastUpdated')} {currentDate}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Disclaimer;