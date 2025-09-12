import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Upload, Info, User, CreditCard } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { handleNewOrder, OrderData } from '../services/emailService';

interface ServiceConfigurationData {
  // Vehicle Information
  make: string;
  model: string;
  generation: string;
  engine: string;
  ecu: string;
  year: string;
  gearbox: string;
  
  // Additional Information
  engineHp: string;
  engineKw: string;
  vin: string;
  readMethod: string;
  hardwareNumber: string;
  softwareNumber: string;

  

  
  // Files
  mainFile: File[];
  hasOptionalAttachments: boolean;
  optionalAttachments: File[];
  
  // Modified Parts
  hasModifiedParts: boolean;
  aftermarketExhaust: boolean;
  aftermarketExhaustRemarks: string;
  aftermarketIntakeManifold: boolean;
  aftermarketIntakeManifoldRemarks: string;
  coldAirIntake: boolean;
  coldAirIntakeRemarks: string;
  decat: boolean;
  decatRemarks: string;
  
  // Extra Information
  additionalInfo: string;
  
  // Terms
  agreeAllTerms: boolean;
  
  // Additional Services
  selectedAdditionalServices: string[];
}

const ServiceConfiguration: React.FC = () => {
  const navigate = useNavigate();
  const { serviceId } = useParams<{ serviceId?: string }>();
  const { user, profile, loading: authLoading } = useAuth();
  const { t } = useTranslation('service-configuration');
  

  
  // State for service and client data
  const [selectedService, setSelectedService] = useState<any>(null);
  const [additionalServices, setAdditionalServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load service data and client profile
  useEffect(() => {
    const loadData = async () => {
      if (!serviceId) {
        setError(t('errors.noServiceSpecified'));
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Load selected service
        const { data: serviceData, error: serviceError } = await supabase
          .from('services')
          .select('*')
          .eq('id', serviceId)
          .eq('status', 'Activo')
          .single();

        if (serviceError) {
          throw new Error(t('errors.serviceNotFound'));
        }

        setSelectedService(serviceData);
        
        // Load additional services
        const { data: additionalServicesData, error: additionalServicesError } = await supabase
          .from('services')
          .select('*')
          .eq('status', 'Activo')
          .eq('is_additional', true);

        if (additionalServicesError) {
          console.error('Error loading additional services:', additionalServicesError);
        } else {
          setAdditionalServices(additionalServicesData || []);
        }
      } catch (err: any) {
        console.error('Error loading service data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      loadData();
    }
  }, [serviceId, authLoading]);
  const [formData, setFormData] = useState<ServiceConfigurationData>({
    make: '',
    model: '',
    generation: '',
    engine: '',
    ecu: '',
    year: '',
    gearbox: '',
    engineHp: '',
    engineKw: '',
    vin: '',
    readMethod: '',
    hardwareNumber: '',
    softwareNumber: '',


    mainFile: [],
    hasOptionalAttachments: false,
    optionalAttachments: [],
    hasModifiedParts: false,
    aftermarketExhaust: false,
    aftermarketExhaustRemarks: '',
    aftermarketIntakeManifold: false,
    aftermarketIntakeManifoldRemarks: '',
    coldAirIntake: false,
    coldAirIntakeRemarks: '',
    decat: false,
    decatRemarks: '',

    additionalInfo: '',
    agreeAllTerms: false,
    selectedAdditionalServices: []
  });

  const [dragActive, setDragActive] = useState(false);
  const [dragActiveOptional, setDragActiveOptional] = useState(false);
  
  // Estados para información personal y facturación
  const [personalInfo, setPersonalInfo] = useState({
    full_name: '',
    phone: '',
    email: ''
  });
  

  
  const [billingInfo, setBillingInfo] = useState({
    billing_name: '',
    billing_address: '',
    billing_city: '',
    billing_country: '',
    billing_postal_code: '',
    billing_state: '',
    tax_id: ''
  });

  // Cargar datos completos del perfil desde la base de datos
  useEffect(() => {
    const loadFullProfile = async () => {
      if (user?.id) {

        try {
          const { data: fullProfile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (error) {
            console.error('❌ Error loading profile:', error);
            // Si no existe el perfil, usar datos básicos del usuario
            const basicInfo = {
              full_name: '',
              phone: '',
              email: user.email || ''
            };

            setPersonalInfo(basicInfo);
          } else {

            // Cargar datos completos del perfil
            const personalData = {
              full_name: fullProfile.full_name || '',
              phone: fullProfile.phone || '',
              email: fullProfile.email || user.email || ''
            };
            
            const billingData = {
              billing_name: fullProfile.billing_name || '',
              billing_address: fullProfile.billing_address || '',
              billing_city: fullProfile.billing_city || '',
              billing_country: fullProfile.billing_country || '',
              billing_postal_code: fullProfile.billing_postal_code || '',
              billing_state: fullProfile.billing_state || '',
              tax_id: fullProfile.tax_id || ''
            };
            

            
            setPersonalInfo(personalData);
            setBillingInfo(billingData);
          }
        } catch (err) {
          console.error('💥 Error loading full profile:', err);
          // Fallback a datos básicos
          setPersonalInfo({
            full_name: '',
            phone: '',
            email: user.email || ''
          });
        }
      } else {

      }
    };

    if (!authLoading && user) {
      loadFullProfile();
    }
  }, [user, authLoading]);

  // Handle navigation when user is not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      const timer = setTimeout(() => {
        navigate('/login');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [user, authLoading, navigate]);

  const handleInputChange = (field: keyof ServiceConfigurationData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handlePersonalInfoChange = (field: string, value: string) => {
    setPersonalInfo(prev => ({ ...prev, [field]: value }));
  };
  

  
  const handleBillingInfoChange = (field: string, value: string) => {
    setBillingInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (files: FileList | null, isOptional = false) => {
    if (!files) return;
    
    if (isOptional) {
      const newFiles = Array.from(files).filter(file => file.size <= 20 * 1024 * 1024); // 20MB limit
      setFormData(prev => ({ 
        ...prev, 
        optionalAttachments: [...prev.optionalAttachments, ...newFiles] 
      }));
    } else {
      const newFiles = Array.from(files).filter(file => file.size <= 20 * 1024 * 1024); // 20MB limit
      setFormData(prev => ({ 
        ...prev, 
        mainFile: [...prev.mainFile, ...newFiles] 
      }));
    }
  };

  const handleDrag = (e: React.DragEvent, isOptional = false) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      if (isOptional) {
        setDragActiveOptional(true);
      } else {
        setDragActive(true);
      }
    } else if (e.type === 'dragleave') {
      if (isOptional) {
        setDragActiveOptional(false);
      } else {
        setDragActive(false);
      }
    }
  };

  const handleDrop = (e: React.DragEvent, isOptional = false) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOptional) {
      setDragActiveOptional(false);
    } else {
      setDragActive(false);
    }
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files, isOptional);
    }
  };



  // Función para calcular el total
  const calculateTotal = () => {
    let total = 0;
    
    // Precio del servicio principal
    if (selectedService?.price) {
      const mainPrice = typeof selectedService.price === 'string' 
        ? parseFloat(selectedService.price.replace(/[^\d.-]/g, '')) || 0
        : selectedService.price;
      total += mainPrice;
    }
    
    // Precios de servicios adicionales
    const additionalServicesTotal = additionalServices
      .filter(service => formData.selectedAdditionalServices.includes(service.id))
      .reduce((sum, service) => {
        const price = typeof service.price === 'string' 
          ? parseFloat(service.price.replace(/[^\d.-]/g, '')) || 0
          : service.price || 0;
        return sum + price;
      }, 0);
    
    total += additionalServicesTotal;
    return total;
  };

  const validateForm = () => {
    const errors: string[] = [];
    
    // Validar archivo principal
    if (!formData.mainFile || formData.mainFile.length === 0) {
      errors.push(t('errors.mainFileRequired'));
    }
    
    // Validar información del vehículo
    const requiredVehicleFields = ['make', 'model', 'generation', 'engine', 'ecu', 'year', 'gearbox'];
    requiredVehicleFields.forEach(field => {
      if (!formData[field as keyof ServiceConfigurationData]) {
        errors.push(`El campo ${field} es requerido`);
      }
    });
    
    // Validar información personal
    if (!personalInfo.full_name.trim()) {
      errors.push(t('errors.fullNameRequired'));
    }
    if (!personalInfo.phone.trim()) {
      errors.push(t('errors.phoneRequired'));
    }
    
    // Los campos de facturación son opcionales - no se validan como requeridos
    
    // Validar términos y condiciones
    if (!formData.agreeAllTerms) {
      errors.push(t('errors.termsRequired'));
    }
    
    return errors;
  };

  // Función para sanitizar nombres de archivos
  const sanitizeFileName = (fileName: string): string => {
    return fileName
      .normalize('NFD') // Descomponer caracteres acentuados
      .replace(/[\u0300-\u036f]/g, '') // Eliminar diacríticos (acentos)
      .replace(/[^a-zA-Z0-9.-]/g, '-') // Reemplazar caracteres especiales con guiones
      .replace(/-+/g, '-') // Reemplazar múltiples guiones con uno solo
      .replace(/^-|-$/g, ''); // Eliminar guiones al inicio y final
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    // Validar formulario
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      toast.error(`${t('errors.formErrors')}:\n${validationErrors.join('\n')}`);
      return;
    }
    
    if (!selectedService) {
      toast.error(t('errors.noServiceSelected'));
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // 1. Actualizar información del perfil del usuario
      const profileUpdateData = {
        full_name: personalInfo.full_name,
        phone: personalInfo.phone,
        billing_name: billingInfo.billing_name,
        tax_id: billingInfo.tax_id,
        billing_address: billingInfo.billing_address,
        billing_city: billingInfo.billing_city,
        billing_state: billingInfo.billing_state,
        billing_postal_code: billingInfo.billing_postal_code,
        billing_country: billingInfo.billing_country,
        updated_at: new Date().toISOString()
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdateData)
        .eq('id', user.id);

      if (profileError) {
        throw new Error(`Error al actualizar perfil: ${profileError.message}`);
      }

      // 2. Las carpetas se crearán automáticamente al subir los archivos reales
      // No es necesario crear archivos temporales que causan errores 400
      
      // 3. Subir archivos a Supabase Storage
      const mainFileUrls = [];
      const optionalFileUrls = [];

      // Subir archivos principales
      if (formData.mainFile && formData.mainFile.length > 0) {
        for (let i = 0; i < formData.mainFile.length; i++) {
          const file = formData.mainFile[i];
          const fileExtension = file.name.split('.').pop();
          const originalName = file.name.replace(`.${fileExtension}`, '');
          const sanitizedName = sanitizeFileName(originalName);
          const mainFileName = `${sanitizedName}.${fileExtension}`;
          const mainFilePath = `clientordersprincipal/${user.id}/${Date.now()}-${i}/${mainFileName}`;
          const { error: mainFileError } = await supabase.storage
            .from('order-files')
            .upload(mainFilePath, file);
          
          if (mainFileError) {
            throw new Error(`Error al subir archivo principal ${i + 1}: ${mainFileError.message}`);
          }
          
          mainFileUrls.push(mainFilePath);
        }
      }

      // Subir archivos opcionales
      if (formData.hasOptionalAttachments && formData.optionalAttachments.length > 0) {
        for (let i = 0; i < formData.optionalAttachments.length; i++) {
          const file = formData.optionalAttachments[i];
          const fileExtension = file.name.split('.').pop();
          const originalName = file.name.replace(`.${fileExtension}`, '');
          const sanitizedName = sanitizeFileName(originalName);
          const optionalFileName = `${sanitizedName}.${fileExtension}`;
          const optionalFilePath = `clientorderadicional/${user.id}/${Date.now()}-${i}/${optionalFileName}`;
          
          const { error: optionalFileError } = await supabase.storage
            .from('order-files')
            .upload(optionalFilePath, file);
          
          if (optionalFileError) {
            throw new Error(`Error al subir archivo opcional ${i + 1}: ${optionalFileError.message}`);
          }
          
          optionalFileUrls.push(optionalFilePath);
        }
      }

      // 4. Calcular precios de servicios adicionales
      const additionalServicesPrice = additionalServices
        .filter(service => formData.selectedAdditionalServices.includes(service.id))
        .reduce((sum, service) => {
          const price = typeof service.price === 'string' 
            ? parseFloat(service.price.replace(/[^\d.-]/g, '')) || 0
            : service.price || 0;
          return sum + price;
        }, 0);

      // 5. Crear el pedido
      const orderData = {
        client_id: user.id,
        service_id: selectedService.id,
        
        // Vehicle Information
        vehicle_make: formData.make,
        vehicle_model: formData.model,
        vehicle_generation: formData.generation,
        vehicle_engine: formData.engine,
        vehicle_ecu: formData.ecu,
        vehicle_year: formData.year?.substring(0, 4) || '',
        vehicle_gearbox: formData.gearbox,
        
        // Additional Vehicle Information
        engine_hp: formData.engineHp?.substring(0, 50) || '',
        engine_kw: formData.engineKw?.substring(0, 50) || '',
        vin: formData.vin,
        read_method: formData.readMethod,
        hardware_number: formData.hardwareNumber,
        software_number: formData.softwareNumber,
        
        // Modified Parts
        has_modified_parts: formData.hasModifiedParts,
        aftermarket_exhaust: formData.aftermarketExhaust,
        aftermarket_exhaust_remarks: formData.aftermarketExhaustRemarks,
        aftermarket_intake_manifold: formData.aftermarketIntakeManifold,
        aftermarket_intake_manifold_remarks: formData.aftermarketIntakeManifoldRemarks,
        cold_air_intake: formData.coldAirIntake,
        cold_air_intake_remarks: formData.coldAirIntakeRemarks,
        decat: formData.decat,
        decat_remarks: formData.decatRemarks,
        
        // Additional Information
        additional_info: formData.additionalInfo,
        
        // Additional Services
        additional_services: formData.selectedAdditionalServices,
        
        // File URLs
        main_file_url: mainFileUrls.length > 0 ? JSON.stringify(mainFileUrls) : null,
        optional_attachments_urls: optionalFileUrls,
        
        // Pricing
        base_price: selectedService.price,
        additional_services_price: additionalServicesPrice,
        total_price: calculateTotal(),
        
        // Status
        status: 'pending'
      };

      const { data: insertedOrder, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) {
        throw new Error(`${t('errors.orderCreationError')}: ${orderError.message}`);
      }

      // Enviar emails de notificación
      try {
        const emailOrderData: OrderData = {
          id: insertedOrder.id,
          client_name: personalInfo.full_name || personalInfo.email.split('@')[0],
          client_email: personalInfo.email,
          service_name: selectedService.title,
          status: 'pending',
          created_at: insertedOrder.created_at,
          total_price: calculateTotal()
        };

        const emailResults = await handleNewOrder(emailOrderData);
        
        // Log results but don't fail the order if emails fail
        if (emailResults.adminEmail.status === 'rejected') {
          console.warn('Failed to send admin notification email:', emailResults.adminEmail.reason);
        }
        if (emailResults.clientEmail.status === 'rejected') {
          console.warn('Failed to send client confirmation email:', emailResults.clientEmail.reason);
        }
      } catch (emailError) {
        console.error('Error sending notification emails:', emailError);
        // Don't fail the order creation if emails fail
      }

      toast.success(t('messages.orderSuccess'));
      
      // Navegar al dashboard del cliente
      navigate('/client-dashboard');
      
    } catch (error) {
      console.error('Error al procesar el pedido:', error);
      toast.error(error instanceof Error ? error.message : t('errors.orderProcessingError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Authentication protection
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('messages.verifyingSession')}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('messages.redirectingToLogin')}</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('messages.loadingService')}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">{t('errors.error')}</div>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            {t('navigation.back')}
          </button>
        </div>
      </div>
    );
  }

  if (!selectedService) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 text-xl mb-4">{t('errors.serviceNotFound')}</div>
          <button
            onClick={() => navigate('/services')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            {t('navigation.viewAllServices')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            {t('navigation.back')}
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{t('headers.serviceConfiguration')}</h1>
          <p className="text-gray-600 mt-2">{t('headers.completeInformation')}</p>
        </div>

        {/* Información del Servicio Seleccionado */}
        {selectedService ? (
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedService.title}</h2>
              {selectedService.subtitle && (
                <p className="text-gray-600">{selectedService.subtitle}</p>
              )}
            </div>
          </div>
        ) : serviceId ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <Info className="w-5 h-5 text-yellow-600 mr-2" />
              <p className="text-yellow-800">{t('errors.selectedServiceNotFound')}</p>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center">
              <Info className="w-5 h-5 text-gray-600 mr-2" />
              <p className="text-gray-700">{t('messages.noSpecificServiceSelected')}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* File Upload */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('headers.fileToModify')}</h2>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
              }`}
              onDragEnter={(e) => handleDrag(e)}
              onDragLeave={(e) => handleDrag(e)}
              onDragOver={(e) => handleDrag(e)}
              onDrop={(e) => handleDrop(e)}
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">
                {t('fileUpload.dragFileHere')}{' '}
                <label className="text-blue-600 hover:text-blue-800 cursor-pointer underline">
                  {t('fileUpload.browseFiles')}
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileUpload(e.target.files)}
                  />
                </label>
              </p>
              {formData.mainFile.length > 0 ? (
                <div className="text-left">
                  {formData.mainFile.map((file, index) => (
                    <p key={index} className="text-green-600 font-medium">
                      {file.name}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">{t('fileUpload.noFileSelected')}</p>
              )}
            </div>

            <div className="mt-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.hasOptionalAttachments}
                  onChange={(e) => handleInputChange('hasOptionalAttachments', e.target.checked)}
                  className="mr-3 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">{t('fileUpload.hasOptionalAttachments')}</span>
              </label>
            </div>

            {formData.hasOptionalAttachments && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('fileUpload.optionalAttachmentsLabel')}
                </label>
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    dragActiveOptional ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                  }`}
                  onDragEnter={(e) => handleDrag(e, true)}
                  onDragLeave={(e) => handleDrag(e, true)}
                  onDragOver={(e) => handleDrag(e, true)}
                  onDrop={(e) => handleDrop(e, true)}
                >
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 text-sm mb-2">
                    {t('fileUpload.dragOptionalFiles')}{' '}
                    <label className="text-blue-600 hover:text-blue-800 cursor-pointer underline">
                      {t('fileUpload.browseFiles')}
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => handleFileUpload(e.target.files, true)}
                      />
                    </label>
                  </p>
                  {formData.optionalAttachments.length > 0 ? (
                    <div className="text-left">
                      {formData.optionalAttachments.map((file, index) => (
                        <p key={index} className="text-green-600 text-sm">
                          {file.name}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">{t('fileUpload.noOptionalFiles')}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Vehicle Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('headers.vehicleInfo')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('labels.make')}</label>
                <input
                  type="text"
                  value={formData.make}
                  onChange={(e) => handleInputChange('make', e.target.value)}
                  className="w-full px-3 py-2 bg-white text-black placeholder-gray-400 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('placeholders.enterMake')}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('labels.model')}</label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => handleInputChange('model', e.target.value)}
                  className="w-full px-3 py-2 bg-white text-black placeholder-gray-400 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('placeholders.enterModel')}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('labels.generation')}</label>
                <input
                  type="text"
                  value={formData.generation}
                  onChange={(e) => handleInputChange('generation', e.target.value)}
                  className="w-full px-3 py-2 bg-white text-black placeholder-gray-400 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('placeholders.enterGeneration')}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('labels.engine')}</label>
                <input
                  type="text"
                  value={formData.engine}
                  onChange={(e) => handleInputChange('engine', e.target.value)}
                  className="w-full px-3 py-2 bg-white text-black placeholder-gray-400 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('placeholders.enterEngine')}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('labels.ecu')}</label>
                <input
                  type="text"
                  value={formData.ecu}
                  onChange={(e) => handleInputChange('ecu', e.target.value)}
                  className="w-full px-3 py-2 bg-white text-black placeholder-gray-400 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('placeholders.enterEcu')}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('labels.year')}</label>
                <input
                  type="text"
                  value={formData.year}
                  onChange={(e) => handleInputChange('year', e.target.value)}
                  className="w-full px-3 py-2 bg-white text-black placeholder-gray-400 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('placeholders.enterYear')}
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('labels.gearbox')}</label>
                <input
                  type="text"
                  value={formData.gearbox}
                  onChange={(e) => handleInputChange('gearbox', e.target.value)}
                  className="w-full px-3 py-2 bg-white text-black placeholder-gray-400 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('placeholders.enterGearbox')}
                  required
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('headers.additionalInfo')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('labels.engineHp')}</label>
                <input
                  type="number"
                  value={formData.engineHp}
                  onChange={(e) => handleInputChange('engineHp', e.target.value)}
                  className="w-full px-3 py-2 bg-white text-black placeholder-gray-400 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('placeholders.engineHpExample')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('labels.engineKw')}</label>
                <input
                  type="number"
                  value={formData.engineKw}
                  onChange={(e) => handleInputChange('engineKw', e.target.value)}
                  className="w-full px-3 py-2 bg-white text-black placeholder-gray-400 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('placeholders.engineKwExample')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('labels.vin')}</label>
                <input
                  type="text"
                  value={formData.vin}
                  onChange={(e) => handleInputChange('vin', e.target.value)}
                  className="w-full px-3 py-2 bg-white text-black placeholder-gray-400 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('placeholders.vinExample')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('labels.readMethod')}</label>
                <input
                  type="text"
                  value={formData.readMethod}
                  onChange={(e) => handleInputChange('readMethod', e.target.value)}
                  className="w-full px-3 py-2 bg-white text-black placeholder-gray-400 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('placeholders.readMethodExample')}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('labels.hardwareNumber')}</label>
                <input
                  type="text"
                  value={formData.hardwareNumber}
                  onChange={(e) => handleInputChange('hardwareNumber', e.target.value)}
                  className="w-full px-3 py-2 bg-white text-black placeholder-gray-400 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('labels.softwareNumber')}</label>
                <input
                  type="text"
                  value={formData.softwareNumber}
                  onChange={(e) => handleInputChange('softwareNumber', e.target.value)}
                  className="w-full px-3 py-2 bg-white text-black placeholder-gray-400 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>


            </div>
          </div>



          {/* Modified Parts */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('headers.modifiedParts')}</h2>
            <div className="mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.hasModifiedParts}
                  onChange={(e) => handleInputChange('hasModifiedParts', e.target.checked)}
                  className="mr-3 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">{t('modifiedParts.hasModifiedParts')}</span>
              </label>
            </div>

            {formData.hasModifiedParts && (
              <div className="space-y-6">
                <p className="text-gray-600 text-sm mb-4">
                  {t('modifiedParts.detailsRequest')}
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        checked={formData.aftermarketExhaust}
                        onChange={(e) => handleInputChange('aftermarketExhaust', e.target.checked)}
                        className="mr-3 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-gray-700 font-medium">{t('modifiedParts.aftermarketExhaust')}</span>
                    </label>
                    {formData.aftermarketExhaust && (
                      <textarea
                        value={formData.aftermarketExhaustRemarks}
                        onChange={(e) => handleInputChange('aftermarketExhaustRemarks', e.target.value)}
                        placeholder={t('placeholders.optionalRemarks')}
                        className="w-full px-3 py-2 bg-white text-black placeholder-gray-400 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={2}
                      />
                    )}
                  </div>

                  <div>
                    <label className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        checked={formData.aftermarketIntakeManifold}
                        onChange={(e) => handleInputChange('aftermarketIntakeManifold', e.target.checked)}
                        className="mr-3 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-gray-700 font-medium">{t('modifiedParts.aftermarketIntakeManifold')}</span>
                    </label>
                    {formData.aftermarketIntakeManifold && (
                      <textarea
                        value={formData.aftermarketIntakeManifoldRemarks}
                        onChange={(e) => handleInputChange('aftermarketIntakeManifoldRemarks', e.target.value)}
                        placeholder="Observaciones (opcional)"
                        className="w-full px-3 py-2 bg-white text-black placeholder-gray-400 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={2}
                      />
                    )}
                  </div>

                  <div>
                    <label className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        checked={formData.coldAirIntake}
                        onChange={(e) => handleInputChange('coldAirIntake', e.target.checked)}
                        className="mr-3 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-gray-700 font-medium">{t('modifiedParts.coldAirIntake')}</span>
                    </label>
                    {formData.coldAirIntake && (
                      <textarea
                        value={formData.coldAirIntakeRemarks}
                        onChange={(e) => handleInputChange('coldAirIntakeRemarks', e.target.value)}
                        placeholder="Observaciones (opcional)"
                        className="w-full px-3 py-2 bg-white text-black placeholder-gray-400 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={2}
                      />
                    )}
                  </div>

                  <div>
                    <label className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        checked={formData.decat}
                        onChange={(e) => handleInputChange('decat', e.target.checked)}
                        className="mr-3 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-gray-700 font-medium">{t('modifiedParts.decat')}</span>
                    </label>
                    {formData.decat && (
                      <textarea
                        value={formData.decatRemarks}
                        onChange={(e) => handleInputChange('decatRemarks', e.target.value)}
                        placeholder="Observaciones (opcional)"
                        className="w-full px-3 py-2 bg-white text-black placeholder-gray-400 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={2}
                      />
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Additional Services */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('headers.additionalServices')}</h2>
            {loading ? (
              <div className="text-center py-4">
                <p className="text-gray-500">{t('messages.loadingAdditionalServices')}</p>
              </div>
            ) : error ? (
              <div className="text-center py-4">
                <p className="text-red-500">{t('errors.loadingAdditionalServices')}: {error}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {additionalServices
                  .filter(service => service.id !== selectedService?.id)
                  .map(service => (
                    <label key={service.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.selectedAdditionalServices.includes(service.id)}
                          onChange={(e) => {
                            const serviceId = service.id;
                            if (e.target.checked) {
                              handleInputChange('selectedAdditionalServices', [...formData.selectedAdditionalServices, serviceId]);
                            } else {
                              handleInputChange('selectedAdditionalServices', formData.selectedAdditionalServices.filter(id => id !== serviceId));
                            }
                          }}
                          className="mr-3 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-gray-900 font-medium">{service.title}</span>
                      </div>
                      <span className="text-blue-600 font-semibold">
                        {service.price ? `€${service.price}` : t('pricing.priceOnRequest')}
                      </span>
                    </label>
                  ))
                }
                {additionalServices.filter(service => service.id !== selectedService?.id).length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">{t('messages.noAdditionalServices')}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Extra Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('headers.extraInfo')}</h2>
            <div className="space-y-6">


              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('labels.additionalCarInfo')}
                </label>
                <textarea
                  value={formData.additionalInfo}
                  onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
                  placeholder={t('placeholders.additionalInfoPlaceholder')}
                  className="w-full px-3 py-2 bg-white text-black placeholder-gray-400 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                />
              </div>
            </div>
          </div>

          {/* Información Personal */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-6">
              <User className="w-6 h-6 text-blue-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">{t('headers.personalInfo')}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('labels.fullName')} *</label>
                <input
                  type="text"
                  value={personalInfo.full_name}
                  onChange={(e) => handlePersonalInfoChange('full_name', e.target.value)}
                  className="w-full px-3 py-2 bg-white text-black placeholder-gray-400 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('placeholders.enterFullName')}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('labels.phone')} *</label>
                <input
                  type="tel"
                  value={personalInfo.phone}
                  onChange={(e) => handlePersonalInfoChange('phone', e.target.value)}
                  className="w-full px-3 py-2 bg-white text-black placeholder-gray-400 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('placeholders.phoneExample')}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">{t('messages.includeCountryPrefix')}</p>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('labels.email')} *</label>
                <input
                  type="email"
                  value={personalInfo.email}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed focus:outline-none"
                  placeholder={t('placeholders.registrationEmail')}
                />
                <p className="text-xs text-gray-500 mt-1">{t('messages.registrationEmailNotEditable')}</p>
              </div>
            </div>
          </div>

          {/* Información de Facturación */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-6">
              <CreditCard className="w-6 h-6 text-blue-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">{t('headers.billingInfo')}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('labels.billingName')} *</label>
                <input
                  type="text"
                  value={billingInfo.billing_name}
                  onChange={(e) => handleBillingInfoChange('billing_name', e.target.value)}
                  className="w-full px-3 py-2 bg-white text-black placeholder-gray-400 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('placeholders.billingNamePlaceholder')}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('labels.taxId')}</label>
                <input
                  type="text"
                  value={billingInfo.tax_id}
                  onChange={(e) => handleBillingInfoChange('tax_id', e.target.value)}
                  className="w-full px-3 py-2 bg-white text-black placeholder-gray-400 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('placeholders.taxIdPlaceholder')}
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('labels.address')} *</label>
                <input
                  type="text"
                  value={billingInfo.billing_address}
                  onChange={(e) => handleBillingInfoChange('billing_address', e.target.value)}
                  className="w-full px-3 py-2 bg-white text-black placeholder-gray-400 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('placeholders.fullAddress')}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('labels.city')} *</label>
                <input
                  type="text"
                  value={billingInfo.billing_city}
                  onChange={(e) => handleBillingInfoChange('billing_city', e.target.value)}
                  className="w-full px-3 py-2 bg-white text-black placeholder-gray-400 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('placeholders.city')}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('labels.state')}</label>
                <input
                  type="text"
                  value={billingInfo.billing_state}
                  onChange={(e) => handleBillingInfoChange('billing_state', e.target.value)}
                  className="w-full px-3 py-2 bg-white text-black placeholder-gray-400 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('placeholders.stateProvince')}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('labels.postalCode')} *</label>
                <input
                  type="text"
                  value={billingInfo.billing_postal_code}
                  onChange={(e) => handleBillingInfoChange('billing_postal_code', e.target.value)}
                  className="w-full px-3 py-2 bg-white text-black placeholder-gray-400 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('placeholders.postalCode')}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('labels.country')} *</label>
                <input
                  type="text"
                  value={billingInfo.billing_country}
                  onChange={(e) => handleBillingInfoChange('billing_country', e.target.value)}
                  className="w-full px-3 py-2 bg-white text-black placeholder-gray-400 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('placeholders.country')}
                  required
                />
              </div>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('headers.termsAndConditions')}</h2>
            <div className="space-y-4">
              <label className="flex items-start">
                <input
                  type="checkbox"
                  checked={formData.agreeAllTerms}
                  onChange={(e) => handleInputChange('agreeAllTerms', e.target.checked)}
                  className="mr-3 mt-1 text-blue-600 focus:ring-blue-500"
                  required
                />
                <span className="text-gray-700">
                  {t('terms.acceptTerms')}{' '}
                  <a href="/terms-of-service" className="text-blue-600 hover:text-blue-800 underline">
                    {t('terms.termsOfService')}
                  </a>
                  , {t('terms.the')}{' '}
                  <a href="/disclaimer" className="text-blue-600 hover:text-blue-800 underline">
                    {t('terms.disclaimer')}
                  </a>
                  {' '}{t('terms.and')}{' '}
                  <a href="/refund-policy" className="text-blue-600 hover:text-blue-800 underline">
                    {t('terms.refundPolicies')}
                  </a>
                  .
                </span>
              </label>
            </div>
          </div>

          {/* Resumen de Precios */}
          {selectedService && (
            <div className="bg-gray-50 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('headers.pricingSummary')}</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">{selectedService.title}:</span>
                  <span className="text-gray-900 font-medium">
                    €{typeof selectedService.price === 'string' 
                      ? parseFloat(selectedService.price.replace(/[^\d.-]/g, '')) || 0
                      : selectedService.price || 0}
                  </span>
                </div>
                
                {formData.selectedAdditionalServices.length > 0 && (
                  <>
                    <div className="border-t pt-4">
                      <h3 className="text-gray-700 font-medium mb-2">{t('headers.additionalServices')}:</h3>
                      {additionalServices
                        .filter(service => formData.selectedAdditionalServices.includes(service.id))
                        .map(service => (
                          <div key={service.id} className="flex justify-between items-center ml-4">
                            <span className="text-gray-600 text-sm">{service.title}</span>
                            <span className="text-gray-700">
                              €{typeof service.price === 'string' 
                                ? parseFloat(service.price.replace(/[^\d.-]/g, '')) || 0
                                : service.price || 0}
                            </span>
                          </div>
                        ))
                      }
                    </div>
                  </>
                )}
                
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">{t('pricing.total')}:</span>
                    <span className="text-2xl font-bold text-gray-900">€{calculateTotal()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {t('buttons.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isSubmitting
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isSubmitting ? t('buttons.processing') : t('buttons.createOrder')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServiceConfiguration;