import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

/**
 * The API and the uploaded files are served by the Express app in `server/`,
 * which runs on port 4000 during development. Proxying both prefixes keeps the
 * dev origin identical to production, so the session cookie and the relative
 * `/api` base URL behave the same in both.
 */
const backendProxy = {
  '/api': { target: 'http://localhost:4000', changeOrigin: true, secure: false },
  '/uploads': { target: 'http://localhost:4000', changeOrigin: true, secure: false },
};

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
      // HMR is disabled in AI Studio via the DISABLE_HMR env var, along with
      // file watching, which otherwise makes the preview flicker during edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: backendProxy,
    },
    preview: {
      host: '0.0.0.0',
      proxy: backendProxy,
    },
  };
});
