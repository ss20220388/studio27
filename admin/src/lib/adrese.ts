// Sve adrese se čitaju isključivo iz .env fajla (lokalno studio27.rs, na serveru produkcijske).
// Nema podrazumevanih vrednosti u kodu: ako promenljiva nedostaje, build prijavljuje grešku
// (provera je u astro.config.mjs), pa se nikad ne gađa pogrešan server.
const bezKosaCrte = (url: string | undefined) => (url ?? "").replace(/\/+$/, "");

export const API_URL = bezKosaCrte(import.meta.env.PUBLIC_API_URL);
export const CLIENT_URL = bezKosaCrte(import.meta.env.PUBLIC_CLIENT_URL);
export const APP_URL = bezKosaCrte(import.meta.env.PUBLIC_APP_URL);
export const ADMIN_URL = bezKosaCrte(import.meta.env.PUBLIC_ADMIN_URL);
