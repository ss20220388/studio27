package com.server.studio27.config;

import java.net.URI;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.Set;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    // Adrese iz .env fajla servera (PUBLIC_CLIENT_URL, PUBLIC_APP_URL, PUBLIC_ADMIN_URL)
    @Value("${app.frontend.url}")
    private String clientUrl;

    @Value("${app.app.url}")
    private String appUrl;

    @Value("${app.admin.url}")
    private String adminUrl;

    // Opciono: dodatni domeni odvojeni zarezom (APP_CORS_DODATNI)
    @Value("${app.cors.dodatni:}")
    private String dodatni;

    private String[] dozvoljeniDomeni() {
        Set<String> domeni = new LinkedHashSet<>();
        for (String url : new String[] { clientUrl, appUrl, adminUrl }) {
            String cist = bezKoseCrte(url);
            if (cist.isEmpty()) continue;
            domeni.add(cist);
            // sajt je dostupan i sa www. ispred domena
            try {
                URI uri = URI.create(cist);
                if (uri.getHost() != null && !uri.getHost().startsWith("www.") && cist.equals(bezKoseCrte(clientUrl))) {
                    domeni.add(uri.getScheme() + "://www." + uri.getHost() + (uri.getPort() > 0 ? ":" + uri.getPort() : ""));
                }
            } catch (IllegalArgumentException ignored) {
            }
        }
        Arrays.stream(dodatni.split(","))
                .map(CorsConfig::bezKoseCrte)
                .filter(d -> !d.isEmpty())
                .forEach(domeni::add);
        return domeni.toArray(new String[0]);
    }

    private static String bezKoseCrte(String url) {
        return url == null ? "" : url.trim().replaceAll("/+$", "");
    }
    
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(dozvoljeniDomeni())
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);

        // Banka (Raiffeisen gateway) pogadja ove rute direktno — kao
        // cross-site form POST (notify/success/failure/return) ili
        // server-to-server (notify) — NIKAD sa naseg frontenda. Bankin
        // domen ne moze i ne sme da bude na "allowedOrigins" listi iznad,
        // pa te rute moraju da imaju SVOJ, permisivan CORS config; ove
        // tacnije putanje (bez "**") su specificnije od "/api/**" i zato
        // ih Spring bira umesto opsteg mappinga iznad za bas ove URL-ove.
        // allowCredentials namerno izostavljen (nije potreban, kolacici
        // banke nas ne zanimaju), sto dozvoljava allowedOriginPatterns("*").
        registry.addMapping("/api/payment/notify")
                .allowedOriginPatterns("*")
                .allowedMethods("GET", "POST", "OPTIONS")
                .allowedHeaders("*");

        registry.addMapping("/api/payment/success")
                .allowedOriginPatterns("*")
                .allowedMethods("GET", "POST", "OPTIONS")
                .allowedHeaders("*");

        registry.addMapping("/api/payment/failure")
                .allowedOriginPatterns("*")
                .allowedMethods("GET", "POST", "OPTIONS")
                .allowedHeaders("*");

        registry.addMapping("/api/payment/return")
                .allowedOriginPatterns("*")
                .allowedMethods("GET", "POST", "OPTIONS")
                .allowedHeaders("*");
    }
}