// Cron job para limpieza automática de Supabase Storage
// Este archivo es llamado automáticamente por Vercel según el schedule configurado

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: join(__dirname, '..', '..', '.env') });

// Configuración de Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase configuration');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Función principal para limpiar archivos antiguos de order_files
async function cleanupOrderFilesTable(maxAgeDays = 30) {
  try {
    console.log(`🗂️ Iniciando limpieza de registros antiguos (más de ${maxAgeDays} días)`);
    
    // Calcular fecha de corte
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);
    
    console.log(`Fecha de corte: ${cutoffDate.toISOString()}`);
    
    // Primero obtener los registros que se van a eliminar para extraer las URLs
    const { data: recordsToDelete, error: selectError } = await supabase
      .from('order_files')
      .select('*')
      .lt('created_at', cutoffDate.toISOString());
    
    if (selectError) {
      console.error('Error obteniendo registros a eliminar:', selectError);
      return { deleted: 0, error: selectError, fileUrls: [] };
    }
    
    const recordsCount = recordsToDelete?.length || 0;
    console.log(`Encontrados ${recordsCount} registros para eliminar`);
    
    if (recordsCount === 0) {
      return { deleted: 0, fileUrls: [] };
    }
    
    // Extraer las URLs de los archivos
    const fileUrls = recordsToDelete.map(record => record.file_url).filter(url => url);
    console.log(`URLs de archivos a eliminar: ${fileUrls.length}`);
    
    // Eliminar registros de la base de datos
    const { data: deletedRecords, error } = await supabase
      .from('order_files')
      .delete()
      .lt('created_at', cutoffDate.toISOString())
      .select('*');
    
    if (error) {
      console.error('Error eliminando registros antiguos:', error);
      return { deleted: 0, error, fileUrls: [] };
    }
    
    const deletedCount = deletedRecords?.length || 0;
    console.log(`✅ Eliminados ${deletedCount} registros de order_files`);
    
    // Mostrar detalles de los registros eliminados
    if (deletedRecords && deletedRecords.length > 0) {
      console.log('Registros eliminados:');
      deletedRecords.forEach(record => {
        const createdDate = new Date(record.created_at);
        const ageDays = Math.round((new Date() - createdDate) / (1000 * 60 * 60 * 24));
        console.log(`  - ID: ${record.id}, Archivo: ${record.file_url}, Edad: ${ageDays} días`);
      });
    }
    
    return { deleted: deletedCount, deletedRecords, fileUrls };
    
  } catch (error) {
    console.error('Error en cleanupOrderFilesTable:', error);
    return { deleted: 0, error, fileUrls: [] };
  }
}

// Función para listar archivos recursivamente en un bucket
async function listFilesRecursively(bucketName, path = '', allFiles = []) {
  try {
    const { data: items, error } = await supabase.storage
      .from(bucketName)
      .list(path, {
        limit: 1000,
        sortBy: { column: 'created_at', order: 'asc' }
      });
    
    if (error) {
      console.error(`Error listando en ${path}:`, error);
      return allFiles;
    }
    
    if (!items || items.length === 0) {
      return allFiles;
    }
    
    for (const item of items) {
      const fullPath = path ? `${path}/${item.name}` : item.name;
      
      // Si es un archivo (tiene id), agregarlo a la lista
      if (item.id) {
        allFiles.push({
          ...item,
          fullPath: fullPath
        });
        console.log(`📄 Archivo encontrado: ${fullPath} (${item.created_at})`);
      } else {
        // Si es una carpeta, explorar recursivamente
        console.log(`📁 Explorando carpeta: ${fullPath}`);
        await listFilesRecursively(bucketName, fullPath, allFiles);
      }
    }
    
    return allFiles;
  } catch (error) {
    console.error(`Error en listado recursivo de ${path}:`, error);
    return allFiles;
  }
}

