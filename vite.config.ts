import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
