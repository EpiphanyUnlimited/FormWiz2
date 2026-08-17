import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      rollupOptions: {
        output: {
          // Split stable vendor code from app code so returning visitors
          // hit cache for the heavy libraries (faster first paint = better
          // conversion on the landing/pricing pages).
          manualChunks: {
            react: ['react', 'react-dom'],
            pdf: ['pdf-lib'],
            icons: ['lucide-react'],
            identity: ['netlify-identity-widget'],
          },
        },
      },
    }
    // NOTE: no `define` for API keys — Gemini calls go through
    // netlify/functions/analyze so the key never reaches the client bundle.
  };
});