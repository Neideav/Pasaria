import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { defineConfig, Plugin } from 'vite';

function syncDistPlugin(): Plugin {
  return {
    name: 'sync-dist-plugin',
    closeBundle() {
      try {
        const distDir = path.resolve('dist');
        const buildDir = path.resolve('public/build');
        if (fs.existsSync(distDir)) {
          fs.mkdirSync(buildDir, { recursive: true });
          fs.cpSync(distDir, buildDir, { recursive: true });
        }
      } catch (err) {
        console.warn('Sync build error:', err);
      }
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), syncDistPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname ?? '.'),
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      manifest: true,
    },
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
        },
        '/sanctum': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
        },
        '/up': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
        },
        '/storage': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
        },
      },
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
