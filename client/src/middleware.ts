// www.27archviz.com -> 27archviz.com (301), da Google ne vidi dva sajta sa istim sadržajem
import { defineMiddleware } from "astro:middleware";
import { CLIENT_URL } from "./data/sajt";

const glavniDomen = new URL(CLIENT_URL).host;

export const onRequest = defineMiddleware((context, next) => {
  const domen = context.request.headers.get("x-forwarded-host") || context.request.headers.get("host") || "";
  if (domen === `www.${glavniDomen}`) {
    return context.redirect(`${CLIENT_URL}${context.url.pathname}${context.url.search}`, 301);
  }
  return next();
});
