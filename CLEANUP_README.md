# Sistema de Limpieza Automática de Storage

Este sistema implementa una limpieza automática diaria de archivos en Supabase Storage para evitar llenar el límite gratuito de 1GB.

## 🚀 Características

- **Limpieza automática**: Se ejecuta todos los días a las 16:30 hora española (14:30 UTC)
- **Eliminación inteligente**: Solo elimina archivos con más de 24 horas de antigüedad
- **Múltiples buckets**: Limpia automáticamente `order-files`, `user-files` y `admin-files`
- **Seguridad**: Protegido con token de autenticación
- **Logging completo**: Registra todas las operaciones y estadísticas
- **Modo de prueba**: Incluye endpoint para simular limpieza sin eliminar archivos

## 📋 Configuración Requerida

### 1. Variables de Entorno

Añade estas variables a tu archivo `.env` y configúralas en Vercel:

```env
# Supabase Service Role Key (para operaciones del servidor)
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui

# Token de autenticación para limpieza (genera uno seguro)
CLEANUP_AUTH_TOKEN=tu_token_seguro_aqui
```

### 2. Obtener Service Role Key de Supabase

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Navega a **Settings** > **API**
3. Copia el **service_role key** (¡NO la anon key!)
4. Añádelo como `SUPABASE_SERVICE_ROLE_KEY`

### 3. Generar Token de Autenticación

Genera un token seguro para proteger la ruta de limpieza:

```bash
# Opción 1: Usar Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Opción 2: Usar OpenSSL
openssl rand -hex 32

# Opción 3: Generar online (usa un generador confiable)
```

### 4. Configurar Variables en Vercel

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Navega a **Settings** > **Environment Variables**
3. Añade las variables:
   - `SUPABASE_SERVICE_ROLE_KEY`: Tu service role key de Supabase
   - `CLEANUP_AUTH_TOKEN`: Tu token de autenticación generado

## 🔧 Archivos del Sistema

### `/api/cleanup-storage.js`
- **Función principal**: Elimina archivos antiguos de los buckets configurados
- **Método**: POST
- **Autenticación**: Requiere Bearer token
- **Programación**: Se ejecuta automáticamente vía cron job

### `/api/test-cleanup.js`
- **Función de prueba**: Simula la limpieza sin eliminar archivos
- **Método**: GET
- **Uso**: Para verificar qué archivos se eliminarían

### `/api/middleware/auth.js`
- **Middleware de seguridad**: Verifica tokens de autenticación
- **Logging**: Registra accesos a rutas protegidas

### `vercel.json`
- **Configuración del cron**: Define cuándo se ejecuta la limpieza
- **Programación actual**: `"30 14 * * *"` (14:30 UTC = 16:30 España)

## 🧪 Pruebas

### Probar Conexión y Simulación

```bash
# Hacer request GET al endpoint de prueba
curl https://tu-dominio.vercel.app/api/test-cleanup
```

### Ejecutar Limpieza Manual

```bash
# Hacer request POST con autenticación
curl -X POST https://tu-dominio.vercel.app/api/cleanup-storage \
  -H "Authorization: Bearer tu_cleanup_token_aqui"
```

## 📊 Monitoreo

### Logs de Vercel

1. Ve a tu proyecto en Vercel Dashboard
2. Navega a **Functions** > **View Function Logs**
3. Busca logs de `/api/cleanup-storage`

### Información de Logs

El sistema registra:
- Número de archivos eliminados por bucket
- Tiempo de ejecución
- Errores si ocurren
- Estadísticas de limpieza

## ⚙️ Configuración Avanzada

### Cambiar Horario de Ejecución

Edita el cron schedule en `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cleanup-storage",
      "schedule": "30 14 * * *"  // Formato: minuto hora día mes día_semana
    }
  ]
}
```

**Ejemplos de horarios:**
- `"0 12 * * *"` - Todos los días a las 12:00 UTC
- `"30 20 * * 0"` - Domingos a las 20:30 UTC
- `"0 */6 * * *"` - Cada 6 horas

### Cambiar Tiempo de Retención

Modifica la función `cleanupBucket` en `/api/cleanup-storage.js`:

```javascript
// Cambiar de 24 horas a otro valor
const result = await cleanupBucket(bucketName, 48); // 48 horas
```

### Añadir Más Buckets

Edita el array `bucketsToClean` en `/api/cleanup-storage.js`:

```javascript
const bucketsToClean = [
  'order-files',
  'user-files', 
  'admin-files',
  'nuevo-bucket'  // Añadir aquí
];
```

## 🔒 Seguridad

- **Token de autenticación**: Protege contra acceso no autorizado
- **Service Role Key**: Solo se usa en el servidor, nunca en el frontend
- **Logging**: Registra todos los accesos para auditoría
- **Validación**: Verifica configuración antes de ejecutar

## 🚨 Troubleshooting

### Error: "Missing Supabase configuration"
- Verifica que `SUPABASE_SERVICE_ROLE_KEY` esté configurado
- Asegúrate de usar el service role key, no el anon key

### Error: "Unauthorized"
- Verifica que `CLEANUP_AUTH_TOKEN` esté configurado
- Asegúrate de usar el formato `Bearer tu_token`

### Error: "permission denied for table"
- El service role key tiene permisos completos por defecto
- Verifica que el bucket existe en Supabase Storage

### Cron Job No Se Ejecuta
- Verifica que el proyecto esté desplegado en Vercel
- Los cron jobs solo funcionan en producción, no en desarrollo
- Revisa los logs de Functions en Vercel Dashboard

## 📈 Estadísticas Esperadas

Con uso normal del sistema:
- **Archivos por día**: 10-50 archivos subidos
- **Tamaño promedio**: 1-5 MB por archivo
- **Limpieza diaria**: Elimina archivos de hace 24+ horas
- **Storage usado**: Máximo ~100-200 MB (muy por debajo del límite de 1GB)

## 🔄 Mantenimiento

- **Revisión mensual**: Verificar logs de limpieza
- **Monitoreo de storage**: Revisar uso en Supabase Dashboard
- **Actualización de tokens**: Rotar tokens de autenticación periódicamente
- **Backup importante**: Los archivos eliminados no se pueden recuperar

---

**⚠️ Importante**: Los archivos eliminados por este sistema no se pueden recuperar. Asegúrate de que 24 horas es suficiente tiempo para que los usuarios descarguen sus archivos.