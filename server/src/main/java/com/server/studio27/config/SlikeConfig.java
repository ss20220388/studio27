package com.server.studio27.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

// Slike iz baze (/api/uploaded-images/towebp/1.webp -> folder slika/towebp/1.webp).
// Na serveru ih služi nginx (alias /assets/) pa zahtev ni ne stigne ovde; lokalno ih služi
// backend, iz istog foldera u koji upload-local upisuje (/assets = C:\assets na Windows-u).
@Configuration
public class SlikeConfig implements WebMvcConfigurer {

    @Value("${app.slike.folder:/assets/}")
    private String folder;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String putanja = folder.endsWith("/") ? folder : folder + "/";
        registry.addResourceHandler("/api/uploaded-images/**")
                .addResourceLocations("file:" + putanja)
                .setCachePeriod(3600);
    }
}
