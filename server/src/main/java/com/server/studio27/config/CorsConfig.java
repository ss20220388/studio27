package com.server.studio27.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {
    
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(
                        "http://studio27.rs",
                        "http://admin.studio27.rs",
                        "http://app.studio27.rs",
                        "http://dev.27archviz.com",
                        "http://app.dev.27archviz.com",
                        "http://admin.dev.27archviz.com",
                        "https://dev.27archviz.com",
                        "https://app.dev.27archviz.com",
                        "https://admin.dev.27archviz.com",
                        "https://27archviz.com",
                        "https://app.27archviz.com",
                        "https://admin.27archviz.com",
                        "http://27archviz.com",
                        "http://app.27archviz.com",
                        "http://admin.27archviz.com" 
                )
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