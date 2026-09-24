//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

//-----------------------------------------------------\\
//                     VITE CONFIG
//-----------------------------------------------------\\

export default defineConfig({
  plugins: [react()],

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
