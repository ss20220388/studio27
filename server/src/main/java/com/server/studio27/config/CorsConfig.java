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
                        "http://localhost:3000",
                        "http://localhost:4000",
                        "http://localhost:5000",
                        "http://localhost:8080",
                        "http://dev.27archviz.com",
                        "http://admin.dev.27archviz.com",
                        "http://app.dev.27archviz.com"
                )
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}