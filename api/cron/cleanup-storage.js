import { cleanupAllBuckets, CLEANUP_INTERVALS } from '../utils/storageCleanup.js';

/**
 * Cron job para limpiar archivos expirados del storage de Supabase
 * Se ejecuta automáticamente según la configuración de Vercel
 * 
 * Para pruebas: elimina archivos después de 5 minutos
 * Para producción: cambiar a CLEANUP_INTERVALS.PRODUCTION (4 meses)
 */
export default async function handler(req, res) {
  // Verificar que sea una petición GET (requerido por Vercel Cron)
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'This endpoint only accepts GET requests' 
    });
  }

  // Verificar autorización solo si viene de fuera de Vercel
  // Vercel cron jobs no envían headers de autorización automáticamente
  const isVercelCron = req.headers['user-agent']?.includes('vercel') || 
                       req.headers['x-vercel-cron'] === '1' ||
                       !req.headers.authorization; // Si no hay auth header, asumimos que es Vercel
  
  if (!isVercelCron) {
    const authToken = req.headers.authorization;
    const expectedToken = process.env.CRON_SECRET_TOKEN;
    
    if (expectedToken && authToken !== `Bearer ${expectedToken}`) {
      console.warn('🚨 Unauthorized cron job attempt');
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Invalid or missing authorization token' 
      });
    }
  }

  try {
    console.log('⏰ Storage cleanup cron job started at:', new Date().toISOString());
    
    // Configurar el intervalo de limpieza
    // CAMBIAR A CLEANUP_INTERVALS.PRODUCTION PARA USAR 4 MESES
    const maxAgeMinutes = CLEANUP_INTERVALS.TEST; // 5 minutos para pruebas
    
    console.log(`🔧 Using cleanup interval: ${maxAgeMinutes} minutes`);
    
    // Ejecutar la limpieza
    const results = await cleanupAllBuckets(maxAgeMinutes);
    
    // Preparar respuesta
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      message: 'Storage cleanup completed successfully',
      config: {
        maxAgeMinutes,
        environment: maxAgeMinutes === CLEANUP_INTERVALS.TEST ? 'TEST' : 'PRODUCTION'
      },
      results: {
        totalFiles: results.totalFiles,
        totalExpired: results.totalExpired,
        totalDeleted: results.totalDeleted,
        totalErrors: results.totalErrors,
        buckets: Object.keys(results.buckets).map(bucket => ({
          name: bucket,
          ...results.buckets[bucket]
        }))
      },
      duration: {
        startTime: results.startTime,
        endTime: results.endTime,
        durationMs: new Date(results.endTime) - new Date(results.startTime)
      }
    };

    // Log del resultado
    if (results.totalDeleted > 0) {
      console.log(`✅ Cleanup successful: ${results.totalDeleted} files deleted`);
    } else {
      console.log('ℹ️ No files needed cleanup');
    }

    if (results.totalErrors > 0) {
      console.warn(`⚠️ ${results.totalErrors} errors occurred during cleanup`);
    }

    return res.status(200).json(response);

  } catch (error) {
    console.error('❌ Storage cleanup cron job failed:', error);
    
    return res.status(500).json({
      success: false,
      timestamp: new Date().toISOString(),
      message: 'Storage cleanup failed',
      error: {
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    });
  }
}

// Configuración del cron job para Vercel
export const config = {
  // Se ejecuta cada 5 minutos para pruebas
  // Para producción, cambiar a '0 0 */1 * *' (cada día)
  // o '0 0 */7 * *' (cada semana)
  runtime: 'nodejs18.x',
  maxDuration: 300 // 5 minutos máximo de ejecución
};

// Función para pruebas locales
if (process.env.NODE_ENV === 'development') {
  console.log('🧪 Running in development mode - you can test this function locally');
  console.log('📝 To test: POST to /api/cron/cleanup-storage');
  console.log('🔄 To change to production mode: set maxAgeMinutes = CLEANUP_INTERVALS.PRODUCTION');
}