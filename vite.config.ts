/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'icons/*.png', 'brand/*.svg'],
      manifest: {
        name: 'Nook', short_name: 'Nook', description: 'Your own quiet corner for uni life',
        start_url: '/', scope: '/', display: 'standalone',
        theme_color: '#1B2638', background_color: '#1B2638', orientation: 'any',
        shortcuts: [
          { name: 'Start focus', short_name: 'Focus', url: '/study', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
          { name: 'Tasks', short_name: 'Tasks', url: '/tasks', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
          { name: 'Languages', short_name: 'Words', url: '/languages', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
        ],
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,svg,png,woff2,woff}'], navigateFallback: '/index.html' },
    }),
  ],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  test: { environment: 'jsdom', globals: true, setupFiles: ['./src/test/setup.ts'], css: false },
})
