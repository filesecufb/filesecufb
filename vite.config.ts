import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";

// https://vite.dev/config/
export default defineConfig({
  build: {
    sourcemap: 'hidden',
    // Optimización de chunks
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          i18n: ['react-i18next', 'i18next'],
          supabase: ['@supabase/supabase-js'],
          ui: ['lucide-react', 'react-hot-toast']
        }
      }
    },
    // Minificación mejorada
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.trace']
      }
    },
    // Optimización de assets
    assetsInlineLimit: 4096,
    chunkSizeWarningLimit: 1000
  },
  // Optimizaciones de servidor de desarrollo
  server: {
    hmr: {
      overlay: false
    }
  },
  // Preload de módulos críticos
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'react-i18next']
  },
  plugins: [
    react({
      babel: {
        plugins: [
          'react-dev-locator',
        ],
      },
    }),
 
    tsconfigPaths()
  ],
})
