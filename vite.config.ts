import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
      sourcemap: true
    }
    // NOTE: no `define` for API keys — Gemini calls go through
    // netlify/functions/analyze so the key never reaches the client bundle.
  };
});