import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'spa-fallback',
      configurePreviewServer(server) {
        server.middlewares.use((req, res, next) => {
          const path = req.url?.split('?')[0] ?? ''
          const hasExtension = path.includes('.') && !path.endsWith('.html')
          if (!hasExtension && path !== '/' && !path.startsWith('/@')) {
            req.url = '/index.html'
          }
          next()
        })
      },
    },
  ],
})
