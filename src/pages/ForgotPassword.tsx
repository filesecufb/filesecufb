import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, AlertCircle, Loader2, ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'react-hot-toast'

const ForgotPassword = () => {
  const { t } = useTranslation()
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    if (!email) {
      setError(t('auth.forgotPassword.errors.emailRequired'))
      setIsSubmitting(false)
      return
    }

    if (!email.includes('@')) {
      setError(t('auth.forgotPassword.errors.invalidEmail'))
      setIsSubmitting(false)
      return
    }

    try {
      const { error } = await resetPassword(email)
      
      if (error) {
        setError(error.message)
      } else {
        toast.success(t('auth.forgotPassword.success'))
      }
    } catch (error: any) {
      setError(error.message || t('auth.forgotPassword.errors.generic'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-primary bg-gradient-to-br from-dark-primary via-dark-secondary to-dark-primary flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse"></div>
      
      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="bg-gradient-dark backdrop-blur-sm rounded-2xl border border-elegant shadow-elegant p-8">
          <div className="text-center mb-8">
            <h2 className="text-h1 text-white mb-2 uppercase tracking-wider">{t('auth.forgotPassword.title')}</h2>
            <p className="text-text-secondary uppercase tracking-wide">{t('auth.forgotPassword.subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}
            
            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-primary uppercase tracking-wider">
                {t('auth.forgotPassword.form.email.label')}
              </label>
              <div className="flex items-center space-x-3 bg-dark-tertiary border border-elegant rounded-lg p-3 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20">
                <Mail className="h-5 w-5 text-primary flex-shrink-0" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1 bg-transparent text-white placeholder-text-secondary uppercase tracking-wider focus:outline-none"
                  placeholder={t('auth.forgotPassword.form.email.placeholder')}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-3 px-4 font-semibold uppercase tracking-wider hover:scale-105 shadow-subtle hover:shadow-elegant transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? t('auth.forgotPassword.form.submitting') : t('auth.forgotPassword.form.submit')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="text-primary hover:text-blue-dark font-medium transition-colors uppercase tracking-wider text-sm inline-flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              {t('auth.forgotPassword.backToLogin')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword