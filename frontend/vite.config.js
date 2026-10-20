import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// `npm start` (scripts/dev.mjs) sets API_PROXY_TARGET so the browser calls /api on
// this dev server and Vite forwards it to the backend. Plain `npm run dev` is unchanged.
const apiProxyTarget = process.env.API_PROXY_TARGET

// The origins this dev server is reached at: the Host header, plus the public
// host when a forwarder (e.g. GitHub Codespaces) adds X-Forwarded-Host.
function ownOrigins(request) {
  const origins = []
  const { host } = request.headers
  if (host) origins.push(`http://${host}`, `https://${host}`)
  const forwardedHost = request.headers['x-forwarded-host']?.split(',')[0].trim()
  if (forwardedHost) origins.push(`https://${forwardedHost}`, `http://${forwardedHost}`)
  return origins
}

// The backend only allows localhost origins in development. A page served by
// this dev server calling its own /api is same-origin, so drop its Origin header
// (needed in Codespaces, whose origin isn't localhost). Requests from any other
// site keep their Origin, so the backend still rejects them.
function stripOwnOrigin(proxyRequest, request) {
  const { origin } = request.headers
  if (origin && ownOrigins(request).includes(origin)) proxyRequest.removeHeader('origin')
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    ...(apiProxyTarget && {
      proxy: {
        '/api': {
          target: apiProxyTarget,
          configure: (proxy) => proxy.on('proxyReq', stripOwnOrigin),
        },
      },
    }),
    // GitHub Codespaces serves forwarded ports on *.app.github.dev
    ...(process.env.CODESPACES && { allowedHosts: ['.app.github.dev'] }),
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('/katex/')) return 'katex'
          if (id.includes('/@dnd-kit/')) return 'drag-and-drop'
          if (id.includes('/lucide-react/')) return 'icons'
          if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/react-router')) return 'react-vendor'
          return 'vendor'
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.test.{js,jsx}'],
    css: false,
    restoreMocks: true,
  },
})
