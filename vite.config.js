import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

 
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  define: {
    global: 'globalThis', // Use globalThis as a polyfill for the `global` variable
  },
  optimizeDeps: {
    include: ['global'], // Ensure Vite includes the global polyfill
  },
  server: {
    host:"172.30.6.12",
    port:"3059",
    build: {
      sourcemap: true, // Enable source maps
    },
    proxy:{
      "/api":{
        target:"http://172.30.6.12:3059",
        changeOrigin: true
      }
    }
  }
})