import React from 'react';
import { useTranslation } from 'react-i18next';

const RefundPolicy: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-dark-primary text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center">
            {t('refundPolicy.title')} <span className="text-primary">{t('refundPolicy.titleHighlight')}</span>
          </h1>
          
          <div className="bg-dark-secondary p-8 rounded-lg space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">{t('refundPolicy.section1.title')}</h2>
              <div className="bg-red-900/20 border border-red-500 p-4 rounded-lg mb-4">
                <p className="text-red-300 font-semibold text-lg">
                  {t('refundPolicy.section1.warning')}
                </p>
              </div>
              <p className="text-gray-300 leading-relaxed">
                {t('refundPolicy.section1.content')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">{t('refundPolicy.section2.title')}</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                {t('refundPolicy.section2.content')}
              </p>
              <div className="bg-dark-primary p-4 rounded-lg border-l-4 border-primary">
                <p className="text-gray-300 leading-relaxed mb-2">
                  <strong>{t('refundPolicy.section2.legalTitle')}</strong>
                </p>
                <p className="text-gray-300 leading-relaxed italic">
                  {t('refundPolicy.section2.legalText')}
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">{t('refundPolicy.section3.title')}</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                {t('refundPolicy.section3.content')}
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                {(t('refundPolicy.section3.list', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">{t('refundPolicy.section4.title')}</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                {t('refundPolicy.section4.content')}
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                {(t('refundPolicy.section4.list', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">{t('refundPolicy.section5.title')}</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                {t('refundPolicy.section5.content')}
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                {(t('refundPolicy.section5.list', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">{t('refundPolicy.section6.title')}</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                {t('refundPolicy.section6.content')}
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                {(t('refundPolicy.section6.list', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">{t('refundPolicy.section7.title')}</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                {t('refundPolicy.section7.content')}
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                {(t('refundPolicy.section7.list', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
              <p className="text-gray-300 leading-relaxed mt-4">
                {t('refundPolicy.section7.important')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">{t('refundPolicy.section8.title')}</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                {t('refundPolicy.section8.content')}
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                {(t('refundPolicy.section8.list', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
              <p className="text-gray-300 leading-relaxed mt-4">
                {t('refundPolicy.section8.note')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">{t('refundPolicy.section9.title')}</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                {t('refundPolicy.section9.content')}
              </p>
              <ol className="list-decimal list-inside text-gray-300 space-y-2 ml-4">
                {(t('refundPolicy.section9.list', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                  <li key={index}>{item}</li>
                ))}
              </ol>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">{t('refundPolicy.section10.title')}</h2>
              <p className="text-gray-300 leading-relaxed">
                {t('refundPolicy.section10.content')}
              </p>
            </section>

            <div className="mt-8 pt-6 border-t border-gray-600">
              <p className="text-sm text-gray-400 text-center">
                {t('refundPolicy.lastUpdated')} {new Date().toLocaleDateString('es-ES')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefundPolicy;