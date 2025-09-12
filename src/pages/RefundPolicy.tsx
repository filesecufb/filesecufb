import React from 'react';
import { useTranslation } from 'react-i18next';

const RefundPolicy: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-dark-primary text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center">
            {t('refundPolicy.title')}
          </h1>
          
          <div className="bg-dark-secondary p-8 rounded-lg space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">{t('refundPolicy.overview.title')}</h2>
              <div className="text-gray-300 leading-relaxed whitespace-pre-line">
                {t('refundPolicy.overview.content')}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">{t('refundPolicy.digitalServices.title')}</h2>
              <div className="text-gray-300 leading-relaxed mb-4 whitespace-pre-line">
                {t('refundPolicy.digitalServices.content')}
              </div>
              <div className="bg-dark-primary p-4 rounded-lg border-l-4 border-primary">
                <div className="text-gray-300 leading-relaxed whitespace-pre-line">
                  <strong>{t('refundPolicy.digitalServices.noReturns')}</strong>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">{t('refundPolicy.expressConsent.title')}</h2>
              <div className="text-gray-300 leading-relaxed mb-4 whitespace-pre-line">
                {t('refundPolicy.expressConsent.content')}
              </div>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                {t('refundPolicy.expressConsent.list.0') && (
                  <li>{t('refundPolicy.expressConsent.list.0')}</li>
                )}
                {t('refundPolicy.expressConsent.list.1') && (
                  <li>{t('refundPolicy.expressConsent.list.1')}</li>
                )}
                {t('refundPolicy.expressConsent.list.2') && (
                  <li>{t('refundPolicy.expressConsent.list.2')}</li>
                )}
                {t('refundPolicy.expressConsent.list.3') && (
                  <li>{t('refundPolicy.expressConsent.list.3')}</li>
                )}
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">{t('refundPolicy.exceptionalCircumstances.title')}</h2>
              <div className="text-gray-300 leading-relaxed mb-4 whitespace-pre-line">
                {t('refundPolicy.exceptionalCircumstances.content')}
              </div>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                {t('refundPolicy.exceptionalCircumstances.list.0') && (
                  <li>{t('refundPolicy.exceptionalCircumstances.list.0')}</li>
                )}
                {t('refundPolicy.exceptionalCircumstances.list.1') && (
                  <li>{t('refundPolicy.exceptionalCircumstances.list.1')}</li>
                )}
                {t('refundPolicy.exceptionalCircumstances.list.2') && (
                  <li>{t('refundPolicy.exceptionalCircumstances.list.2')}</li>
                )}
                {t('refundPolicy.exceptionalCircumstances.list.3') && (
                  <li>{t('refundPolicy.exceptionalCircumstances.list.3')}</li>
                )}
                {t('refundPolicy.exceptionalCircumstances.list.4') && (
                  <li>{t('refundPolicy.exceptionalCircumstances.list.4')}</li>
                )}
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">{t('refundPolicy.refundProcess.title')}</h2>
              <div className="text-gray-300 leading-relaxed mb-4 whitespace-pre-line">
                {t('refundPolicy.refundProcess.content')}
              </div>
              <ol className="list-decimal list-inside text-gray-300 space-y-2 ml-4">
                {t('refundPolicy.refundProcess.steps.0') && (
                  <li>{t('refundPolicy.refundProcess.steps.0')}</li>
                )}
                {t('refundPolicy.refundProcess.steps.1') && (
                  <li>{t('refundPolicy.refundProcess.steps.1')}</li>
                )}
                {t('refundPolicy.refundProcess.steps.2') && (
                  <li>{t('refundPolicy.refundProcess.steps.2')}</li>
                )}
                {t('refundPolicy.refundProcess.steps.3') && (
                  <li>{t('refundPolicy.refundProcess.steps.3')}</li>
                )}
                {t('refundPolicy.refundProcess.steps.4') && (
                  <li>{t('refundPolicy.refundProcess.steps.4')}</li>
                )}
                {t('refundPolicy.refundProcess.steps.5') && (
                  <li>{t('refundPolicy.refundProcess.steps.5')}</li>
                )}
                {t('refundPolicy.refundProcess.steps.6') && (
                  <li>{t('refundPolicy.refundProcess.steps.6')}</li>
                )}
                {t('refundPolicy.refundProcess.steps.7') && (
                  <li>{t('refundPolicy.refundProcess.steps.7')}</li>
                )}
              </ol>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">{t('refundPolicy.partialRefunds.title')}</h2>
              <div className="text-gray-300 leading-relaxed mb-4 whitespace-pre-line">
                {t('refundPolicy.partialRefunds.content')}
              </div>
              <div className="text-gray-300 leading-relaxed whitespace-pre-line">
                {t('refundPolicy.partialRefunds.calculation')}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">{t('refundPolicy.paymentDisputes.title')}</h2>
              <div className="text-gray-300 leading-relaxed whitespace-pre-line">
                {t('refundPolicy.paymentDisputes.content')}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">{t('refundPolicy.modifications.title')}</h2>
              <div className="text-gray-300 leading-relaxed whitespace-pre-line">
                {t('refundPolicy.modifications.content')}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">{t('refundPolicy.contact.title')}</h2>
              <div className="text-gray-300 leading-relaxed mb-4 whitespace-pre-line">
                {t('refundPolicy.contact.content')}
              </div>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                {t('refundPolicy.contact.methods.0') && (
                  <li>{t('refundPolicy.contact.methods.0')}</li>
                )}
                {t('refundPolicy.contact.methods.1') && (
                  <li>{t('refundPolicy.contact.methods.1')}</li>
                )}
                {t('refundPolicy.contact.methods.2') && (
                  <li>{t('refundPolicy.contact.methods.2')}</li>
                )}
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">{t('refundPolicy.consent.title')}</h2>
              <div className="text-gray-300 leading-relaxed whitespace-pre-line">
                {t('refundPolicy.consent.content')}
              </div>
            </section>

            <div className="mt-8 pt-6 border-t border-gray-600">
              <p className="text-sm text-gray-400 text-center">
                {t('refundPolicy.lastUpdated')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefundPolicy;