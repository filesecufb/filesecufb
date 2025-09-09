import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, MapPin, Building, FileText, ShoppingCart, Calendar, Euro } from 'lucide-react';

interface ClientInfo {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  companyName: string;
  nifCif: string;
  billingAddress: string;
  billingCity: string;
  billingPostalCode: string;
  country: string;
  orders: Array<{
    id: string;
    date: string;
    service: string;
    status: string;
    total: number;
  }>;
}

const ClientDetails: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();

  // Mock data - en una aplicación real esto vendría de una API
  const clientsData: { [key: string]: ClientInfo } = {
    '1234': {
      id: '1234',
      name: 'Juan Pérez',
      email: 'juan@email.com',
      phone: '+34 666 123 456',
      address: 'Calle Mayor 123',
      city: 'Madrid',
      postalCode: '28001',
      companyName: 'Transportes Pérez S.L.',
      nifCif: 'B12345678',
      billingAddress: 'Calle Mayor 123',
      billingCity: 'Madrid',
      billingPostalCode: '28001',
      country: 'España',
      orders: [
        { id: '2024001', date: '2024-01-15', service: 'Stage 2', status: 'Completado', total: 850 },
        { id: '2024002', date: '2024-02-20', service: 'DPF Delete', status: 'En proceso', total: 650 },
        { id: '2024003', date: '2024-03-10', service: 'Stage 1', status: 'Pendiente', total: 450 }
      ]
    },
    '1235': {
      id: '1235',
      name: 'María García',
      email: 'maria@email.com',
      phone: '+34 677 234 567',
      address: 'Avenida de la Paz 45',
      city: 'Barcelona',
      postalCode: '08001',
      companyName: 'García Logística',
      nifCif: 'B87654321',
      billingAddress: 'Avenida de la Paz 45',
      billingCity: 'Barcelona',
      billingPostalCode: '08001',
      country: 'España',
      orders: [
        { id: '2024004', date: '2024-01-25', service: 'EGR Delete', status: 'Completado', total: 750 }
      ]
    },
    '1236': {
      id: '1236',
      name: 'Carlos López',
      email: 'carlos@email.com',
      phone: '+34 688 345 678',
      address: 'Plaza del Sol 12',
      city: 'Valencia',
      postalCode: '46001',
      companyName: 'López Transportes',
      nifCif: 'B11223344',
      billingAddress: 'Plaza del Sol 12',
      billingCity: 'Valencia',
      billingPostalCode: '46001',
      country: 'España',
      orders: [
        { id: '2024005', date: '2024-01-10', service: 'Stage 2', status: 'Completado', total: 850 },
        { id: '2024006', date: '2024-02-15', service: 'DPF Delete', status: 'Completado', total: 650 },
        { id: '2024007', date: '2024-03-05', service: 'Stage 1', status: 'En proceso', total: 450 },
        { id: '2024008', date: '2024-03-20', service: 'EGR Delete', status: 'Pendiente', total: 750 },
        { id: '2024009', date: '2024-04-01', service: 'Stage 2', status: 'Pendiente', total: 850 }
      ]
    },
    '1237': {
      id: '1237',
      name: 'Ana Martín',
      email: 'ana@email.com',
      phone: '+34 699 456 789',
      address: 'Calle de la Rosa 78',
      city: 'Sevilla',
      postalCode: '41001',
      companyName: 'Martín y Asociados',
      nifCif: 'B55667788',
      billingAddress: 'Calle de la Rosa 78',
      billingCity: 'Sevilla',
      billingPostalCode: '41001',
      country: 'España',
      orders: [
        { id: '2024010', date: '2024-02-10', service: 'Stage 1', status: 'Completado', total: 450 },
        { id: '2024011', date: '2024-03-15', service: 'EGR Delete', status: 'En proceso', total: 750 }
      ]
    }
  };

  const client = clientsData[clientId || ''];

  if (!client) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-white mb-4">Cliente no encontrado</h1>
            <button
              onClick={() => navigate('/admin')}
              className="bg-primary hover:bg-primary/80 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300"
            >
              Volver al Panel de Admin
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completado':
        return 'bg-green-500/20 text-green-400';
      case 'En proceso':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'Pendiente':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center text-gray-300 hover:text-white transition-colors mr-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Volver al Panel
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Detalles del Cliente</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Información Personal */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <User className="w-5 h-5 text-primary mr-2" />
                <h2 className="text-xl font-bold text-white">Información Personal</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Nombre</label>
                  <p className="text-white font-medium">{client.name}</p>
                </div>
                
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Email</label>
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 text-gray-400 mr-2" />
                    <p className="text-white">{client.email}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Teléfono</label>
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 text-gray-400 mr-2" />
                    <p className="text-white">{client.phone}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Dirección</label>
                  <div className="flex items-start">
                    <MapPin className="w-4 h-4 text-gray-400 mr-2 mt-1" />
                    <div>
                      <p className="text-white">{client.address}</p>
                      <p className="text-white">{client.city}, {client.postalCode}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Información de Facturación */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 mt-6">
              <div className="flex items-center mb-4">
                <Building className="w-5 h-5 text-primary mr-2" />
                <h2 className="text-xl font-bold text-white">Información de Facturación</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Nombre de la Empresa</label>
                  <p className="text-white font-medium">{client.companyName}</p>
                </div>
                
                <div>
                  <label className="block text-gray-400 text-sm mb-1">NIF/CIF</label>
                  <p className="text-white">{client.nifCif}</p>
                </div>
                
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Dirección de Facturación</label>
                  <div>
                    <p className="text-white">{client.billingAddress}</p>
                    <p className="text-white">{client.billingCity}, {client.billingPostalCode}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-400 text-sm mb-1">País</label>
                  <p className="text-white">{client.country}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Pedidos Realizados */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <ShoppingCart className="w-5 h-5 text-primary mr-2" />
                  <h2 className="text-xl font-bold text-white">Pedidos Realizados</h2>
                </div>
                <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-medium">
                  {client.orders.length} pedidos
                </span>
              </div>

              {client.orders.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">No hay pedidos realizados</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {client.orders.map((order) => (
                    <div
                      key={order.id}
                      onClick={() => navigate(`/admin/order-details/${order.id}`)}
                      className="bg-gray-900/50 border border-gray-600 rounded-lg p-4 hover:border-primary/50 hover:bg-gray-900/70 transition-all duration-300 cursor-pointer group"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <h3 className="text-lg font-semibold text-white group-hover:text-primary transition-colors">
                              Pedido #{order.id}
                            </h3>
                            <span className={`ml-3 px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                            <div className="flex items-center text-gray-300">
                              <Calendar className="w-4 h-4 mr-2" />
                              {new Date(order.date).toLocaleDateString('es-ES')}
                            </div>
                            <div className="flex items-center text-gray-300">
                              <FileText className="w-4 h-4 mr-2" />
                              {order.service}
                            </div>
                            <div className="flex items-center text-gray-300">
                              <Euro className="w-4 h-4 mr-2" />
                              {order.total}€
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-3 sm:mt-0 sm:ml-4">
                          <div className="text-primary text-sm font-medium group-hover:text-primary/80">
                            Ver detalles →
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDetails;