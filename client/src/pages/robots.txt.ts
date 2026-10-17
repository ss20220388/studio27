// robots.txt sa adresom sitemap-a sa domena iz .env fajla
import type { APIRoute } from "astro";
import { CLIENT_URL } from "../data/sajt";

export const GET: APIRoute = () =>
  new Response(
    `User-agent: *
Allow: /
Disallow: /pay
Disallow: /checkout/

Sitemap: ${CLIENT_URL}/sitemap.xml
`,
    { headers: { "Content-Type": "text/plain; charset=utf-8" } },
  );
