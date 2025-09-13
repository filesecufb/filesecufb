import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Lock, AlertCircle, Loader2, ArrowLeft, CheckCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useSEO } from '../hooks/useSEO'
import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'

const ResetPassword = () => {
  const { t } = useTranslation()
  useSEO('resetPassword')
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [isValidSession, setIsValidSession] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)

  useEffect(() => {
    // Check if user has a valid session from password reset
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          // Check if this is a password recovery session
          const urlParams = new URLSearchParams(window.location.search)
          const accessToken = urlParams.get('access_token')
          const refreshToken = urlParams.get('refresh_token')
          const type = urlParams.get('type')
          
          if (type === 'recovery' || accessToken || refreshToken) {
            setIsValidSession(true)
          } else {
            // Check if user is already logged in from a recovery link
            setIsValidSession(true)
          }
        } else {
          setError(t('auth.resetPassword.errors.invalidSession'))
        }
      } catch (error) {
        console.error('Error checking session:', error)
        setError(t('auth.resetPassword.errors.sessionError'))
      } finally {
        setIsCheckingSession(false)
      }
    }

    checkSession()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    // Validation
    if (!password || !confirmPassword) {
      setError(t('auth.resetPassword.errors.fieldsRequired'))
      setIsSubmitting(false)
      return
    }

    if (password.length < 6) {
      setError(t('auth.resetPassword.errors.passwordTooShort'))
      setIsSubmitting(false)
      return
    }

    if (password !== confirmPassword) {
      setError(t('auth.resetPassword.errors.passwordMismatch'))
      setIsSubmitting(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })
      
      if (error) {
        setError(error.message)
      } else {
        toast.success(t('auth.resetPassword.success'))
        // Redirect to dashboard after successful password reset
        setTimeout(() => {
          navigate('/dashboard')
        }, 2000)
      }
    } catch (error: any) {
      setError(error.message || t('auth.resetPassword.errors.generic'))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-dark-primary bg-gradient-to-br from-dark-primary via-dark-secondary to-dark-primary flex items-center justify-center px-4 py-8">
        <div className="flex items-center gap-3 text-white">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-lg uppercase tracking-wider">{t('auth.resetPassword.checking')}</span>
        </div>
      </div>
    )
  }

  if (!isValidSession) {
    return (
      <div className="min-h-screen bg-dark-primary bg-gradient-to-br from-dark-primary via-dark-secondary to-dark-primary flex items-center justify-center px-4 py-8 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse"></div>
        
        <div className="max-w-md w-full space-y-8 relative z-10">
          <div className="bg-gradient-dark backdrop-blur-sm rounded-2xl border border-elegant shadow-elegant p-8 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-h1 text-white mb-2 uppercase tracking-wider">{t('auth.resetPassword.invalidSession.title')}</h2>
            <p className="text-text-secondary uppercase tracking-wide mb-6">{t('auth.resetPassword.invalidSession.message')}</p>
            
            <Link to="/forgot-password" className="btn-primary inline-block py-3 px-6 font-semibold uppercase tracking-wider hover:scale-105 shadow-subtle hover:shadow-elegant transition-all duration-300">
              {t('auth.resetPassword.invalidSession.requestNew')}
            </Link>
          </div>
        </div>
      </div>
    )
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
            <h2 className="text-h1 text-white mb-2 uppercase tracking-wider" dangerouslySetInnerHTML={{ __html: t('auth.resetPassword.title') }}></h2>
            <p className="text-text-secondary uppercase tracking-wide">{t('auth.resetPassword.subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}
            
            {/* New Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-primary uppercase tracking-wider">
                {t('auth.resetPassword.form.password.label')}
              </label>
              <div className="flex items-center space-x-3 bg-dark-tertiary border border-elegant rounded-lg p-3 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20">
                <Lock className="h-5 w-5 text-primary flex-shrink-0" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="flex-1 bg-transparent text-white placeholder-text-secondary uppercase tracking-wider focus:outline-none"
                  placeholder={t('auth.resetPassword.form.password.placeholder')}
                />
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-primary uppercase tracking-wider">
                {t('auth.resetPassword.form.confirmPassword.label')}
              </label>
              <div className="flex items-center space-x-3 bg-dark-tertiary border border-elegant rounded-lg p-3 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20">
                <Lock className="h-5 w-5 text-primary flex-shrink-0" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="flex-1 bg-transparent text-white placeholder-text-secondary uppercase tracking-wider focus:outline-none"
                  placeholder={t('auth.resetPassword.form.confirmPassword.placeholder')}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-3 px-4 font-semibold uppercase tracking-wider hover:scale-105 shadow-subtle hover:shadow-elegant transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? t('auth.resetPassword.form.submitting') : t('auth.resetPassword.form.submit')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="text-primary hover:text-blue-dark font-medium transition-colors uppercase tracking-wider text-sm inline-flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              {t('auth.resetPassword.backToLogin')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResetPassword