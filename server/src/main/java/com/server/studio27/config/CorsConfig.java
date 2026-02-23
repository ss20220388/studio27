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
                        "http://studio27.rs:3000",
                        "http://admin.studio27.rs",
                        "http://admin.studio27.rs:4000",
                        "http://app.studio27.rs",
                        "http://app.studio27.rs:5000",
                        "http://localhost:3000",
                        "http://localhost:4000",
                        "http://localhost:5000",
                        "http://localhost:8080"
                )
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}