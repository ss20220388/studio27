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
            allowedHosts: ['27archviz.com',"api.27archviz.com","admin.27archviz.com"],
            proxy: {
                '/api': {
                    target: 'https://api.27archviz.com',
                    changeOrigin: true,
                    secure: false
                }
            }
        }
    }
});
