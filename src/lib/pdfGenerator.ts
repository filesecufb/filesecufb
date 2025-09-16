import jsPDF from 'jspdf';
import { toast } from 'react-hot-toast';

// Interfaces necesarias para el generador de PDF
interface OrderData {
  id: string;
  created_at: string;
  updated_at?: string;
  total_price?: number | string;
  base_price?: number | string;
  services?: {
    title: string;
  };
  profiles?: {
    full_name?: string;
    email?: string;
    phone?: string;
    billing_address?: string;
    billing_city?: string;
    billing_postal_code?: string;
    billing_country?: string;
  };
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_generation?: string;
  vehicle_engine?: string;
  vehicle_year?: string;
  vehicle_ecu?: string;
  vehicle_gearbox?: string;
  engine_hp?: string;
  engine_kw?: string;
  read_method?: string;
  hardware_number?: string;
  software_number?: string;
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
    price: string | number;
  }>;
  order_files?: Array<{
    id: string;
    file_name: string;
    file_url: string;
    created_at: string;
  }>;
  additional_info?: string;
}

// Función para formatear fecha
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Función principal para generar PDF
export const generatePDF = async (order: OrderData, clientFiles?: Array<{id: string; file_name: string; created_at: string; file_size?: number}>) => {
  if (!order) return;

  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    let yPosition = 25;

    // Colores corporativos
    const primaryColor = [59, 130, 246]; // Azul primario
    const darkColor = [31, 41, 55]; // Gris oscuro
    const lightColor = [107, 114, 128]; // Gris claro
    const accentColor = [16, 185, 129]; // Verde accent

    // Función para verificar si necesitamos una nueva página
    const checkNewPage = (requiredSpace: number) => {
      if (yPosition + requiredSpace > pageHeight - 30) {
        doc.addPage();
        yPosition = 30;
        return true;
      }
      return false;
    };

    // Función para agregar logo (simulado con texto estilizado)
    const addLogo = () => {
      // Logo simulado con texto estilizado
      doc.setFontSize(24);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.text('FILESECUFB', margin, yPosition);
      
      // Subtítulo del logo
      doc.setFontSize(10);
      doc.setTextColor(lightColor[0], lightColor[1], lightColor[2]);
      doc.setFont('helvetica', 'normal');
      doc.text('Professional ECU Services', margin, yPosition + 8);
      
      yPosition += 20;
    };

    // Función para agregar header con información de la empresa
    const addCompanyHeader = () => {
      // Línea decorativa superior
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setLineWidth(2);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;

      // Información de la empresa (lado derecho)
      const companyInfo = [
        'www.filesecufb.com',
        'info@filesecufb.com',
        '+34 630 84 10 47'
      ];
      
      doc.setFontSize(9);
      doc.setTextColor(lightColor[0], lightColor[1], lightColor[2]);
      companyInfo.forEach((info, index) => {
        doc.text(info, pageWidth - margin, yPosition + (index * 5), { align: 'right' });
      });
      
      yPosition += 25;
    };

    // Función para agregar título del documento
    const addDocumentTitle = () => {
      doc.setFontSize(28);
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.text('DETALLE DEL PEDIDO', pageWidth / 2, yPosition, { align: 'center' });
      
      // Línea decorativa bajo el título
      yPosition += 8;
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setLineWidth(1);
      doc.line(pageWidth / 2 - 40, yPosition, pageWidth / 2 + 40, yPosition);
      yPosition += 20;
    };

    // Función para agregar información básica del pedido
    const addOrderBasicInfo = () => {
      // Fondo gris claro para la información básica
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 25, 'F');
      
      doc.setFontSize(12);
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.setFont('helvetica', 'bold');
      
      // Primera fila
      doc.text(`Pedido #${order.id.slice(-8).toUpperCase()}`, margin + 5, yPosition + 5);
      doc.text(`Fecha: ${formatDate(order.created_at)}`, pageWidth / 2, yPosition + 5, { align: 'center' });
      doc.text(`Total: €${parseFloat(order.total_price?.toString() || '0').toFixed(2)}`, pageWidth - margin - 5, yPosition + 5, { align: 'right' });
      
      // Segunda fila
      doc.text(`Servicio: ${order.services?.title || 'N/A'}`, margin + 5, yPosition + 15);
      
      yPosition += 35;
    };

    // Función para agregar sección con título
    const addSection = (title: string, content: () => void) => {
      checkNewPage(30);
      
      // Título de sección
      doc.setFontSize(16);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.text(title, margin, yPosition);
      
      // Línea bajo el título
      yPosition += 3;
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, margin + 60, yPosition);
      yPosition += 12;
      
      content();
      yPosition += 18;
    };

    // Función para agregar información del cliente
    const addClientInfo = () => {
      doc.setFontSize(11);
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.setFont('helvetica', 'normal');
      
      const clientData = [
        { label: 'Nombre Completo:', value: order.profiles?.full_name || 'N/A' },
        { label: 'Email:', value: order.profiles?.email || 'N/A' },
        { label: 'Teléfono:', value: order.profiles?.phone || 'N/A' },
        { label: 'Dirección:', value: order.profiles?.billing_address || 'N/A' },
        { label: 'Ciudad:', value: order.profiles?.billing_city || 'N/A' },
        { label: 'Código Postal:', value: order.profiles?.billing_postal_code || 'N/A' },
        { label: 'País:', value: order.profiles?.billing_country || 'N/A' }
      ];
      
      clientData.forEach((item, index) => {
        if (item.value !== 'N/A') {
          doc.setFont('helvetica', 'bold');
          doc.text(item.label, margin, yPosition);
          doc.setFont('helvetica', 'normal');
          doc.text(item.value, margin + 40, yPosition);
          yPosition += 8;
        }
      });
    };

    // Función para agregar información del vehículo
    const addVehicleInfo = () => {
      doc.setFontSize(11);
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      
      const vehicleData = [
        { label: 'Marca:', value: order.vehicle_make },
        { label: 'Modelo:', value: order.vehicle_model },
        { label: 'Generación:', value: order.vehicle_generation },
        { label: 'Motor:', value: order.vehicle_engine },
        { label: 'Año:', value: order.vehicle_year },
        { label: 'ECU:', value: order.vehicle_ecu },
        { label: 'Transmisión:', value: order.vehicle_gearbox },
        { label: 'Potencia:', value: order.engine_hp ? `${order.engine_hp} HP${order.engine_kw ? ` (${order.engine_kw} kW)` : ''}` : null },
        { label: 'Lectura:', value: order.read_method },
        { label: 'Hardware:', value: order.hardware_number },
        { label: 'Software:', value: order.software_number }
      ];
      
      let col1Y = yPosition;
      let col2Y = yPosition;
      const colWidth = (pageWidth - 2 * margin) / 2;
      
      vehicleData.forEach((item, index) => {
        if (item.value) {
          const isLeftColumn = index % 2 === 0;
          const xPos = isLeftColumn ? margin : margin + colWidth;
          const currentY = isLeftColumn ? col1Y : col2Y;
          
          doc.setFont('helvetica', 'bold');
          doc.text(item.label, xPos, currentY);
          doc.setFont('helvetica', 'normal');
          doc.text(item.value, xPos + 35, currentY);
          
          if (isLeftColumn) {
            col1Y += 8;
          } else {
            col2Y += 8;
          }
        }
      });
      
      yPosition = Math.max(col1Y, col2Y);
    };

    // Función para agregar modificaciones del vehículo
    const addVehicleModifications = () => {
      const modifications = [
        { key: 'aftermarket_exhaust', label: 'Escape Aftermarket', remarks: 'aftermarket_exhaust_remarks' },
        { key: 'aftermarket_intake_manifold', label: 'Colector de Admisión Aftermarket', remarks: 'aftermarket_intake_manifold_remarks' },
        { key: 'cold_air_intake', label: 'Admisión de Aire Frío', remarks: 'cold_air_intake_remarks' },
        { key: 'decat', label: 'Decat', remarks: 'decat_remarks' }
      ];
      
      const hasAnyModification = modifications.some(({ key }) => order[key as keyof OrderData]);
      
      if (!hasAnyModification) {
        doc.setFontSize(11);
        doc.setTextColor(lightColor[0], lightColor[1], lightColor[2]);
        doc.setFont('helvetica', 'italic');
        doc.text('No se han reportado modificaciones en el vehículo.', margin, yPosition);
        yPosition += 8;
        return;
      }
      
      doc.setFontSize(11);
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      
      modifications.forEach(({ key, label, remarks }) => {
        const hasModification = order[key as keyof OrderData] as boolean;
        const remarkText = order[remarks as keyof OrderData] as string;
        
        if (hasModification) {
          doc.setFont('helvetica', 'bold');
          doc.text(`• ${label}`, margin, yPosition);
          doc.setFont('helvetica', 'normal');
          yPosition += 8;
          
          if (remarkText && remarkText.trim()) {
            doc.setTextColor(lightColor[0], lightColor[1], lightColor[2]);
            doc.setFont('helvetica', 'italic');
            const lines = doc.splitTextToSize(`  Observaciones: ${remarkText}`, pageWidth - 2 * margin - 10);
            lines.forEach((line: string) => {
              doc.text(line, margin + 5, yPosition);
              yPosition += 7;
            });
            yPosition += 3;
          }
          
          doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
        }
      });
    };

    // Función para agregar servicios adicionales
    const addAdditionalServices = () => {
      if (!order.additional_services_details || order.additional_services_details.length === 0) return;
      
      doc.setFontSize(11);
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      
      let totalAdditional = 0;
      
      order.additional_services_details.forEach((service: any, index: number) => {
        const price = parseFloat(service.price || 0);
        totalAdditional += price;
        
        doc.setFont('helvetica', 'normal');
        doc.text(`• ${service.title}`, margin, yPosition);
        doc.setFont('helvetica', 'bold');
        doc.text(`€${price.toFixed(2)}`, pageWidth - margin, yPosition, { align: 'right' });
        yPosition += 8;
      });
      
      // Total de servicios adicionales
      if (totalAdditional > 0) {
        yPosition += 5;
        doc.setDrawColor(lightColor[0], lightColor[1], lightColor[2]);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 8;
        
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text('Total Servicios Adicionales:', margin, yPosition);
        doc.text(`€${totalAdditional.toFixed(2)}`, pageWidth - margin, yPosition, { align: 'right' });
      }
    };

    // Función para agregar archivos del cliente
    const addClientFiles = () => {
      // Verificar si hay archivos del cliente
      const orderFiles = order.order_files || [];
      const clientFilesParam = clientFiles || [];
      
      doc.setFontSize(11);
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      
      if (orderFiles.length > 0 || clientFilesParam.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.text('Archivos del Cliente:', margin, yPosition);
        yPosition += 8;
        
        doc.setFont('helvetica', 'normal');
        
        // Mostrar archivos de order.order_files
        orderFiles.forEach((file, index) => {
          if (file.file_name && file.file_name.trim() !== '') {
            // Mostrar nombre del archivo con fecha de subida
            doc.text(`• ${file.file_name}`, margin + 5, yPosition);
            yPosition += 7;
            
            // Agregar fecha de subida si está disponible
            if (file.created_at) {
              doc.setFont('helvetica', 'italic');
              doc.setTextColor(lightColor[0], lightColor[1], lightColor[2]);
              doc.text(`  Subido: ${formatDate(file.created_at)}`, margin + 10, yPosition);
              yPosition += 6;
              doc.setFont('helvetica', 'normal');
              doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
            }
          }
        });
        
        // Mostrar archivos del parámetro clientFiles
        clientFilesParam.forEach((file, index) => {
          if (file.file_name && file.file_name.trim() !== '') {
            // Mostrar nombre del archivo con fecha de subida
            doc.text(`• ${file.file_name}`, margin + 5, yPosition);
            yPosition += 7;
            
            // Agregar fecha de subida si está disponible
            if (file.created_at) {
              doc.setFont('helvetica', 'italic');
              doc.setTextColor(lightColor[0], lightColor[1], lightColor[2]);
              doc.text(`  Subido: ${formatDate(file.created_at)}`, margin + 10, yPosition);
              yPosition += 6;
              doc.setFont('helvetica', 'normal');
              doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
            }
            
            // Agregar tamaño del archivo si está disponible
            if (file.file_size) {
              doc.setFont('helvetica', 'italic');
              doc.setTextColor(lightColor[0], lightColor[1], lightColor[2]);
              doc.text(`  Tamaño: ${(file.file_size / 1024 / 1024).toFixed(2)} MB`, margin + 10, yPosition);
              yPosition += 6;
              doc.setFont('helvetica', 'normal');
              doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
            }
          }
        });
        yPosition += 8;
      } else {
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(lightColor[0], lightColor[1], lightColor[2]);
        doc.text('No se han subido archivos del cliente.', margin, yPosition);
        yPosition += 8;
      }
    };

    // Función para agregar información adicional
    const addAdditionalInfo = () => {
      if (!order.additional_info) return;
      
      doc.setFontSize(11);
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.setFont('helvetica', 'normal');
      
      const lines = doc.splitTextToSize(order.additional_info, pageWidth - 2 * margin - 10);
      lines.forEach((line: string) => {
        checkNewPage(10);
        doc.text(line, margin, yPosition);
        yPosition += 7;
      });
    };

    // Función para agregar resumen financiero
    const addFinancialSummary = () => {
      checkNewPage(40);
      
      // Fondo para el resumen
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 35, 'F');
      
      doc.setFontSize(14);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.text('RESUMEN FINANCIERO', margin + 5, yPosition + 8);
      
      yPosition += 20;
      
      // Detalles financieros
      const basePrice = parseFloat(order.base_price?.toString() || '0');
      const additionalPrice = order.additional_services_details?.reduce((sum: number, service: any) => 
        sum + parseFloat(service.price || 0), 0) || 0;
      const totalPrice = parseFloat(order.total_price?.toString() || '0');
      
      doc.setFontSize(12);
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.setFont('helvetica', 'normal');
      
      if (basePrice > 0) {
        doc.text('Precio Base:', margin + 5, yPosition);
        doc.text(`€${basePrice.toFixed(2)}`, pageWidth - margin - 5, yPosition, { align: 'right' });
        yPosition += 8;
      }
      
      if (additionalPrice > 0) {
        doc.text('Servicios Adicionales:', margin + 5, yPosition);
        doc.text(`€${additionalPrice.toFixed(2)}`, pageWidth - margin - 5, yPosition, { align: 'right' });
        yPosition += 8;
      }
      
      // Línea separadora
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setLineWidth(1);
      doc.line(margin + 5, yPosition, pageWidth - margin - 5, yPosition);
      yPosition += 8;
      
      // Total final
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('TOTAL:', margin + 5, yPosition);
      doc.text(`€${totalPrice.toFixed(2)}`, pageWidth - margin - 5, yPosition, { align: 'right' });
    };

    // Función para agregar footer
    const addFooter = () => {
      const footerY = pageHeight - 20;
      
      doc.setFontSize(8);
      doc.setTextColor(lightColor[0], lightColor[1], lightColor[2]);
      doc.setFont('helvetica', 'normal');
      
      // Línea separadora
      doc.setDrawColor(lightColor[0], lightColor[1], lightColor[2]);
      doc.setLineWidth(0.5);
      doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
      
      // Texto del footer
      doc.text('Este documento ha sido generado automáticamente por FilesECUFB', pageWidth / 2, footerY, { align: 'center' });
      doc.text(`Generado el: ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}`, pageWidth / 2, footerY + 5, { align: 'center' });
    };

    // Construir el PDF
    addLogo();
    addCompanyHeader();
    addDocumentTitle();
    addOrderBasicInfo();
    
    addSection('INFORMACIÓN DEL CLIENTE', addClientInfo);
    addSection('INFORMACIÓN DEL VEHÍCULO', addVehicleInfo);
    addSection('MODIFICACIONES DEL VEHÍCULO', addVehicleModifications);
    addSection('SERVICIOS ADICIONALES', addAdditionalServices);
    addSection('ARCHIVOS DEL CLIENTE', addClientFiles);
    addSection('INFORMACIÓN ADICIONAL', addAdditionalInfo);
    addFinancialSummary();
    addFooter();

    // Guardar el PDF
    doc.save(`pedido-${order.id.slice(-8)}-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF generado correctamente');
  } catch (error) {
    console.error('Error al generar PDF:', error);
    toast.error('Error al generar el PDF');
  }
};

// Función para generar PDF como blob (para uso en ZIP)
export const generatePDFBlob = async (order: OrderData): Promise<Blob | null> => {
  if (!order) return null;

  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    let yPosition = 25;

    // Colores corporativos
    const primaryColor = [59, 130, 246]; // Azul primario
    const darkColor = [31, 41, 55]; // Gris oscuro
    const lightColor = [107, 114, 128]; // Gris claro
    const accentColor = [16, 185, 129]; // Verde accent

    // Función para verificar si necesitamos una nueva página
    const checkNewPage = (requiredSpace: number) => {
      if (yPosition + requiredSpace > pageHeight - 30) {
        doc.addPage();
        yPosition = 30;
        return true;
      }
      return false;
    };

    // Función para agregar logo (simulado con texto estilizado)
    const addLogo = () => {
      // Logo simulado con texto estilizado
      doc.setFontSize(24);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.text('FILESECUFB', margin, yPosition);
      
      // Subtítulo del logo
      doc.setFontSize(10);
      doc.setTextColor(lightColor[0], lightColor[1], lightColor[2]);
      doc.setFont('helvetica', 'normal');
      doc.text('Professional ECU Services', margin, yPosition + 8);
      
      yPosition += 20;
    };

    // Función para agregar header con información de la empresa
    const addCompanyHeader = () => {
      // Línea decorativa superior
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setLineWidth(2);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;

      // Información de la empresa (lado derecho)
      const companyInfo = [
        'www.filesecufb.com',
        'info@filesecufb.com',
        '+34 630 84 10 47'
      ];
      
      doc.setFontSize(9);
      doc.setTextColor(lightColor[0], lightColor[1], lightColor[2]);
      companyInfo.forEach((info, index) => {
        doc.text(info, pageWidth - margin, yPosition + (index * 5), { align: 'right' });
      });
      
      yPosition += 25;
    };

    // Función para agregar título del documento
    const addDocumentTitle = () => {
      doc.setFontSize(28);
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.text('DETALLE DEL PEDIDO', pageWidth / 2, yPosition, { align: 'center' });
      
      // Línea decorativa bajo el título
      yPosition += 8;
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setLineWidth(1);
      doc.line(pageWidth / 2 - 40, yPosition, pageWidth / 2 + 40, yPosition);
      yPosition += 20;
    };

    // Función para agregar información básica del pedido
    const addOrderBasicInfo = () => {
      // Fondo gris claro para la información básica
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 25, 'F');
      
      doc.setFontSize(12);
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.setFont('helvetica', 'bold');
      
      // Primera fila
      doc.text(`Pedido #${order.id.slice(-8).toUpperCase()}`, margin + 5, yPosition + 5);
      doc.text(`Fecha: ${formatDate(order.created_at)}`, pageWidth / 2, yPosition + 5, { align: 'center' });
      doc.text(`Total: €${parseFloat(order.total_price?.toString() || '0').toFixed(2)}`, pageWidth - margin - 5, yPosition + 5, { align: 'right' });
      
      // Segunda fila
      doc.text(`Servicio: ${order.services?.title || 'N/A'}`, margin + 5, yPosition + 15);
      
      yPosition += 35;
    };

    // Función para agregar sección con título
    const addSection = (title: string, content: () => void) => {
      checkNewPage(30);
      
      // Título de sección
      doc.setFontSize(16);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.text(title, margin, yPosition);
      
      // Línea bajo el título
      yPosition += 3;
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, margin + 60, yPosition);
      yPosition += 12;
      
      content();
      yPosition += 18;
    };

    // Función para agregar información del cliente
    const addClientInfo = () => {
      doc.setFontSize(11);
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.setFont('helvetica', 'normal');
      
      const clientData = [
        { label: 'Nombre Completo:', value: order.profiles?.full_name || 'N/A' },
        { label: 'Email:', value: order.profiles?.email || 'N/A' },
        { label: 'Teléfono:', value: order.profiles?.phone || 'N/A' },
        { label: 'Dirección:', value: order.profiles?.billing_address || 'N/A' },
        { label: 'Ciudad:', value: order.profiles?.billing_city || 'N/A' },
        { label: 'Código Postal:', value: order.profiles?.billing_postal_code || 'N/A' },
        { label: 'País:', value: order.profiles?.billing_country || 'N/A' }
      ];
      
      clientData.forEach((item, index) => {
        if (item.value !== 'N/A') {
          doc.setFont('helvetica', 'bold');
          doc.text(item.label, margin, yPosition);
          doc.setFont('helvetica', 'normal');
          doc.text(item.value, margin + 40, yPosition);
          yPosition += 8;
        }
      });
    };

    // Función para agregar información del vehículo
    const addVehicleInfo = () => {
      doc.setFontSize(11);
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      
      const vehicleData = [
        { label: 'Marca:', value: order.vehicle_make },
        { label: 'Modelo:', value: order.vehicle_model },
        { label: 'Generación:', value: order.vehicle_generation },
        { label: 'Motor:', value: order.vehicle_engine },
        { label: 'Año:', value: order.vehicle_year },
        { label: 'ECU:', value: order.vehicle_ecu },
        { label: 'Transmisión:', value: order.vehicle_gearbox },
        { label: 'Potencia:', value: order.engine_hp ? `${order.engine_hp} HP${order.engine_kw ? ` (${order.engine_kw} kW)` : ''}` : null },
        { label: 'Lectura:', value: order.read_method },
        { label: 'Hardware:', value: order.hardware_number },
        { label: 'Software:', value: order.software_number }
      ];
      
      let col1Y = yPosition;
      let col2Y = yPosition;
      const colWidth = (pageWidth - 2 * margin) / 2;
      
      vehicleData.forEach((item, index) => {
        if (item.value) {
          const isLeftColumn = index % 2 === 0;
          const xPos = isLeftColumn ? margin : margin + colWidth;
          const currentY = isLeftColumn ? col1Y : col2Y;
          
          doc.setFont('helvetica', 'bold');
          doc.text(item.label, xPos, currentY);
          doc.setFont('helvetica', 'normal');
          doc.text(item.value, xPos + 35, currentY);
          
          if (isLeftColumn) {
            col1Y += 8;
          } else {
            col2Y += 8;
          }
        }
      });
      
      yPosition = Math.max(col1Y, col2Y);
    };

    // Función para agregar modificaciones del vehículo
    const addVehicleModifications = () => {
      const modifications = [
        { key: 'aftermarket_exhaust', label: 'Escape Aftermarket', remarks: 'aftermarket_exhaust_remarks' },
        { key: 'aftermarket_intake_manifold', label: 'Colector de Admisión Aftermarket', remarks: 'aftermarket_intake_manifold_remarks' },
        { key: 'cold_air_intake', label: 'Admisión de Aire Frío', remarks: 'cold_air_intake_remarks' },
        { key: 'decat', label: 'Decat', remarks: 'decat_remarks' }
      ];
      
      const hasAnyModification = modifications.some(({ key }) => order[key as keyof OrderData]);
      
      if (!hasAnyModification) {
        doc.setFontSize(11);
        doc.setTextColor(lightColor[0], lightColor[1], lightColor[2]);
        doc.setFont('helvetica', 'italic');
        doc.text('No se han reportado modificaciones en el vehículo.', margin, yPosition);
        yPosition += 8;
        return;
      }
      
      doc.setFontSize(11);
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      
      modifications.forEach(({ key, label, remarks }) => {
        const hasModification = order[key as keyof OrderData] as boolean;
        const remarkText = order[remarks as keyof OrderData] as string;
        
        if (hasModification) {
          doc.setFont('helvetica', 'bold');
          doc.text(`• ${label}`, margin, yPosition);
          doc.setFont('helvetica', 'normal');
          yPosition += 8;
          
          if (remarkText && remarkText.trim()) {
            doc.setTextColor(lightColor[0], lightColor[1], lightColor[2]);
            doc.setFont('helvetica', 'italic');
            const lines = doc.splitTextToSize(`  Observaciones: ${remarkText}`, pageWidth - 2 * margin - 10);
            lines.forEach((line: string) => {
              doc.text(line, margin + 5, yPosition);
              yPosition += 7;
            });
            yPosition += 3;
          }
          
          doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
        }
      });
    };

    // Función para agregar servicios adicionales
    const addAdditionalServices = () => {
      if (!order.additional_services_details || order.additional_services_details.length === 0) return;
      
      doc.setFontSize(11);
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      
      let totalAdditional = 0;
      
      order.additional_services_details.forEach((service: any, index: number) => {
        const price = parseFloat(service.price || 0);
        totalAdditional += price;
        
        doc.setFont('helvetica', 'normal');
        doc.text(`• ${service.title}`, margin, yPosition);
        doc.setFont('helvetica', 'bold');
        doc.text(`€${price.toFixed(2)}`, pageWidth - margin, yPosition, { align: 'right' });
        yPosition += 8;
      });
      
      // Total de servicios adicionales
      if (totalAdditional > 0) {
        yPosition += 5;
        doc.setDrawColor(lightColor[0], lightColor[1], lightColor[2]);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 8;
        
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text('Total Servicios Adicionales:', margin, yPosition);
        doc.text(`€${totalAdditional.toFixed(2)}`, pageWidth - margin, yPosition, { align: 'right' });
      }
    };

    // Función para agregar archivos del cliente
    const addClientFiles = () => {
      // Obtener archivos principales y adicionales de order.order_files
      const mainFiles = (order.order_files || []).filter(file => 
        file.file_url && file.file_url.includes('clientordersprincipal')
      );
      const additionalFiles = (order.order_files || []).filter(file => 
        file.file_url && file.file_url.includes('clientorderadicional')
      );
      
      doc.setFontSize(11);
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      
      if (mainFiles.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.text('Archivos Principales:', margin, yPosition);
        yPosition += 8;
        
        doc.setFont('helvetica', 'normal');
        mainFiles.forEach((file, index) => {
          if (file.file_name && file.file_name.trim() !== '') {
            doc.text(`• ${file.file_name}`, margin + 5, yPosition);
            yPosition += 7;
          }
        });
        yPosition += 8;
      }
      
      if (additionalFiles.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.text('Archivos Adicionales:', margin, yPosition);
        yPosition += 8;
        
        doc.setFont('helvetica', 'normal');
        additionalFiles.forEach((file, index) => {
          if (file.file_name && file.file_name.trim() !== '') {
            doc.text(`• ${file.file_name}`, margin + 5, yPosition);
            yPosition += 7;
          }
        });
      }
    };

    // Función para agregar información adicional
    const addAdditionalInfo = () => {
      if (!order.additional_info) return;
      
      doc.setFontSize(11);
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.setFont('helvetica', 'normal');
      
      const lines = doc.splitTextToSize(order.additional_info, pageWidth - 2 * margin - 10);
      lines.forEach((line: string) => {
        checkNewPage(10);
        doc.text(line, margin, yPosition);
        yPosition += 7;
      });
    };

    // Función para agregar resumen financiero
    const addFinancialSummary = () => {
      checkNewPage(40);
      
      // Fondo para el resumen
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 35, 'F');
      
      doc.setFontSize(14);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.text('RESUMEN FINANCIERO', margin + 5, yPosition + 8);
      
      yPosition += 20;
      
      // Detalles financieros
      const basePrice = parseFloat(order.base_price?.toString() || '0');
      const additionalPrice = order.additional_services_details?.reduce((sum: number, service: any) => 
        sum + parseFloat(service.price || 0), 0) || 0;
      const totalPrice = parseFloat(order.total_price?.toString() || '0');
      
      doc.setFontSize(12);
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.setFont('helvetica', 'normal');
      
      if (basePrice > 0) {
        doc.text('Precio Base:', margin + 5, yPosition);
        doc.text(`€${basePrice.toFixed(2)}`, pageWidth - margin - 5, yPosition, { align: 'right' });
        yPosition += 8;
      }
      
      if (additionalPrice > 0) {
        doc.text('Servicios Adicionales:', margin + 5, yPosition);
        doc.text(`€${additionalPrice.toFixed(2)}`, pageWidth - margin - 5, yPosition, { align: 'right' });
        yPosition += 8;
      }
      
      // Línea separadora
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setLineWidth(1);
      doc.line(margin + 5, yPosition, pageWidth - margin - 5, yPosition);
      yPosition += 8;
      
      // Total final
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('TOTAL:', margin + 5, yPosition);
      doc.text(`€${totalPrice.toFixed(2)}`, pageWidth - margin - 5, yPosition, { align: 'right' });
    };

    // Función para agregar footer
    const addFooter = () => {
      const footerY = pageHeight - 20;
      
      doc.setFontSize(8);
      doc.setTextColor(lightColor[0], lightColor[1], lightColor[2]);
      doc.setFont('helvetica', 'normal');
      
      // Línea separadora
      doc.setDrawColor(lightColor[0], lightColor[1], lightColor[2]);
      doc.setLineWidth(0.5);
      doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
      
      // Texto del footer
      doc.text('Este documento ha sido generado automáticamente por FilesECUFB', pageWidth / 2, footerY, { align: 'center' });
      doc.text(`Generado el: ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}`, pageWidth / 2, footerY + 5, { align: 'center' });
    };

    // Construir el PDF
    addLogo();
    addCompanyHeader();
    addDocumentTitle();
    addOrderBasicInfo();
    
    addSection('INFORMACIÓN DEL CLIENTE', addClientInfo);
    addSection('INFORMACIÓN DEL VEHÍCULO', addVehicleInfo);
    addSection('MODIFICACIONES DEL VEHÍCULO', addVehicleModifications);
    addSection('SERVICIOS ADICIONALES', addAdditionalServices);
    addSection('ARCHIVOS DEL CLIENTE', addClientFiles);
    addSection('INFORMACIÓN ADICIONAL', addAdditionalInfo);
    addFinancialSummary();
    addFooter();

    return doc.output('blob');
  } catch (error) {
    console.error('Error al generar PDF blob:', error);
    return null;
  }
};