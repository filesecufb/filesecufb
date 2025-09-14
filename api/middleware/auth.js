// Middleware de autenticación para rutas protegidas

/**
 * Verifica el token de autenticación para rutas administrativas
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
export function verifyCleanupAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const expectedToken = process.env.CLEANUP_AUTH_TOKEN;
    
    // Verificar que el token esté configurado
    if (!expectedToken) {
      console.error('CLEANUP_AUTH_TOKEN no está configurado');
      return res.status(500).json({ 
        error: 'Server configuration error',
        message: 'Authentication token not configured'
      });
    }
    
    // Verificar que el header de autorización esté presente
    if (!authHeader) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Authorization header required'
      });
    }
    
    // Verificar formato del token
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Invalid authorization format. Use Bearer token'
      });
    }
    
    const token = authHeader.substring(7); // Remover 'Bearer '
    
    // Verificar que el token coincida
    if (token !== expectedToken) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Invalid token'
      });
    }
    
    // Token válido, continuar
    next();
    
  } catch (error) {
    console.error('Error en verificación de autenticación:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Authentication verification failed'
    });
  }
}

/**
 * Middleware para logging de requests a rutas protegidas
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
export function logProtectedRequest(req, res, next) {
  const timestamp = new Date().toISOString();
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';
  
  console.log(`[${timestamp}] Protected route access:`, {
    method: req.method,
    url: req.url,
    ip: ip,
    userAgent: userAgent
  });
  
  next();
}

/**
 * Middleware combinado para rutas de limpieza
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
export function cleanupAuthMiddleware(req, res, next) {
  // Primero hacer logging
  logProtectedRequest(req, res, () => {
    // Luego verificar autenticación
    verifyCleanupAuth(req, res, next);
  });
}

export default {
  verifyCleanupAuth,
  logProtectedRequest,
  cleanupAuthMiddleware
};