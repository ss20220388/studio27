// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import node from "@astrojs/node";
import sitemap from "@astrojs/sitemap";
// https://astro.build/config
export default defineConfig({
    output: 'server',
    integrations: [react(), sitemap()],
    adapter: node({
    mode: "standalone"
    }),
    vite: {
        plugins: [tailwindcss()],
        server: {
            allowedHosts: ['27archviz.com',"api.27archviz.com","admin.27archviz.com","studio27.rs"],
            proxy: {
                '/api': {
                    target: 'https://api.dev.27archviz.com',
                    changeOrigin: true,
                    secure: false
                }
            }
        }
    }
});
