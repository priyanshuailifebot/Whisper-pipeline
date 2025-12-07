import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Helper to remove trailing slash
const trimSlash = (value = '') => value.replace(/\/$/, '')

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const DEFAULT_AVATAR_BASE = 'https://5cq19q8hzqqdxa-8010.proxy.runpod.net'
  const DEFAULT_BACKEND_BASE = 'http://localhost:5000'

  const avatarBaseUrl = trimSlash(env.VITE_AVATAR_BASE_URL || DEFAULT_AVATAR_BASE)
  const backendBaseUrl = trimSlash(env.VITE_BACKEND_BASE_URL || DEFAULT_BACKEND_BASE)

  return {
    plugins: [react()],
    server: {

      port: 3000,
      host: '0.0.0.0',
      allowedHosts: ['jo1i6asdq8i3rl-8010.proxy.runpod.net',
        '0efad785e91a.ngrok-free.app',
        'eaef737974d8.ngrok-free.app',
        'ffccf7ea48af.ngrok-free.app',
        '*.ngrok-free.app',
        '*.ngrok.io',
        '*.ngrok.app',
        '*.proxy.runpod.net'
      ],
      proxy: {
        '/api': {
          target: backendBaseUrl,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        },
        '/human': {
          target: avatarBaseUrl,
          changeOrigin: true,
          secure: false
        },
        '/is_speaking': {
          target: avatarBaseUrl,
          changeOrigin: true,
          secure: false
        },
        '/offer': {
          target: avatarBaseUrl,
          changeOrigin: true,
          secure: false
        }
      }
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false
    }
  }
})
