import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      // Rend la clé Groq accessible via import.meta.env.VITE_GROQ_API_KEY
      'import.meta.env.VITE_GROQ_API_KEY': JSON.stringify(
        env.VITE_GROQ_API_KEY || env.GROQ_API_KEY || ''
      ),
      'import.meta.env.VITE_ADMIN_CODE': JSON.stringify(
        env.VITE_ADMIN_CODE || '2027'
      ),
    },
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'motion'],
            utils: ['jspdf', 'html2canvas', 'lucide-react'],
            ai: ['groq-sdk']
          }
        }
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
