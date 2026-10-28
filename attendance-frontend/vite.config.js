import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,            // lets other devices connect
    allowedHosts: true,    // lets forwarded/tunnel URLs through
    proxy: {
      '/api': 'http://localhost:8471',   // sends API calls to Spring Boot
    },
  },
})
