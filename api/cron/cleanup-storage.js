// Cron job para limpieza automática de Supabase Storage
// Este archivo es llamado automáticamente por Vercel según el schedule configurado

import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase configuration');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Función para limpiar registros antiguos de la tabla order_files
async function cleanupOrderFilesTable(maxAgeHours = 24) {
  try {
    console.log('🗃️ Iniciando limpieza de la tabla order_files');
    
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - maxAgeHours);
    
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
    console.log(`🗑️ Eliminados ${deletedCount} registros antiguos de order_files`);
    
    return { deleted: deletedCount, errors: 0 };
  } catch (error) {
    console.error('Error en limpieza de order_files:', error);
    return { deleted: 0, errors: 1 };
  }
}

// Función para eliminar archivos antiguos de un bucket
async function cleanupBucket(bucketName, maxAgeHours = 24) {
  try {
    console.log(`🧹 Iniciando limpieza del bucket: ${bucketName}`);
    
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
    
    // Filtrar archivos antiguos
    const now = new Date();
    const maxAge = maxAgeHours * 60 * 60 * 1000; // Convertir horas a milisegundos
    
    const oldFiles = files.filter(file => {
      const fileDate = new Date(file.created_at);
      const age = now - fileDate;
      return age > maxAge;
    });
    
    console.log(`Encontrados ${oldFiles.length} archivos antiguos en ${bucketName}`);
    
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
    console.error(`Error en limpieza del bucket ${bucketName}:`, error);
    return { deleted: 0, errors: 1 };
  }
}

// Handler principal del cron job
export default async function handler(req, res) {
  try {
    console.log('Iniciando limpieza automática de storage via cron job...');
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
    
    // Limpiar cada bucket
    for (const bucketName of bucketsToClean) {
      const result = await cleanupBucket(bucketName, 24);
      results[bucketName] = result;
      totalDeleted += result.deleted;
      totalErrors += result.errors;
    }
    
    // Limpiar tabla order_files
    const dbResult = await cleanupOrderFilesTable(24);
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
      results: results
    };
    
    console.log('Limpieza automática completada:', summary);
    
    return res.status(200).json({
      success: true,
      message: `Limpieza automática completada. ${totalDeleted} archivos eliminados.`,
      ...summary
    });
    
  } catch (error) {
    console.error('Error en limpieza automática de storage:', error);
    
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}