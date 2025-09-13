import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useSEO } from '../hooks/useSEO'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'react-hot-toast'
import { supabase } from '../lib/supabase'

const Register = () => {
  const { t } = useTranslation()
  useSEO('register')
  const { signUp, signIn } = useAuth()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    
    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError(t('auth.register.errors.passwordMismatch'))
      setIsSubmitting(false)
      return
    }

    if (formData.password.length < 6) {
      setError(t('auth.register.errors.passwordTooShort'))
      setIsSubmitting(false)
      return
    }

    if (!formData.email.includes('@')) {
      setError(t('auth.register.errors.invalidEmail'))
      setIsSubmitting(false)
      return
    }

    try {
      const { error } = await signUp(formData.email, formData.password)
      
      if (error) {
        setError(error.message)
      } else {
        toast.success(t('auth.register.success'))
        
        // Después del registro exitoso, hacer login automático
        setTimeout(async () => {
          try {
            const loginResult = await signIn(formData.email, formData.password)
            if (!loginResult.error) {
              // Login exitoso, redirigir al dashboard con sección perfil
              setTimeout(() => {
                navigate('/client-dashboard?section=profile')
              }, 100)
            } else {
              // Si falla el login automático, ir al login manual
              navigate('/login')
            }
          } catch (loginError) {
            // Si falla el login automático, ir al login manual
            navigate('/login')
          }
        }, 500)
      }
    } catch (error: any) {
      setError(error.message || t('auth.register.errors.generic'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true)
    setError('')
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/client-dashboard`
        }
      })
      
      if (error) {
        setError(error.message)
        toast.error('Error al registrarse con Google')
      }
    } catch (error: any) {
      setError(error.message || 'Error al conectar con Google')
      toast.error('Error al conectar con Google')
    } finally {
      setIsGoogleLoading(false)
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
            <h2 className="text-h1 text-white mb-2 uppercase tracking-wider" dangerouslySetInnerHTML={{ __html: t('auth.register.title') }}></h2>
            <p className="text-text-secondary uppercase tracking-wide">{t('auth.register.subtitle')}</p>
          </div>

          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
            className="w-full flex items-center justify-center space-x-3 bg-white hover:bg-gray-50 text-gray-900 font-semibold py-3 px-4 rounded-lg border border-gray-300 hover:border-gray-400 transition-all duration-300 hover:scale-105 shadow-subtle hover:shadow-elegant uppercase tracking-wider mb-6 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isGoogleLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            <span>{isGoogleLoading ? 'Conectando...' : t('auth.register.google')}</span>
          </button>

          {/* Divider */}
          <div className="mb-6 flex items-center">
            <div className="flex-1 border-t border-elegant"></div>
            <span className="px-4 text-text-secondary uppercase tracking-wider text-sm">{t('auth.register.divider')}</span>
            <div className="flex-1 border-t border-elegant"></div>
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
                {t('auth.register.form.email.label')}
              </label>
              <div className="flex items-center space-x-3 bg-dark-tertiary border border-elegant rounded-lg p-3 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20">
                <Mail className="h-5 w-5 text-primary flex-shrink-0" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="flex-1 bg-transparent text-white placeholder-text-secondary uppercase tracking-wider focus:outline-none"
                  placeholder={t('auth.register.form.email.placeholder')}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-primary uppercase tracking-wider">
                {t('auth.register.form.password.label')}
              </label>
              <div className="flex items-center space-x-3 bg-dark-tertiary border border-elegant rounded-lg p-3 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20">
                <Lock className="h-5 w-5 text-primary flex-shrink-0" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="flex-1 bg-transparent text-white placeholder-text-secondary focus:outline-none"
                  placeholder={t('auth.register.form.password.placeholder')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-primary hover:text-blue-dark transition-colors flex-shrink-0"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-primary uppercase tracking-wider">
                {t('auth.register.form.confirmPassword.label')}
              </label>
              <div className="flex items-center space-x-3 bg-dark-tertiary border border-elegant rounded-lg p-3 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20">
                <Lock className="h-5 w-5 text-primary flex-shrink-0" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="flex-1 bg-transparent text-white placeholder-text-secondary focus:outline-none"
                  placeholder={t('auth.register.form.confirmPassword.placeholder')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-primary hover:text-blue-dark transition-colors flex-shrink-0"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-3 px-4 font-semibold uppercase tracking-wider hover:scale-105 shadow-subtle hover:shadow-elegant transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? t('auth.register.form.submitting') : t('auth.register.form.submit')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-text-secondary uppercase tracking-wide">
              {t('auth.register.login.text')}{' '}
              <Link to="/login" className="text-primary hover:text-blue-dark font-medium transition-colors uppercase tracking-wider">
                {t('auth.register.login.link')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register