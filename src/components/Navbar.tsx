import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X, Zap, User, LogOut } from 'lucide-react'
import useScrollDirection from '../hooks/useScrollDirection'
import { useTranslation } from 'react-i18next'
import LanguageSelector from './LanguageSelector'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'react-hot-toast'

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const { isVisible } = useScrollDirection(10)
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user, profile, signOut, loading, isAdmin, isClient } = useAuth()


  // Función para manejar el clic en "Mi cuenta"
  const handleAccountClick = () => {
    if (user && profile) {
      // Si está logueado, redirigir al dashboard correspondiente
      if (isAdmin) {
        navigate('/admin')
      } else if (isClient) {
        // Para clientes, ir a la sección perfil del dashboard
        navigate('/client-dashboard?section=profile')
      } else {
        // Fallback: si no se detecta el rol correctamente, usar el rol del perfil directamente
        if (profile.role === 'admin') {
          navigate('/admin')
        } else {
          // Por defecto, todos los usuarios van al dashboard de cliente con sección perfil
          navigate('/client-dashboard?section=profile')
        }
      }
    } else {
      // Si no está logueado, ir al login
      navigate('/login')
    }
    setIsMenuOpen(false)
    setShowUserMenu(false)
  }

  // Función específica para ir al perfil (para clientes)
  const handleProfileClick = () => {
    if (isClient) {
      navigate('/client-dashboard?section=profile')
    } else if (isAdmin) {
      navigate('/admin')
    }
    setIsMenuOpen(false)
    setShowUserMenu(false)
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('Sesión cerrada exitosamente')
      // Usar window.location para evitar remontaje del AuthProvider
      window.location.href = '/'
    } catch (error) {
      console.error('Sign out error:', error)
      toast.error('Error al cerrar sesión')
    }
    setIsMenuOpen(false)
    setShowUserMenu(false)
  }

  return (
    <nav className={`bg-gradient-dark border-b border-elegant shadow-elegant fixed top-0 left-0 right-0 z-50 backdrop-blur-sm transition-transform duration-300 ${
      isVisible ? 'translate-y-0' : '-translate-y-full'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center group transition-all duration-300 hover:scale-105">
              <div className="p-2 bg-gradient-primary rounded-lg mr-3 transition-all duration-300 group-hover:shadow-elegant">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <span className="text-2xl font-bold text-white font-accent">
                FILES<span className="text-primary">ECUFB</span>
              </span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-white hover:text-primary transition-all duration-300 font-medium relative group">
              <span className="relative z-10">{t('navbar.links.home')}</span>
              <span className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
            </Link>
            <Link to="/services" className="text-white hover:text-primary transition-all duration-300 font-medium relative group">
              <span className="relative z-10">{t('navbar.links.services')}</span>
              <span className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
            </Link>
            <Link to="/contact" className="text-white hover:text-primary transition-all duration-300 font-medium relative group">
              <span className="relative z-10">{t('navbar.links.contact')}</span>
              <span className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
            </Link>

            {/* Botón específico según rol del usuario */}
            {user && profile && !loading && (
              isAdmin ? (
                <Link to="/admin" className="text-white hover:text-primary transition-all duration-300 font-medium relative group">
                  <span className="relative z-10">{t('navbar.authenticated.dashboard')}</span>
                  <span className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                </Link>
              ) : (
                <Link to="/client-dashboard?section=orders" className="text-white hover:text-primary transition-all duration-300 font-medium relative group">
                  <span className="relative z-10">{t('navbar.authenticated.myOrders')}</span>
                  <span className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                </Link>
              )
            )}
            
            {loading ? (
              <div className="w-10 h-10 bg-gray-700 animate-pulse rounded-full"></div>
            ) : user && profile ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 text-white hover:text-primary transition-all duration-300 font-medium bg-gradient-primary/10 border border-primary/20 px-3 py-2 rounded-lg hover:bg-gradient-primary/20"
                >
                  <User className="w-5 h-5" />
                  <span className="hidden lg:inline">{profile.full_name || profile.email}</span>
                  <span className="lg:hidden">{profile.email?.charAt(0).toUpperCase()}</span>
                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg border border-gray-700 py-1 z-50">
                    <button
                      onClick={isAdmin ? handleAccountClick : handleProfileClick}
                      className="w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700 transition-colors flex items-center space-x-2"
                    >
                      <User className="w-4 h-4" />
                      <span>{isAdmin ? t('navbar.authenticated.myDashboard') : t('navbar.authenticated.myProfile')}</span>
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700 transition-colors flex items-center space-x-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{t('navbar.authenticated.logout')}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={handleAccountClick} className="btn-primary px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:scale-105">
                {t('navbar.buttons.account')}
              </button>
            )}
            
            {/* Language Selector */}
            <LanguageSelector />
          </div>

          <div className="md:hidden flex items-center">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white hover:text-primary p-2 border border-elegant rounded-lg hover:bg-gradient-primary transition-all duration-300">
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden animate-slide-up">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gradient-dark border-t border-elegant">
            <Link to="/" className="text-white hover:text-primary block px-3 py-2 rounded-lg font-medium transition-all duration-300 hover:bg-gradient-primary" onClick={() => setIsMenuOpen(false)}>
              {t('navbar.links.home')}
            </Link>
            <Link to="/services" className="text-white hover:text-primary block px-3 py-2 rounded-lg font-medium transition-all duration-300 hover:bg-gradient-primary" onClick={() => setIsMenuOpen(false)}>
              {t('navbar.links.services')}
            </Link>
            <Link to="/contact" className="text-white hover:text-primary block px-3 py-2 rounded-lg font-medium transition-all duration-300 hover:bg-gradient-primary" onClick={() => setIsMenuOpen(false)}>
              {t('navbar.links.contact')}
            </Link>

            {/* Botón específico según rol del usuario - Mobile */}
            {user && profile && !loading && (
              isAdmin ? (
                <Link to="/admin" className="text-white hover:text-primary block px-3 py-2 rounded-lg font-medium transition-all duration-300 hover:bg-gradient-primary" onClick={() => setIsMenuOpen(false)}>
                  {t('navbar.authenticated.dashboard')}
                </Link>
              ) : (
                <Link to="/client-dashboard?section=orders" className="text-white hover:text-primary block px-3 py-2 rounded-lg font-medium transition-all duration-300 hover:bg-gradient-primary" onClick={() => setIsMenuOpen(false)}>
                  {t('navbar.authenticated.myOrders')}
                </Link>
              )
            )}
            
            {/* Language Selector Mobile */}
            <LanguageSelector />
            
            {loading ? (
              <div className="w-full h-10 bg-gray-700 animate-pulse rounded-lg mx-3"></div>
            ) : user && profile ? (
              <div className="px-3 py-2 border-t border-gray-700 mt-2">
                <div className="text-sm text-gray-400 mb-2">
                  {profile.full_name || profile.email}
                </div>
                <button
                  onClick={isAdmin ? handleAccountClick : handleProfileClick}
                  className="w-full text-left text-white hover:text-primary flex items-center space-x-2 py-2"
                >
                  <User className="w-4 h-4" />
                  <span>{isAdmin ? t('navbar.authenticated.myDashboard') : t('navbar.authenticated.myProfile')}</span>
                </button>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left text-white hover:text-primary flex items-center space-x-2 py-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t('navbar.authenticated.logout')}</span>
                </button>
              </div>
            ) : (
              <button onClick={() => { handleAccountClick(); setIsMenuOpen(false) }} className="btn-primary block px-3 py-2 rounded-lg font-medium mx-3 text-center transition-all duration-300">
                {t('navbar.buttons.account')}
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar