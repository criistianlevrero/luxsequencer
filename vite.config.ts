import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/marketplace-core-renderers': {
            target: 'http://localhost:4174',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/marketplace-core-renderers/, ''),
          },
        },
      },
      plugins: [react(), svgr()],
      optimizeDeps: {
        include: ['zustand', 'zustand/traditional', 'zustand/shallow', 'use-sync-external-store/shim/with-selector']
      },
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        // `dedupe` garantiza una sola copia de React aunque lux-ui traiga la suya
        // como devDependency. Con npm workspaces el hoisting ya deja una única
        // copia en la raíz, así que no hace falta apuntar a rutas concretas.
        dedupe: ['react', 'react-dom', '@headlessui/react'],
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
