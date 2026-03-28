import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

// Read API key directly from .env — no loadEnv ambiguity
const envContent = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf-8') : ''
const ANTHROPIC_API_KEY = envContent.match(/ANTHROPIC_API_KEY=(.+)/)?.[1]?.trim() ?? ''

console.log('[vite.config] Anthropic key loaded:', ANTHROPIC_API_KEY ? `${ANTHROPIC_API_KEY.slice(0, 16)}…` : 'MISSING')

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['@magenta/music']
  },
  define: {
    global: 'globalThis'
  },
  server: {
    proxy: {
      '/api/claude': {
        target: 'https://api.anthropic.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/claude/, '/v1/messages'),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('x-api-key', ANTHROPIC_API_KEY)
            proxyReq.setHeader('anthropic-version', '2023-06-01')
            proxyReq.setHeader('anthropic-dangerous-direct-browser-access', 'true')
          })
        }
      }
    }
  }
})
