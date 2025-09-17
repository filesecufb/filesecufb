import React from 'react';
import { X, FileText, User, Car, Wrench, Download, CreditCard, Printer } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { generatePDF } from '../../lib/pdfGenerator';

// Types
interface Order {
  id: string;
  created_at: string;
  status: string;
  total_price?: string;
  estimated_delivery?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_generation?: string;
  vehicle_engine?: string;
  vehicle_ecu?: string;
  vehicle_year?: string;
  vehicle_gearbox?: string;
  service_name?: string;
  service_type?: string;
  services?: { title: string };
  engine_hp?: string;
  engine_kw?: string;
  vin?: string;
  read_method?: string;
  hardware_number?: string;
  software_number?: string;
  has_modified_parts?: boolean;
  aftermarket_exhaust?: boolean;
  aftermarket_exhaust_remarks?: string;
  aftermarket_intake_manifold?: boolean;
  aftermarket_intake_manifold_remarks?: string;
  cold_air_intake?: boolean;
  cold_air_intake_remarks?: string;
  decat?: boolean;
  decat_remarks?: string;
  additional_services_details?: Array<{
    title: string;
    price: string;
    description?: string;
  }>;
  additional_info?: string;
  base_price?: string;
  additional_services_price?: number;
  main_file_url?: string;
  optional_attachments_urls?: string[];
}

interface Profile {
  full_name?: string;
  phone?: string;
  billing_address?: string;
}

interface User {
  email?: string;
}

interface OrderFile {
  id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  created_at: string;
}

interface AdminFile {
  id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  file_category: string;
  admin_comments?: string;
  created_at: string;
}

interface Invoice {
  id: string;
  file_name?: string;
  file_url?: string;
  admin_comments?: string;
  created_at: string;
}

