import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Blue Cup Bestellen',
        short_name: 'Blue Cup',
        description: 'Bestel je drankje bij Blue Cup',
        lang: 'nl',
        start_url: '/?mode=customer',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#0844a3',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
})