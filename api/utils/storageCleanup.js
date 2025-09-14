import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase con service role para operaciones administrativas
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://njxyatnhizjyzoisceuw.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for storage cleanup operations');
}

// Cliente de Supabase con permisos administrativos
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Calcula si un archivo es más antiguo que el tiempo especificado
 * @param {string} createdAt - Fecha de creación del archivo en formato ISO
 * @param {number} maxAgeMinutes - Edad máxima en minutos (5 para pruebas, 175200 para 4 meses)
 * @returns {boolean} - true si el archivo debe ser eliminado
 */
export function isFileExpired(createdAt, maxAgeMinutes = 5) {
  const fileDate = new Date(createdAt);
  const now = new Date();
  const diffMinutes = (now - fileDate) / (1000 * 60);
  
  return diffMinutes > maxAgeMinutes;
}

/**
 * Obtiene la lista de archivos de un bucket específico
 * @param {string} bucketName - Nombre del bucket
 * @returns {Promise<Array>} - Lista de archivos con metadatos
 */
export async function getFilesFromBucket(bucketName) {
  try {
    const { data: files, error } = await supabaseAdmin.storage
      .from(bucketName)
      .list('', {
        limit: 1000,
        sortBy: { column: 'created_at', order: 'asc' }
      });

    if (error) {
      console.error(`Error listing files from bucket ${bucketName}:`, error);
      return [];
    }

    return files || [];
  } catch (error) {
    console.error(`Exception getting files from bucket ${bucketName}:`, error);
    return [];
  }
}

/**
 * Elimina un archivo específico de un bucket
 * @param {string} bucketName - Nombre del bucket
 * @param {string} filePath - Ruta del archivo
 * @returns {Promise<boolean>} - true si se eliminó correctamente
 */
export async function deleteFile(bucketName, filePath) {
  try {
    const { error } = await supabaseAdmin.storage
      .from(bucketName)
      .remove([filePath]);

    if (error) {
      console.error(`Error deleting file ${filePath} from ${bucketName}:`, error);
      return false;
    }

    console.log(`✅ Deleted file: ${bucketName}/${filePath}`);
    return true;
  } catch (error) {
    console.error(`Exception deleting file ${filePath} from ${bucketName}:`, error);
    return false;
  }
}

/**
 * Limpia archivos expirados de un bucket específico
 * @param {string} bucketName - Nombre del bucket
 * @param {number} maxAgeMinutes - Edad máxima en minutos
 * @returns {Promise<Object>} - Resultado de la limpieza
 */
export async function cleanupBucket(bucketName, maxAgeMinutes = 5) {
  console.log(`🧹 Starting cleanup for bucket: ${bucketName} (max age: ${maxAgeMinutes} minutes)`);
  
  const files = await getFilesFromBucket(bucketName);
  const results = {
    total: files.length,
    expired: 0,
    deleted: 0,
    errors: 0
  };

  for (const file of files) {
    if (isFileExpired(file.created_at, maxAgeMinutes)) {
      results.expired++;
      const deleted = await deleteFile(bucketName, file.name);
      if (deleted) {
        results.deleted++;
      } else {
        results.errors++;
      }
    }
  }

  console.log(`📊 Cleanup results for ${bucketName}:`, results);
  return results;
}

/**
 * Limpia todos los buckets de archivos de usuarios y admin
 * @param {number} maxAgeMinutes - Edad máxima en minutos (5 para pruebas, 175200 para 4 meses)
 * @returns {Promise<Object>} - Resultado completo de la limpieza
 */
export async function cleanupAllBuckets(maxAgeMinutes = 5) {
  console.log(`🚀 Starting storage cleanup process (max age: ${maxAgeMinutes} minutes)`);
  
  // Lista de buckets a limpiar
  const bucketsToClean = [
    'user-files',      // Archivos subidos por usuarios
    'admin-files',     // Archivos subidos por admin
    'order-files',     // Archivos relacionados con pedidos
    'invoices',        // Facturas
    'documents'        // Otros documentos
  ];

  const overallResults = {
    startTime: new Date().toISOString(),
    buckets: {},
    totalFiles: 0,
    totalExpired: 0,
    totalDeleted: 0,
    totalErrors: 0
  };

  for (const bucketName of bucketsToClean) {
    const bucketResults = await cleanupBucket(bucketName, maxAgeMinutes);
    overallResults.buckets[bucketName] = bucketResults;
    overallResults.totalFiles += bucketResults.total;
    overallResults.totalExpired += bucketResults.expired;
    overallResults.totalDeleted += bucketResults.deleted;
    overallResults.totalErrors += bucketResults.errors;
  }

  overallResults.endTime = new Date().toISOString();
  
  console.log('🎉 Storage cleanup completed:', {
    duration: `${new Date(overallResults.endTime) - new Date(overallResults.startTime)}ms`,
    summary: {
      totalFiles: overallResults.totalFiles,
      totalExpired: overallResults.totalExpired,
      totalDeleted: overallResults.totalDeleted,
      totalErrors: overallResults.totalErrors
    }
  });

  return overallResults;
}

// Configuración para diferentes entornos
export const CLEANUP_INTERVALS = {
  TEST: 5,           // 5 minutos para pruebas
  PRODUCTION: 175200 // 4 meses = 4 * 30 * 24 * 60 = 175200 minutos
};