interface OrderDetailModalProps {
  order: Order;
  profile?: Profile;
  user?: User;
  onClose: () => void;
  orderFiles: Record<string, OrderFile[]>;
  adminFiles: Record<string, AdminFile[]>;
  orderInvoices: Record<string, Invoice[]>;
  handleDownload: (url: string, filename: string) => void;
  downloadAdminFile: (file: AdminFile) => void;
  formatFileSize: (size: number) => string;
  getStatusText: (status: string) => string;
}

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  profile,
  user,
  onClose,
  orderFiles,
  adminFiles,
  orderInvoices,
  handleDownload,
  downloadAdminFile,
  formatFileSize,
  getStatusText
}) => {
  const { t } = useTranslation();

  // Usar la función unificada de generación de PDF
  const handleGenerateOrderPDF = async (order: Order) => {
    // Obtener archivos del cliente para este pedido
    const clientFilesForOrder = orderFiles[order.id] || [];
    await generatePDF(order, clientFilesForOrder);
  };

  // Validación para evitar errores cuando order es null
  if (!order) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 rounded-2xl border border-gray-700 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">{t('clientDashboard.modal.error')}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-gray-300">{t('clientDashboard.modal.orderNotFound')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header del Modal */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">{t('clientDashboard.modal.completeInfo')} - {t('clientDashboard.modal.orderNumber', { id: order.id })}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Contenido del Modal */}
        <div className="p-6 space-y-6">
          {/* Información Básica del Pedido */}
          <div className="bg-gray-800/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {t('clientDashboard.modal.orderInfo')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400 text-sm">{t('clientDashboard.modal.orderId')}</p>
                <p className="text-white font-medium">#{order.id}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">{t('clientDashboard.modal.orderDate')}</p>
                <p className="text-white font-medium">{new Date(order.created_at).toLocaleDateString('es-ES')}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">{t('clientDashboard.modal.status')}</p>
                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                  order.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                  order.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-orange-500/20 text-orange-400'
                }`}>
                  {getStatusText(order.status)}
                </span>
              </div>
              <div>
                <p className="text-gray-400 text-sm">{t('clientDashboard.modal.totalPrice')}</p>
                <p className="text-white font-bold text-lg">€{parseFloat(order.total_price || '0').toFixed(2)}</p>
              </div>
              {order.estimated_delivery && (
                <div className="md:col-span-2">
                  <p className="text-gray-400 text-sm">{t('clientDashboard.modal.estimatedDelivery')}</p>
                  <p className="text-white font-medium">{new Date(order.estimated_delivery).toLocaleDateString('es-ES')}</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Información del Cliente */}
          <div className="bg-gray-800/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              {t('clientDashboard.modal.clientInfo')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400 text-sm">{t('clientDashboard.modal.name')}</p>
                <p className="text-white font-medium">{profile?.full_name || user?.email || t('clientDashboard.profile.notSpecified')}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">{t('clientDashboard.modal.email')}</p>
                <p className="text-white font-medium">{user?.email || t('clientDashboard.profile.notSpecified')}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">{t('clientDashboard.modal.phone')}</p>
                <p className="text-white font-medium">{profile?.phone || t('clientDashboard.profile.notSpecified')}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">{t('clientDashboard.modal.address')}</p>
                <p className="text-white font-medium">{profile?.billing_address || t('clientDashboard.profile.notSpecified')}</p>
              </div>
            </div>
          </div>
          
          {/* Información del Vehículo */}
          <div className="bg-gray-800/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Car className="w-5 h-5" />
              {t('clientDashboard.modal.vehicleInfo')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <p className="text-gray-400 text-sm">{t('clientDashboard.modal.brand')}</p>
                <p className="text-white font-medium">{order.vehicle_make || t('clientDashboard.profile.notSpecified')}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">{t('clientDashboard.modal.model')}</p>
                <p className="text-white font-medium">{order.vehicle_model || t('clientDashboard.profile.notSpecified')}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">{t('clientDashboard.modal.generation')}</p>
                <p className="text-white font-medium">{order.vehicle_generation || t('clientDashboard.profile.notSpecified')}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">{t('clientDashboard.modal.engine')}</p>
                <p className="text-white font-medium">{order.vehicle_engine || t('clientDashboard.profile.notSpecified')}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">{t('clientDashboard.modal.ecu')}</p>
                <p className="text-white font-medium">{order.vehicle_ecu || t('clientDashboard.profile.notSpecified')}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">{t('clientDashboard.modal.year')}</p>
                <p className="text-white font-medium">{order.vehicle_year || t('clientDashboard.profile.notSpecified')}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">{t('clientDashboard.modal.gearbox')}</p>
                <p className="text-white font-medium">{order.vehicle_gearbox || t('clientDashboard.profile.notSpecified')}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">{t('clientDashboard.modal.service')}</p>
                <p className="text-white font-medium">{order.service_name || order.service_type || order.services?.title || t('clientDashboard.modal.service')}</p>
              </div>
            </div>
          </div>
          
          {/* Información Adicional del Vehículo */}
          <div className="bg-gray-800/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {t('clientDashboard.modal.additionalInfo')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(order.engine_hp || order.engine_kw) && (
                <div>
                  <p className="text-gray-400 text-sm">{t('clientDashboard.modal.enginePower')}</p>
                  <p className="text-white font-medium">
                    {order.engine_hp && `${order.engine_hp} HP`}
                    {order.engine_hp && order.engine_kw && ' / '}
                    {order.engine_kw && `${order.engine_kw} kW`}
                  </p>
                </div>
              )}
              {order.vin && (
                <div>
                  <p className="text-gray-400 text-sm">{t('clientDashboard.modal.vin')}</p>
                  <p className="text-white font-medium break-all">{order.vin}</p>
                </div>
              )}
              {order.read_method && (
                <div>
                  <p className="text-gray-400 text-sm">{t('clientDashboard.modal.readMethod')}</p>
                  <p className="text-white font-medium">{order.read_method}</p>
                </div>
              )}
              {order.hardware_number && (
                <div>
                  <p className="text-gray-400 text-sm">{t('clientDashboard.modal.hardwareNumber')}</p>
                  <p className="text-white font-medium">{order.hardware_number}</p>
                </div>
              )}
              {order.software_number && (
                <div>
                  <p className="text-gray-400 text-sm">{t('clientDashboard.modal.softwareNumber')}</p>
                  <p className="text-white font-medium">{order.software_number}</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Piezas Modificadas */}
          {order.has_modified_parts && (
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Wrench className="w-5 h-5" />
                {t('clientDashboard.modal.modifiedParts')}
              </h3>
              <div className="space-y-3">
                {order.aftermarket_exhaust && (
                  <div className="bg-gray-700/30 rounded-lg p-3">
                    <p className="text-white font-medium">{t('clientDashboard.modal.aftermarketExhaust')}</p>
                    {order.aftermarket_exhaust_remarks && (
                      <p className="text-gray-300 text-sm mt-1">{order.aftermarket_exhaust_remarks}</p>
                    )}
                  </div>
                )}
                {order.aftermarket_intake_manifold && (
                  <div className="bg-gray-700/30 rounded-lg p-3">
                    <p className="text-white font-medium">{t('clientDashboard.modal.aftermarketIntakeManifold')}</p>
                    {order.aftermarket_intake_manifold_remarks && (
                      <p className="text-gray-300 text-sm mt-1">{order.aftermarket_intake_manifold_remarks}</p>
                    )}
                  </div>
                )}
                {order.cold_air_intake && (
                  <div className="bg-gray-700/30 rounded-lg p-3">
                    <p className="text-white font-medium">{t('clientDashboard.modal.coldAirIntake')}</p>
                    {order.cold_air_intake_remarks && (
                      <p className="text-gray-300 text-sm mt-1">{order.cold_air_intake_remarks}</p>
                    )}
                  </div>
                )}
                {order.decat && (
                  <div className="bg-gray-700/30 rounded-lg p-3">
                    <p className="text-white font-medium">{t('clientDashboard.modal.decat')}</p>
                    {order.decat_remarks && (
                      <p className="text-gray-300 text-sm mt-1">{order.decat_remarks}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Servicios Adicionales */}
          {order.additional_services_details && order.additional_services_details.length > 0 && (
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Wrench className="w-5 h-5" />
                {t('clientDashboard.modal.additionalServices')}
              </h3>
              <div className="space-y-3">
                {order.additional_services_details.map((service, index) => (
                  <div key={index} className="bg-gray-700/30 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <p className="text-white font-medium">{service.title}</p>
                      <p className="text-green-400 font-semibold">€{service.price}</p>
                    </div>
                    {service.description && (
                      <p className="text-gray-400 text-sm mt-2">{service.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Información Adicional */}
          {order.additional_info && (
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {t('clientDashboard.modal.additionalInfo')}
              </h3>
              <div>
                <p className="text-gray-400 text-sm mb-2">{t('clientDashboard.modal.additionalComments')}</p>
                <p className="text-white whitespace-pre-wrap">{order.additional_info}</p>
              </div>
            </div>
          )}
          
          {/* Información de Precios */}
          <div className="bg-gray-800/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {t('clientDashboard.modal.priceInfo')}
            </h3>
            <div className="space-y-3">
              {order.base_price && (
                <div className="flex justify-between">
                  <p className="text-gray-400 text-sm">{t('clientDashboard.modal.basePrice')}</p>
                  <p className="text-white font-medium">€{order.base_price}</p>
                </div>
              )}
              {order.additional_services_price && order.additional_services_price > 0 && (
                <div className="flex justify-between">
                  <p className="text-gray-400 text-sm">{t('clientDashboard.modal.additionalServicesPrice')}</p>
                  <p className="text-white font-medium">€{order.additional_services_price}</p>
                </div>
              )}
              {order.total_price && (
                <div className="flex justify-between border-t border-gray-600 pt-3">
                  <p className="text-white font-semibold">{t('clientDashboard.modal.total')}</p>
                  <p className="text-white font-bold text-lg">€{order.total_price}</p>
                </div>
              )}
            </div>
          </div>
          
          
          
          {/* Archivos */}
          {((orderFiles[order.id] && orderFiles[order.id].length > 0) || 
            (adminFiles[order.id] && adminFiles[order.id].length > 0 && order.status === 'completed')) && (
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {t('clientDashboard.modal.orderFiles')}
              </h3>
              
              {/* Archivos del Cliente */}
              {orderFiles[order.id] && orderFiles[order.id].length > 0 && (
                <div className="mb-4">
                  <h4 className="text-md font-medium text-gray-300 mb-3">{t('clientDashboard.modal.originalFiles')}</h4>
                  <div className="space-y-2">
                    {orderFiles[order.id].map((file) => (
                      <div key={file.id} className="bg-gray-700/30 rounded-lg p-3 flex justify-between items-center">
                        <div>
                          <p className="text-white font-medium">{file.file_name}</p>
                          <p className="text-gray-400 text-sm">
                            {new Date(file.created_at).toLocaleDateString('es-ES')} • 
                            {formatFileSize(file.file_size)}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDownload(file.file_url, file.file_name)}
                          className="bg-primary hover:bg-primary/80 text-white px-3 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 text-sm"
                        >
                          <Download className="w-4 h-4" />
                          {t('clientDashboard.common.download')}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Archivos Tuneados del Admin */}
              {adminFiles[order.id] && adminFiles[order.id].length > 0 && order.status === 'completed' && (
                <div>
                  {/* Archivos Tuneados (mapas) */}
                  {adminFiles[order.id].filter(file => file.file_category === 'map').length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-md font-medium text-green-300 mb-3">{t('clientDashboard.modal.tunedFiles')}</h4>
                      <div className="space-y-2">
                        {adminFiles[order.id]
                          .filter(file => file.file_category === 'map')
                          .map((file) => (
                            <div key={file.id} className="bg-green-900/20 border border-green-500/30 rounded-lg p-3 flex justify-between items-center">
                              <div>
                                <p className="text-white font-medium">{file.file_name}</p>
                                <p className="text-gray-400 text-sm">
                                  {new Date(file.created_at).toLocaleDateString('es-ES')} • 
                                  {formatFileSize(file.file_size)}
                                </p>
                                {file.admin_comments && (
                                  <p className="text-green-200 text-sm mt-2 italic">{file.admin_comments}</p>
                                )}
                              </div>
                              <button
                                onClick={() => downloadAdminFile(file)}
                                className="bg-green-600 hover:bg-green-500 text-white px-3 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 text-sm"
                              >
                                <Download className="w-4 h-4" />
                                {t('clientDashboard.orders.modal.download')}
                              </button>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  )}
                  
                  {/* Facturas */}
                  {adminFiles[order.id].filter(file => file.file_category === 'invoice').length > 0 && (
                    <div>
                      <h4 className="text-md font-medium text-blue-300 mb-3">{t('clientDashboard.modal.invoices')}</h4>
                      <div className="space-y-2">
                        {adminFiles[order.id]
                          .filter(file => file.file_category === 'invoice')
                          .map((file) => (
                            <div key={file.id} className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 flex justify-between items-center">
                              <div>
                                <p className="text-white font-medium">{file.file_name}</p>
                                <p className="text-gray-400 text-sm">
                                  {new Date(file.created_at).toLocaleDateString('es-ES')} • 
                                  {formatFileSize(file.file_size)}
                                </p>
                                {file.admin_comments && (
                                  <p className="text-blue-200 text-sm mt-2 italic">{file.admin_comments}</p>
                                )}
                              </div>
                              <button
                                onClick={() => downloadAdminFile(file)}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 text-sm"
                              >
                                <Download className="w-4 h-4" />
                                {t('clientDashboard.orders.modal.download')}
                              </button>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Facturas */}
          {orderInvoices[order.id] && orderInvoices[order.id].length > 0 && (
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                {t('clientDashboard.modal.invoices')}
              </h3>
              <div className="space-y-2">
                {orderInvoices[order.id].map((invoice) => (
                  <div key={invoice.id} className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 flex justify-between items-center">
                    <div>
                      <p className="text-white font-medium">{invoice.file_name || `Factura ${invoice.id.slice(-8)}`}</p>
                      <p className="text-gray-400 text-sm">
                        {new Date(invoice.created_at).toLocaleDateString('es-ES')}
                      </p>
                      {invoice.admin_comments && (
                        <p className="text-blue-200 text-sm mt-2 italic">{invoice.admin_comments}</p>
                      )}
                    </div>
                    {invoice.file_url && (
                      <button
                          onClick={() => handleDownload(invoice.file_url!, invoice.file_name || `Factura_${invoice.id.slice(-8)}.pdf`)}
                          className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 text-sm"
                        >
                          <Download className="w-4 h-4" />
                          {t('clientDashboard.common.download')}
                        </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Información Extra */}
          {order.additional_info && (
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {t('clientDashboard.modal.extraInfo')}
              </h3>
              <div className="bg-gray-700/30 rounded-lg p-4">
                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{order.additional_info}</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer del Modal */}
        <div className="sticky bottom-0 bg-gray-900 border-t border-gray-700 p-6 flex justify-between items-center">
          <button
            onClick={() => handleGenerateOrderPDF(order)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2"
          >
            <Printer className="w-5 h-5" />
            {t('clientDashboard.common.printPDF')}
          </button>
          <button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300"
          >
            {t('clientDashboard.common.close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;