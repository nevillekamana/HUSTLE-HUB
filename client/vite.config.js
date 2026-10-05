//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

//-----------------------------------------------------\\
//                     VITE CONFIG
//-----------------------------------------------------\\

export default defineConfig({
  //tailwind compiles to a plain stylesheet at build time, so nothing injects a
  //style tag at runtime that the strict content security policy would block
  plugins: [react(), tailwindcss()],

  //@ points at src so imports read the same from any depth
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },

  //the client only ever calls relative /api paths, in development the proxy
  //forwards them to the express api so the browser never meets the self signed
  //certificate or a cross origin request
  //secure false only relaxes the proxy's own trust of our local certificate,
  //in production the api serves the built client from the same origin instead
  server: {
    proxy: {
      '/api': { target: 'https://localhost:5000', changeOrigin: true, secure: false }
    }
  },

  //vitest shares this config, role 4 writes the tests against it
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    globals: true
  }
});
