# Sistema de Gestión de Servicios

Un sistema completo de gestión de servicios con panel de administración y cliente, desarrollado con React, TypeScript y Vite. **Proyecto preparado para nueva implementación de backend.**

## Características

- 🎨 **Interfaz Completa** - Páginas de login, registro, dashboards y gestión
- 👥 **Panel de Cliente** - UI para gestión de perfil, pedidos, facturas y archivos
- 🛠️ **Panel de Administración** - UI para gestión de usuarios, servicios y pedidos
- 📱 **Diseño Responsivo** - Interfaz moderna con Tailwind CSS
- 🔧 **Listo para Backend** - Estructura preparada para nueva implementación
- 🌐 **Internacionalización** - Soporte multiidioma con i18next

## Tecnologías Utilizadas

- **Frontend**: React 18, TypeScript, Vite
- **Estilos**: Tailwind CSS
- **Backend**: Pendiente de implementación
- **Iconos**: Lucide React
- **Notificaciones**: React Hot Toast

## Instalación

### Prerrequisitos

- Node.js 18+ 
- npm o pnpm

### Configuración

1. **Clonar el repositorio**
   ```bash
   git clone <url-del-repositorio>
   cd <nombre-del-proyecto>
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   # o
   pnpm install
   ```

3. **Ejecutar en desarrollo**
   ```bash
   npm run dev
   # o
   pnpm dev
   ```

### Estado Actual

- ✅ **Frontend completo** - Todas las páginas y componentes UI implementados
- ⏳ **Backend pendiente** - Lógica de autenticación y base de datos por implementar
- 🎯 **Listo para integración** - Estructura preparada para nueva implementación de backend

## Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
├── hooks/              # Hooks personalizados (preparados para backend)
├── pages/              # Páginas de la aplicación
└── utils/              # Utilidades
```

## Funcionalidades (UI Implementada)

### Panel de Cliente
- Interfaz de gestión de perfil personal
- Interfaz de visualización de pedidos
- Interfaz de descarga de facturas
- Interfaz de subida y gestión de archivos

### Panel de Administración
- Interfaz de gestión de usuarios
- Interfaz de configuración de servicios
- Interfaz de gestión de pedidos
- Interfaz de detalles de clientes

### Páginas Adicionales
- Login y registro (UI completa)
- Página de servicios
- Página de contacto
- Políticas legales (términos, privacidad, etc.)

## Scripts Disponibles

- `npm run dev` - Servidor de desarrollo
- `npm run build` - Construir para producción
- `npm run preview` - Vista previa de la build
- `npm run check` - Verificación de TypeScript

## Contribuir

1. Fork el proyecto
2. Crear rama para feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abrir Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT.