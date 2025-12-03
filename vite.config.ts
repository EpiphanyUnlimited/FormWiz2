import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Use (process as any) to avoid type errors in environments without @types/node
  const cwd = (process as any).cwd();
  const env = loadEnv(mode, cwd, '');
  
  return {
    plugins: [react()],
    build: {
      outDir: 'dist/client', // Updated to match netlify.toml publish directory
      sourcemap: true
    },
    // Explicitly define process.env.API_KEY for the client build
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    }
  };
});