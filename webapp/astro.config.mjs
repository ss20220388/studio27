// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  integrations: [react()],

  vite: {
    plugins: [tailwindcss()],
    server: {
      allowedHosts: [
         'app.studio27.rs','app.dev.27archviz.com',"api.27archviz.com","admin.27archviz.com","https://app.27archviz.com","http://app.27archviz.com"
      ],
      proxy: {
        '/api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
          secure: false
        }
      }
    }
  }
});