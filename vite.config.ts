import path from 'path'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), VitePWA({
    registerType: 'autoUpdate',
    manifest: {
      name: 'Cycles of Care · diario', short_name: 'Diario',
      start_url: './', scope: './', display: 'standalone',
      background_color: '#ffffff', theme_color: '#2f5d3a',
      icons: [
        { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: { navigateFallback: 'index.html', globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'] },
  })],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
})