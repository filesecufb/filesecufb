// API URL base para el backend
const API_BASE_URL = 'http://localhost:3001';

export interface OrderData {
  id: string;
  client_name: string;
  client_email: string;
  service_name?: string;
  status: string;
  created_at: string;
  total_price?: number;
  vehicle_info?: string;
  order_files?: any[];
  invoices?: any[];
}

export interface OrderFiles {
  name: string;
  content: string;
  type: string;
}

// Función auxiliar para hacer peticiones al backend
const apiRequest = async (endpoint: string, data: any) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error en la petición');
    }

    return await response.json();
  } catch (error) {
    console.error(`Error en ${endpoint}:`, error);
    throw error;
  }
};

// Enviar nuevo pedido al admin
export const sendNewOrderToAdmin = async (orderData: OrderData) => {
  try {
    const result = await apiRequest('/api/send-new-order', { orderData });
    return { success: true, data: result.data };
  } catch (error) {
    console.error('Error enviando email al admin:', error);
    return { success: false, error };
  }
};

// Enviar confirmación al cliente
export const sendOrderConfirmationToClient = async (orderData: OrderData) => {
  try {
    const result = await apiRequest('/api/send-confirmation', { orderData });
    return { success: true, data: result.data };
  } catch (error) {
    console.error('Error enviando confirmación al cliente:', error);
    return { success: false, error };
  }
};

// Enviar actualización de estado al cliente
export const sendStatusUpdateToClient = async (orderData: OrderData) => {
  try {
    const result = await apiRequest('/api/send-status-update', { orderData });
    return { success: true, data: result.data };
  } catch (error) {
    console.error('Error enviando actualización de estado:', error);
    return { success: false, error };
  }
};

// Enviar pedido completado con archivos al cliente
export const sendCompletedOrderWithFiles = async (orderData: OrderData, files: OrderFiles[] = []) => {
  try {
    const result = await apiRequest('/api/send-completed-order', { orderData, files });
    return { success: true, data: result.data };
  } catch (error) {
    console.error('Error enviando pedido completado:', error);
    return { success: false, error };
  }
};

// Función para verificar si el servidor de email está disponible
export const checkEmailServerHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    if (response.ok) {
      const data = await response.json();
      return { success: true, data };
    }
    return { success: false, error: 'Server not responding' };
  } catch (error) {
    console.error('Error checking email server health:', error);
    return { success: false, error };
  }
};

// Función helper para enviar emails cuando se crea un nuevo pedido
export const handleNewOrder = async (orderData: OrderData) => {
  const results = await Promise.allSettled([
    sendNewOrderToAdmin(orderData),
    sendOrderConfirmationToClient(orderData)
  ]);

  return {
    adminEmail: results[0],
    clientEmail: results[1]
  };
};

// Función helper para enviar emails cuando cambia el estado
export const handleStatusChange = async (orderData: OrderData, files?: OrderFiles[]) => {
  if (orderData.status === 'completed' && files) {
    // Si está completado y hay archivos, enviar ambos emails
    const results = await Promise.allSettled([
      sendStatusUpdateToClient(orderData),
      sendCompletedOrderWithFiles(orderData, files)
    ]);
    
    return {
      statusEmail: results[0],
      filesEmail: results[1]
    };
  } else {
    // Solo enviar actualización de estado
    const result = await sendStatusUpdateToClient(orderData);
    return {
       statusEmail: { status: 'fulfilled', value: result }
     };
   }
 };