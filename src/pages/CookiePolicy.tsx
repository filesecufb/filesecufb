import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const CookiePolicy: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-dark-primary text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Link 
              to="/" 
              className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              {t('common.backToHome')}
            </Link>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50">
            <h1 className="text-4xl font-bold text-primary mb-4">{t('cookiePolicy.title')}</h1>
            <p className="text-gray-300 mb-8">{t('cookiePolicy.lastUpdated')}</p>
          
          <div className="bg-dark-secondary p-8 rounded-lg space-y-6">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-primary mb-4">{t('cookiePolicy.whatAreCookies.title')}</h2>
              <p className="text-gray-300 mb-4">
                {t('cookiePolicy.whatAreCookies.content')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-primary mb-4">{t('cookiePolicy.typesOfCookies.title')}</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-medium text-primary mb-2">{t('cookiePolicy.typesOfCookies.functional.title')}</h3>
                  <p className="text-gray-300">
                    {t('cookiePolicy.typesOfCookies.functional.content')}
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-medium text-primary mb-2">{t('cookiePolicy.typesOfCookies.analytics.title')}</h3>
                  <p className="text-gray-300">
                    {t('cookiePolicy.typesOfCookies.analytics.content')}
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-medium text-primary mb-2">{t('cookiePolicy.typesOfCookies.marketing.title')}</h3>
                  <p className="text-gray-300">
                    {t('cookiePolicy.typesOfCookies.marketing.content')}
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-primary mb-4">{t('cookiePolicy.howToManage.title')}</h2>
              <p className="text-gray-300 mb-4">
                {t('cookiePolicy.howToManage.content')}
              </p>
              <p className="text-gray-300 mb-4">
                {t('cookiePolicy.howToManage.browserSettings')}
              </p>
              <p className="text-gray-300">
                {t('cookiePolicy.howToManage.moreInfo')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-primary mb-4">{t('cookiePolicy.thirdPartyCookies.title')}</h2>
              <p className="text-gray-300">
                {t('cookiePolicy.thirdPartyCookies.content')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-primary mb-4">{t('cookiePolicy.cookieDuration.title')}</h2>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                <li>{t('cookiePolicy.cookieDuration.session')}</li>
                <li>{t('cookiePolicy.cookieDuration.persistent')}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-primary mb-4">{t('cookiePolicy.consent.title')}</h2>
              <p className="text-gray-300">
                {t('cookiePolicy.consent.content')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-primary mb-4">{t('cookiePolicy.rights.title')}</h2>
              <p className="text-gray-300">
                {t('cookiePolicy.rights.content')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary mb-4">{t('cookiePolicy.contact.title')}</h2>
              <p className="text-gray-300">
                {t('cookiePolicy.contact.content')}
              </p>
            </section>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookiePolicy;