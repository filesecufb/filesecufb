// Función para calcular fecha de caducidad (120 días desde la fecha de subida)
export const calculateExpirationDate = (uploadDate: string): string => {
  if (!uploadDate) return 'Fecha no disponible';
  
  const upload = new Date(uploadDate);
  const expiration = new Date(upload);
  expiration.setDate(upload.getDate() + 120);
  
  const day = expiration.getDate().toString().padStart(2, '0');
  const month = (expiration.getMonth() + 1).toString().padStart(2, '0');
  const year = expiration.getFullYear();
  
  return `${day}/${month}/${year}`;
};

// Función para formatear tamaño de archivos
export const formatFileSize = (bytes: number): string => {
  if (!bytes) return 'Tamaño desconocido';
  
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};