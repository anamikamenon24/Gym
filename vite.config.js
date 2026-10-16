import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// /api is served by server/dev-api.js locally and by Vercel Functions in production.
const proxy = { '/api': `http://localhost:${process.env.API_PORT || 3001}` }

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true, open: false, proxy },
  preview: { proxy },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          motion: ['framer-motion'], // canvas-confetti stays with the Live Workout chunk
        },
      },
    },
  },
})
