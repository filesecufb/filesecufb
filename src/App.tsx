import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CookieBanner from './components/CookieBanner';
import ThirdPartyScripts from './components/ThirdPartyScripts';
import { useCookieConsent } from './hooks/useCookieConsent';
import { useSEO } from './hooks/useSEO';
import { Settings } from 'lucide-react';
import { AuthProvider } from './contexts/AuthContext';
import { CategoryProvider } from './contexts/CategoryContext';
import Home from './pages/Home';
import Services from './pages/Services';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AdminDashboard from './pages/AdminDashboard';
import ClientDashboard from './pages/ClientDashboard';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import RefundPolicy from './pages/RefundPolicy';
import Disclaimer from './pages/Disclaimer';
import CookiePolicy from './pages/CookiePolicy';
import ServiceConfiguration from './pages/ServiceConfiguration';
import OrderDetails from './pages/OrderDetails';
import ClientDetails from './pages/ClientDetails';
import NotFound from './pages/NotFound';

// Componente para el botón flotante de cookies
const CookieFloatingButton: React.FC = () => {
  const { hasConsent, isInitialized } = useCookieConsent();

  // No mostrar si no está inicializado o no hay consentimiento
  if (!isInitialized || !hasConsent) {
    return null;
  }

  const handleRevokeConsent = () => {
    localStorage.removeItem('cookie-consent');
    window.location.reload();
  };

  return (
    <button
      onClick={handleRevokeConsent}
      className="fixed bottom-6 right-6 z-40 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      title="Configurar cookies"
      type="button"
      aria-label="Configurar preferencias de cookies"
    >
      <Settings className="h-5 w-5" />
      <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none shadow-lg">
        Configurar cookies
      </span>
    </button>
  );
};

// Componente interno para usar hooks de React Router
const AppContent: React.FC = () => {
  // Hook para actualizar SEO automáticamente
  useSEO();
  
  return (
    <div className="min-h-screen bg-dark-primary flex flex-col">
      <Navbar />
      <main className="flex-grow pt-16">
        <Routes>
          <Route path="/" element={<Home />} />
          {/* Placeholder routes for other pages */}
          <Route path="/services" element={<Services />} />
          <Route path="/service-configuration/:serviceId?" element={<ServiceConfiguration />} />
          <Route path="/gallery" element={<div className="min-h-screen bg-dark-primary flex items-center justify-center"><h1 className="text-white text-2xl">Galería - En construcción</h1></div>} />
          <Route path="/about" element={<div className="min-h-screen bg-dark-primary flex items-center justify-center"><h1 className="text-white text-2xl">Nosotros - En construcción</h1></div>} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/order-details/:orderId" element={<OrderDetails />} />
          <Route path="/admin/client-details/:clientId" element={<ClientDetails />} />
          <Route path="/client-dashboard" element={<ClientDashboard />} />
          <Route path="/dashboard" element={<ClientDashboard />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />
          <Route path="/disclaimer" element={<Disclaimer />} />
          <Route path="/cookie-policy" element={<CookiePolicy />} />
          {/* Catch-all route for 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      
      {/* Sistema de cookies */}
      <CookieBanner />
      <CookieFloatingButton />
      <ThirdPartyScripts />
      
      {/* Toaster para notificaciones */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1f2937',
            color: '#fff',
            border: '1px solid #374151'
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff'
            }
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff'
            }
          }
        }}
      />
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <CategoryProvider>
          <AppContent />
        </CategoryProvider>
      </AuthProvider>
    </Router>
  );
}

export default App
