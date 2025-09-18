/**
 * Utility functions for file operations
 */

/**
 * Formats file size from bytes to human readable format
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
export const formatFileSize = (bytes: number): string => {
  if (!bytes || bytes === 0) return '0 Bytes';
  
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

/**
 * Calculates expiration date (120 days from upload date)
 * @param uploadDate - Upload date string
 * @returns Formatted expiration date
 */
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