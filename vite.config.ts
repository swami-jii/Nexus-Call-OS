import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      allowedHosts: true as true,
      cors: true,
      clearScreen: false,
      hmr: {
        overlay: false,
      },
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Permissions-Policy': 'microphone=*, camera=*, geolocation=*',
      },
      watch: process.env.DISABLE_HMR === 'true' ? null : {
        ignored: [
          '**/nexus_dev.db',
          '**/nexus_dev.db-wal',
          '**/nexus_dev.db-shm',
          '**/*.db',
          '**/*.db-wal',
          '**/*.db-shm',
          '**/backend/**',
          '**/uploads/**',
          '**/uploads/**/*',
          '**/.recycle_bin/**',
          '**/scratch/**',
          '**/temp/**',
          '**/*.log',
          '**/*.pdf',
          '**/.system_generated/**',
        ],
      },
      proxy: {
        '/auth': { target: 'http://127.0.0.1:8000', changeOrigin: true },
        '/api': { target: 'http://127.0.0.1:8000', changeOrigin: true, ws: true },
        '/download': { target: 'http://127.0.0.1:8000', changeOrigin: true },
        '/docs': { target: 'http://127.0.0.1:8000', changeOrigin: true },
        '/redoc': { target: 'http://127.0.0.1:8000', changeOrigin: true },
        '/openapi.json': { target: 'http://127.0.0.1:8000', changeOrigin: true },
        '/ws': { target: 'ws://127.0.0.1:8000', ws: true },

      },
    },

  };
});
