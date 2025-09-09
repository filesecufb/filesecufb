import React from 'react';
import { useTranslation } from 'react-i18next';

const PrivacyPolicy: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-dark-primary text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center" dangerouslySetInnerHTML={{ __html: t('privacyPolicy.title') }}>
          </h1>
          
          <div className="bg-dark-secondary p-8 rounded-lg space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">{t('privacyPolicy.sections.generalInfo.title')}</h2>
              <p className="text-gray-300 leading-relaxed">
                {t('privacyPolicy.sections.generalInfo.content')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">{t('privacyPolicy.sections.dataController.title')}</h2>
              <p className="text-gray-300 leading-relaxed">
                {t('privacyPolicy.sections.dataController.content')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">{t('privacyPolicy.sections.dataCollection.title')}</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                {t('privacyPolicy.sections.dataCollection.intro')}
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>{t('privacyPolicy.sections.dataCollection.items.identification')}</li>
                <li>{t('privacyPolicy.sections.dataCollection.items.contact')}</li>
                <li>{t('privacyPolicy.sections.dataCollection.items.navigation')}</li>
                <li>{t('privacyPolicy.sections.dataCollection.items.transaction')}</li>
                <li>{t('privacyPolicy.sections.dataCollection.items.technical')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">{t('privacyPolicy.sections.purpose.title')}</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                {t('privacyPolicy.sections.purpose.intro')}
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>{t('privacyPolicy.sections.purpose.items.orders')}</li>
                <li>{t('privacyPolicy.sections.purpose.items.communication')}</li>
                <li>{t('privacyPolicy.sections.purpose.items.legal')}</li>
                <li>{t('privacyPolicy.sections.purpose.items.improvement')}</li>
                <li>{t('privacyPolicy.sections.purpose.items.security')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">{t('privacyPolicy.sections.legalBasis.title')}</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                {t('privacyPolicy.sections.legalBasis.intro')}
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>{t('privacyPolicy.sections.legalBasis.items.contract')}</li>
                <li>{t('privacyPolicy.sections.legalBasis.items.consent')}</li>
                <li>{t('privacyPolicy.sections.legalBasis.items.interest')}</li>
                <li>{t('privacyPolicy.sections.legalBasis.items.obligation')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">{t('privacyPolicy.sections.retention.title')}</h2>
              <p className="text-gray-300 leading-relaxed">
                {t('privacyPolicy.sections.retention.content')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">{t('privacyPolicy.sections.recipients.title')}</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                {t('privacyPolicy.sections.recipients.intro')}
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>{t('privacyPolicy.sections.recipients.items.providers')}</li>
                <li>{t('privacyPolicy.sections.recipients.items.financial')}</li>
                <li>{t('privacyPolicy.sections.recipients.items.authorities')}</li>
                <li>{t('privacyPolicy.sections.recipients.items.advisors')}</li>
              </ul>
              <p className="text-gray-300 leading-relaxed mt-4">
                {t('privacyPolicy.sections.recipients.confidentiality')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">{t('privacyPolicy.sections.transfers.title')}</h2>
              <p className="text-gray-300 leading-relaxed">
                {t('privacyPolicy.sections.transfers.content')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">{t('privacyPolicy.sections.rights.title')}</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                {t('privacyPolicy.sections.rights.intro')}
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>{t('privacyPolicy.sections.rights.items.access')}</li>
                <li>{t('privacyPolicy.sections.rights.items.rectification')}</li>
                <li>{t('privacyPolicy.sections.rights.items.erasure')}</li>
                <li>{t('privacyPolicy.sections.rights.items.restriction')}</li>
                <li>{t('privacyPolicy.sections.rights.items.portability')}</li>
                <li>{t('privacyPolicy.sections.rights.items.objection')}</li>
                <li>{t('privacyPolicy.sections.rights.items.withdrawal')}</li>
              </ul>
              <p className="text-gray-300 leading-relaxed mt-4">
                {t('privacyPolicy.sections.rights.contact')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">{t('privacyPolicy.sections.cookies.title')}</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                {t('privacyPolicy.sections.cookies.intro')}
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>{t('privacyPolicy.sections.cookies.items.functionality')}</li>
                <li>{t('privacyPolicy.sections.cookies.items.analytics')}</li>
                <li>{t('privacyPolicy.sections.cookies.items.personalization')}</li>
                <li>{t('privacyPolicy.sections.cookies.items.measurement')}</li>
              </ul>
              <p className="text-gray-300 leading-relaxed mt-4">
                {t('privacyPolicy.sections.cookies.management')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">{t('privacyPolicy.sections.security.title')}</h2>
              <p className="text-gray-300 leading-relaxed">
                {t('privacyPolicy.sections.security.content')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">{t('privacyPolicy.sections.authority.title')}</h2>
              <p className="text-gray-300 leading-relaxed">
                {t('privacyPolicy.sections.authority.content')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">{t('privacyPolicy.sections.modifications.title')}</h2>
              <p className="text-gray-300 leading-relaxed">
                {t('privacyPolicy.sections.modifications.content')}
              </p>
            </section>

            <div className="mt-8 pt-6 border-t border-gray-600">
              <p className="text-sm text-gray-400 text-center">
                {t('privacyPolicy.lastUpdated')} {new Date().toLocaleDateString('es-ES')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;