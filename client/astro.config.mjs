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
            allowedHosts: ['studio27.rs','dev.27archviz.com'],
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
