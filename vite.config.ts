import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        /**
         * Split the heavy third-party libraries out of the main bundle.
         *
         * Each of these is used by only a handful of routes but was being
         * shipped to everyone on first load: jsPDF for invoice and profile
         * exports (4 files), Recharts for the dashboard charts (4), QR codes
         * for one page. Splitting them means the login screen no longer
         * downloads a PDF engine.
         */
        manualChunks: (id: string) => {
          if (!id.includes('node_modules')) return undefined
          // jsPDF is deliberately NOT named here. Every import of it is dynamic
          // (`await import('jspdf')` at each export button), and assigning it a
          // manual chunk pulls it back into the initial module graph — Vite then
          // preloads it in index.html, undoing the split.
          if (/[\\/]node_modules[\\/](recharts|d3-|victory|internmap)/.test(id)) return 'charts'
          if (/[\\/]node_modules[\\/](react-hook-form|@hookform|zod)/.test(id)) return 'forms'
          if (/[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom)[\\/]/.test(id)) {
            return 'react'
          }
          return undefined
        },
      },
    },
  },
  server: {
    port: 3000,
    strictPort: true,
    // Forward /api to the NestJS server (server/, port 4000). The browser then
    // sees same-origin requests, so no CORS in dev — and API_BASE_URL in
    // src/lib/api/client.ts can stay at its '/api' default with no .env needed.
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})
