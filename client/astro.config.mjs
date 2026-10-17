import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import node from "@astrojs/node";
import { loadEnv } from "vite";

// Sve adrese dolaze iz .env fajla (lokalno studio27.rs, na serveru produkcijske adrese).
// Ako neka nedostaje, build se prekida sa jasnom porukom umesto da aplikacija gađa pogrešan server.
const env = loadEnv(process.env.NODE_ENV === "production" ? "production" : "development", process.cwd(), "");
const OBAVEZNE = ["PUBLIC_API_URL", "PUBLIC_CLIENT_URL", "PUBLIC_APP_URL", "PUBLIC_ADMIN_URL"];
const nedostaju = OBAVEZNE.filter((ime) => !(env[ime] || process.env[ime]));
if (nedostaju.length) {
  throw new Error(`Nedostaju promenljive u .env fajlu: ${nedostaju.join(", ")} (pogledaj .env.example)`);
}
/** @param {string} ime */
const adresa = (ime) => (env[ime] || process.env[ime]).replace(/\/+$/, "");
/** @param {string} ime */
const domen = (ime) => new URL(adresa(ime)).hostname;

// https://astro.build/config
export default defineConfig({
  output: "server",
  integrations: [react()],
  // kanonski linkovi i SEO koriste adresu sajta iz .env
  site: adresa("PUBLIC_CLIENT_URL"),
  adapter: node({
    mode: "standalone",
  }),
  build: {
    inlineStylesheets: "always",
  },
  vite: {
    plugins: [tailwindcss()],
    server: {
      allowedHosts: [domen("PUBLIC_CLIENT_URL")],
      proxy: {
        "/api": {
          target: adresa("PUBLIC_API_URL"),
          changeOrigin: true,
          secure: false,
        },
      },
    },
  },
});
