import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: false },

      manifest: {
        name: 'Gestor Barber',
        short_name: 'GestorBarber',
        description: 'Painel de gestão para barbearias — agenda, clientes, financeiro e mais.',
        theme_color: '#111111',
        background_color: '#F7F3EC',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/app/dashboard',
        scope: '/',
        lang: 'pt-BR',
        categories: ['business', 'productivity'],
        icons: [
          { src: '/icons/pwa-64x64.png',            sizes: '64x64',   type: 'image/png' },
          { src: '/icons/pwa-192x192.png',           sizes: '192x192', type: 'image/png' },
          { src: '/icons/pwa-512x512.png',           sizes: '512x512', type: 'image/png' },
          { src: '/icons/maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },

      workbox: {
        // Cacheia os assets estáticos gerados pelo Vite
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],

        // Fallback para SPA — qualquer rota não encontrada retorna o index.html
        navigateFallback: '/index.html',

        // Não usa cache para rotas do master e API callbacks (dados sensíveis)
        navigateFallbackDenylist: [/^\/master/, /^\/api\//],

        runtimeCaching: [
          {
            // Chamadas ao Supabase PostgREST — NetworkFirst (dados sempre atuais)
            urlPattern: /^https:\/\/[a-z]+\.supabase\.co\/rest\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-rest',
              networkTimeoutSeconds: 8,
              expiration: { maxEntries: 100, maxAgeSeconds: 300 },
            },
          },
          {
            // Imagens externas (fotos de profissionais) — StaleWhileRevalidate
            urlPattern: /\.(png|jpg|jpeg|webp|svg)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'images',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
