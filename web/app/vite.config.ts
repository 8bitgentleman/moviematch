import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import * as os from 'os';

const { VERSION = 'dev' } = process.env;

console.log(`Building version ${VERSION}`);

const ip = Object.values(os.networkInterfaces())
  .flat()
  .find(
    (_) => _ && _.family === 'IPv4' && !_.internal && _.address.startsWith('192'),
  );

const rootPath = `http://${ip?.address ?? 'localhost'}:8000`;
const apiWsUri = VERSION === 'dev'
  ? `ws://${ip?.address ?? 'localhost'}:8000/api/ws`
  : undefined;

export default defineConfig({
  plugins: [
    react({
      // Use automatic JSX runtime for React 18
      jsxRuntime: 'automatic',
      // Enable fast refresh for React 18
      fastRefresh: true,
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/favicon.ico', 'icons/icon.svg', 'icons/icon-180.png'],
      manifest: {
        name: 'MovieMatch',
        short_name: 'MovieMatch',
        description: 'Find movies you both like',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable any'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\./i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/image\.tmdb\.org\//i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'tmdb-images',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  publicDir: 'static',
  define: {
    'import.meta.env.VITE_VERSION': JSON.stringify(VERSION),
    'import.meta.env.VITE_API_URI': JSON.stringify(apiWsUri),
    'import.meta.env.VITE_ROOT_PATH': JSON.stringify(rootPath),
  },
  server: {
    port: 8080,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        ws: true,
      }
    }
  },
  build: {
    outDir: 'build',
    sourcemap: VERSION === 'dev',
    target: 'es2018',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'zustand'],
        }
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'zustand']
  }
});
