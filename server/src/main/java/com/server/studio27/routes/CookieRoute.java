package com.server.studio27.routes;

import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletResponse;

@RestController
@RequestMapping("/api/cookies")
public class CookieRoute {

    @Value("${app.cookie.domain}")
    private String cookieDomain;

    @Value("${app.cookie.secure}")
    private boolean cookieSecure;

    @Value("${app.cookie.same-site}")
    private String sameSite;

    @PostMapping("/create-cookie-by-local-storage")
    public ResponseEntity<Map<String, Object>> createCookieFromLocalStorage(@RequestBody Map<String, String> request,
            HttpServletResponse response) {
        String deviceId = request.get("deviceId");
        System.out.println("Creating cookie with deviceId: " + deviceId);
        ResponseCookie cookie = ResponseCookie.from("deviceId", deviceId)
                .httpOnly(true)
                .secure(cookieSecure)
                .path("/")
                .domain(cookieDomain)
                .maxAge( 60*60)
                .sameSite(sameSite)
                .build();
                
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
        Map<String, Object> response1 = Map.of("message", "Cookie created successfully", "deviceId", deviceId);
        return ResponseEntity.ok(response1); 
    }
    

}