// Función para eliminar archivos específicos de un bucket basado en URLs
async function cleanupBucket(bucketName, fileUrlsToDelete = []) {
  try {
    console.log(`🧹 Iniciando limpieza del bucket: ${bucketName}`);
    
    // Filtrar URLs que pertenecen a este bucket
    const bucketUrls = fileUrlsToDelete.filter(url => url.includes(`/${bucketName}/`));
    
    if (bucketUrls.length === 0) {
      console.log(`No hay archivos para eliminar en el bucket ${bucketName}`);
      return { deleted: 0, errors: 0 };
    }
    
    console.log(`Archivos a eliminar en ${bucketName}: ${bucketUrls.length}`);
    
    // Extraer las rutas de los archivos desde las URLs
    const filePaths = bucketUrls.map(url => {
      // Extraer la ruta después de /storage/v1/object/public/{bucketName}/
      const bucketPrefix = `/storage/v1/object/public/${bucketName}/`;
      const pathStart = url.indexOf(bucketPrefix);
      if (pathStart !== -1) {
        const filePath = url.substring(pathStart + bucketPrefix.length);
        console.log(`  - Eliminando: ${filePath}`);
        return filePath;
      }
      return null;
    }).filter(path => path !== null);
    
    if (filePaths.length === 0) {
      console.log(`No se pudieron extraer rutas válidas para ${bucketName}`);
      return { deleted: 0, errors: 0 };
    }
    
    // Eliminar archivos en lotes para evitar timeouts
    const batchSize = 50;
    let totalDeleted = 0;
    let totalErrors = 0;
    
    for (let i = 0; i < filePaths.length; i += batchSize) {
      const batch = filePaths.slice(i, i + batchSize);
      
      console.log(`Eliminando lote ${Math.floor(i/batchSize) + 1}: ${batch.length} archivos`);
      
      const { data: deleteData, error: deleteError } = await supabase.storage
        .from(bucketName)
        .remove(batch);
      
      if (deleteError) {
        console.error(`Error eliminando lote de archivos del bucket ${bucketName}:`, deleteError);
        totalErrors++;
      } else {
        const deletedInBatch = deleteData?.length || batch.length;
        totalDeleted += deletedInBatch;
        console.log(`✅ Eliminados ${deletedInBatch} archivos del lote`);
      }
      
      // Pequeña pausa entre lotes para evitar rate limiting
      if (i + batchSize < filePaths.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    console.log(`Total eliminados: ${totalDeleted} archivos del bucket ${bucketName}`);
    return { deleted: totalDeleted, errors: totalErrors };
    
  } catch (error) {
    console.error(`Error en limpieza del bucket ${bucketName}:`, error);
    return { deleted: 0, errors: 1 };
  }
}

// Handler principal del cron job
export default async function handler(req, res) {
  // Configurar timeout para cuentas Hobby (máximo 60 segundos)
  const timeoutId = setTimeout(() => {
    console.error('⏰ Timeout: El cronjob excedió el límite de 60 segundos');
    if (!res.headersSent) {
      res.status(408).json({
        success: false,
        error: 'Request timeout',
        message: 'El cronjob excedió el límite de tiempo permitido'
      });
    }
  }, 55000); // 55 segundos para dar margen

  try {
    // Verificar CRON_SECRET para seguridad (opcional pero recomendado)
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && req.headers.authorization !== `Bearer ${cronSecret}`) {
      console.warn('⚠️ Intento de acceso no autorizado al cronjob');
      clearTimeout(timeoutId);
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Token de autorización inválido'
      });
    }

    console.log('🚀 Iniciando limpieza automática de storage via cron job...');
    const startTime = new Date();
    
    // Configuración: archivos más antiguos que 120 días (4 meses) - PARA PRUEBAS
    const maxAgeDays = 120;
    
    // Verificar configuración de Supabase
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Configuración de Supabase incompleta');
      return res.status(500).json({
        success: false,
        error: 'Missing Supabase configuration'
      });
    }
    
    console.log('✅ Configuración de Supabase verificada');
    
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
    const detailedLogs = [];
    
    // Limpiar tabla order_files primero (para obtener las URLs de archivos)
    console.log('📋 Iniciando limpieza de base de datos...');
    const dbResult = await cleanupOrderFilesTable(maxAgeDays);
    results['order_files_table'] = dbResult;
    totalDeleted += dbResult.deleted;
    if (dbResult.error) totalErrors += 1;
    
    if (dbResult.deleted > 0) {
      detailedLogs.push(`Base de datos: ${dbResult.deleted} registros eliminados`);
    }
    if (dbResult.error) {
      detailedLogs.push(`Base de datos: 1 error`);
    }
    
    // Limpiar cada bucket usando las URLs obtenidas de la base de datos
    console.log('🗂️ Iniciando limpieza de buckets de storage...');
    for (const bucketName of bucketsToClean) {
      console.log(`\n--- Procesando bucket: ${bucketName} ---`);
      const result = await cleanupBucket(bucketName, dbResult.fileUrls || []);
      results[bucketName] = result;
      totalDeleted += result.deleted;
      totalErrors += result.errors;
      
      if (result.deleted > 0) {
        detailedLogs.push(`${bucketName}: ${result.deleted} archivos eliminados`);
      }
      if (result.errors > 0) {
        detailedLogs.push(`${bucketName}: ${result.errors} errores`);
      }
      
      // Pausa entre buckets para evitar rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    const endTime = new Date();
    const duration = endTime - startTime;
    
    const summary = {
      timestamp: startTime.toISOString(),
      duration_ms: duration,
      duration_formatted: `${Math.round(duration / 1000)}s`,
      total_files_deleted: totalDeleted,
      total_errors: totalErrors,
      buckets_processed: bucketsToClean.length,
      success_rate: totalErrors === 0 ? '100%' : `${Math.round(((bucketsToClean.length + 1 - totalErrors) / (bucketsToClean.length + 1)) * 100)}%`,
      detailed_logs: detailedLogs,
      results: results
    };
    
    if (totalErrors === 0) {
      console.log('✅ Limpieza automática completada exitosamente:', summary);
    } else {
      console.log('⚠️ Limpieza automática completada con errores:', summary);
    }
    
    const statusCode = totalErrors === 0 ? 200 : 207; // 207 = Multi-Status para éxito parcial
    
    // Limpiar timeout ya que completamos exitosamente
    clearTimeout(timeoutId);
    
    return res.status(statusCode).json({
      success: totalErrors === 0,
      message: totalErrors === 0 
        ? `Limpieza automática completada exitosamente. ${totalDeleted} elementos con más de ${maxAgeDays} días eliminados.`
        : `Limpieza automática completada con ${totalErrors} errores. ${totalDeleted} elementos con más de ${maxAgeDays} días eliminados.`,
      ...summary
    });
    
  } catch (error) {
    console.error('💥 Error crítico en limpieza automática de storage:', error);
    
    // Limpiar timeout en caso de error
    clearTimeout(timeoutId);
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// Ejecutar como script independiente
(async () => {
  console.log('🔧 Ejecutando cronjob de limpieza como script independiente...');
  
  // Crear objetos mock de req y res para simular el entorno de Vercel
  const mockReq = {};
  const mockRes = {
    status: (code) => ({
      json: (data) => {
        console.log(`\n📊 Resultado final (Status ${code}):`);
        console.log(JSON.stringify(data, null, 2));
        process.exit(code === 200 ? 0 : 1);
      }
    })
  };
  
  try {
    // Ejecutar el handler
    await handler(mockReq, mockRes);
  } catch (error) {
    console.error('💥 Error ejecutando el cronjob:', error);
    process.exit(1);
  }
})();