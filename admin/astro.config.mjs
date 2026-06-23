// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  vite: {
    plugins: [tailwindcss()],
    server: {
      allowedHosts: [
        'admin.studio27.rs',"admin.dev.27archviz.com","http://api.studio27.rs/oauth2/authorization/google","admin.27archviz.com","http://admin.27archviz.com","https://admin.27archviz.com"
      ],
      proxy: {
        '/api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
          secure: false
        }
      }
    },
  },

  integrations: [react()]
});