// Cron job para limpieza AGRESIVA de Supabase Storage (archivos > 20 minutos)
// Este archivo es llamado automáticamente por Vercel según el schedule configurado

import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase configuration');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Función para limpiar registros antiguos de la tabla order_files (> 20 minutos)
async function cleanupOrderFilesTable(maxAgeMinutes = 20) {
  try {
    console.log('🗃️ Iniciando limpieza AGRESIVA de la tabla order_files');
    
    const cutoffDate = new Date();
    cutoffDate.setMinutes(cutoffDate.getMinutes() - maxAgeMinutes);
    
    // Eliminar registros antiguos de order_files
    const { data, error } = await supabase
      .from('order_files')
      .delete()
      .lt('created_at', cutoffDate.toISOString());
    
    if (error) {
      console.error('Error eliminando registros de order_files:', error);
      return { deleted: 0, errors: 1 };
    }
    
    const deletedCount = data?.length || 0;
    console.log(`🗑️ Eliminados ${deletedCount} registros antiguos de order_files (> ${maxAgeMinutes} min)`);
    
    return { deleted: deletedCount, errors: 0 };
  } catch (error) {
    console.error('Error en limpieza agresiva de order_files:', error);
    return { deleted: 0, errors: 1 };
  }
}

// Función para eliminar archivos antiguos de un bucket (> 20 minutos)
async function cleanupBucket(bucketName, maxAgeMinutes = 20) {
  try {
    console.log(`🧹 Iniciando limpieza AGRESIVA del bucket: ${bucketName}`);
    
    // Listar todos los archivos del bucket
    const { data: files, error: listError } = await supabase.storage
      .from(bucketName)
      .list('', {
        limit: 1000,
        sortBy: { column: 'created_at', order: 'asc' }
      });
    
    if (listError) {
      console.error(`Error listando archivos del bucket ${bucketName}:`, listError);
      return { deleted: 0, errors: 1 };
    }
    
    if (!files || files.length === 0) {
      console.log(`No hay archivos en el bucket ${bucketName}`);
      return { deleted: 0, errors: 0 };
    }
    
    // Filtrar archivos antiguos (> 20 minutos)
    const now = new Date();
    const maxAge = maxAgeMinutes * 60 * 1000; // Convertir minutos a milisegundos
    
    const oldFiles = files.filter(file => {
      const fileDate = new Date(file.created_at);
      const age = now - fileDate;
      return age > maxAge;
    });
    
    console.log(`Encontrados ${oldFiles.length} archivos antiguos (> ${maxAgeMinutes} min) en ${bucketName}`);
    
    if (oldFiles.length === 0) {
      return { deleted: 0, errors: 0 };
    }
    
    // Eliminar archivos antiguos
    const filePaths = oldFiles.map(file => file.name);
    const { data: deleteData, error: deleteError } = await supabase.storage
      .from(bucketName)
      .remove(filePaths);
    
    if (deleteError) {
      console.error(`Error eliminando archivos del bucket ${bucketName}:`, deleteError);
      return { deleted: 0, errors: 1 };
    }
    
    console.log(`Eliminados ${filePaths.length} archivos del bucket ${bucketName}`);
    return { deleted: filePaths.length, errors: 0 };
    
  } catch (error) {
    console.error(`Error en limpieza agresiva del bucket ${bucketName}:`, error);
    return { deleted: 0, errors: 1 };
  }
}

// Handler principal del cron job AGRESIVO
export default async function handler(req, res) {
  try {
    console.log('Iniciando limpieza AGRESIVA de storage via cron job (> 20 minutos)...');
    const startTime = new Date();
    
    // Lista de buckets a limpiar
    const bucketsToClean = [
      'clientordersprincipal',
      'clientorderadicional',
      'adminorders',
      'invoices'
    ];
    
    let totalDeleted = 0;
    let totalErrors = 0;
    const results = {};
    
    // Limpiar cada bucket (archivos > 20 minutos)
    for (const bucketName of bucketsToClean) {
      const result = await cleanupBucket(bucketName, 20);
      results[bucketName] = result;
      totalDeleted += result.deleted;
      totalErrors += result.errors;
    }
    
    // Limpiar tabla order_files (registros > 20 minutos)
    const dbResult = await cleanupOrderFilesTable(20);
    results['order_files_table'] = dbResult;
    totalDeleted += dbResult.deleted;
    totalErrors += dbResult.errors;
    
    const endTime = new Date();
    const duration = endTime - startTime;
    
    const summary = {
      timestamp: startTime.toISOString(),
      duration_ms: duration,
      total_files_deleted: totalDeleted,
      total_errors: totalErrors,
      buckets_processed: bucketsToClean.length,
      cleanup_type: 'AGGRESSIVE (> 20 minutes)',
      results: results
    };
    
    console.log('Limpieza AGRESIVA completada:', summary);
    
    return res.status(200).json({
      success: true,
      message: `Limpieza AGRESIVA completada. ${totalDeleted} archivos eliminados (> 20 min).`,
      ...summary
    });
    
  } catch (error) {
    console.error('Error en limpieza AGRESIVA de storage:', error);
    
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}