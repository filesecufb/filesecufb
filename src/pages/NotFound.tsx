import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Home, ArrowLeft, Search, Settings, AlertTriangle, Wrench } from 'lucide-react'

const NotFound: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const handleGoBack = () => {
    navigate(-1)
  }

  return (
    <div className="min-h-screen bg-dark text-white">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-dark via-dark-secondary to-dark opacity-90"></div>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.02"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50"></div>

      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <div className="max-w-2xl mx-auto text-center">
          {/* 404 Icon */}
          <div className="mb-8">
            <div className="relative inline-flex items-center justify-center">
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"></div>
              <div className="relative bg-dark-primary/80 border border-elegant p-8 rounded-3xl">
                <AlertTriangle className="h-20 w-20 text-primary mx-auto" />
              </div>
            </div>
          </div>

          {/* Error Code */}
          <div className="mb-6">
            <h1 className="text-8xl md:text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary to-accent mb-4">
              404
            </h1>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              {t('Page Not Found')}
            </h2>
            <p className="text-lg text-text-secondary max-w-lg mx-auto leading-relaxed">
              {t('The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.')}
            </p>
          </div>

          {/* Suggestions */}
          <div className="mb-8 p-6 bg-dark-primary/50 rounded-xl border border-elegant">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center justify-center gap-2">
              <Wrench className="h-5 w-5 text-primary" />
              {t('What you can do')}
            </h3>
            <ul className="text-text-secondary space-y-2 text-left max-w-md mx-auto">
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                {t('Check the URL for any typos')}
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                {t('Go back to the previous page')}
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                {t('Visit our homepage')}
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                {t('Search for ECU tuning services')}
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleGoBack}
              className="group bg-dark-primary/80 hover:bg-dark-primary border border-elegant hover:border-primary/50 px-6 py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-3"
            >
              <ArrowLeft className="h-5 w-5 text-primary group-hover:scale-110 transition-transform duration-300" />
              <span className="text-white group-hover:text-primary transition-colors duration-300">
                {t('Go Back')}
              </span>
            </button>

            <Link
              to="/"
              className="group bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 px-6 py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-primary/25"
            >
              <Home className="h-5 w-5 text-white group-hover:scale-110 transition-transform duration-300" />
              <span className="text-white font-medium">
                {t('Go Home')}
              </span>
            </Link>

            <Link
              to="/services"
              className="group bg-dark-primary/80 hover:bg-dark-primary border border-elegant hover:border-primary/50 px-6 py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-3"
            >
              <Settings className="h-5 w-5 text-primary group-hover:scale-110 transition-transform duration-300" />
              <span className="text-white group-hover:text-primary transition-colors duration-300">
                {t('View Services')}
              </span>
            </Link>
          </div>

          {/* Popular Services Quick Access */}
          <div className="mt-12 pt-8 border-t border-elegant/30">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center justify-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              {t('Popular Services')}
            </h3>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                to="/services"
                className="bg-dark-primary/50 hover:bg-primary/10 border border-elegant hover:border-primary/50 px-4 py-2 rounded-lg transition-all duration-300 text-text-secondary hover:text-primary text-sm"
              >
                {t('Stage 1 Tuning')}
              </Link>
              <Link
                to="/services"
                className="bg-dark-primary/50 hover:bg-primary/10 border border-elegant hover:border-primary/50 px-4 py-2 rounded-lg transition-all duration-300 text-text-secondary hover:text-primary text-sm"
              >
                {t('DPF Delete')}
              </Link>
              <Link
                to="/services"
                className="bg-dark-primary/50 hover:bg-primary/10 border border-elegant hover:border-primary/50 px-4 py-2 rounded-lg transition-all duration-300 text-text-secondary hover:text-primary text-sm"
              >
                {t('ECU Remapping')}
              </Link>
              <Link
                to="/services"
                className="bg-dark-primary/50 hover:bg-primary/10 border border-elegant hover:border-primary/50 px-4 py-2 rounded-lg transition-all duration-300 text-text-secondary hover:text-primary text-sm"
              >
                {t('EGR Solutions')}
              </Link>
            </div>
          </div>

          {/* Contact Support */}
          <div className="mt-8 text-center">
            <p className="text-text-secondary text-sm">
              {t('Need help?')}{' '}
              <Link
                to="/contact"
                className="text-primary hover:text-accent transition-colors duration-300 underline"
              >
                {t('Contact our support team')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotFound