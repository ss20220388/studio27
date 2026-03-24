package com.server.studio27.routes;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@RestController
@RequestMapping("/api/cookie")
public class CookieRoute {

    @Value("${app.cookie.domain}")
    private String cookieDomain;

    @Value("${app.cookie.secure}")
    private boolean cookieSecure;

    @Value("${app.cookie.same-site}")
    private String sameSite;

    @GetMapping("/deviceId")
    public ResponseEntity<?> getOrCreateDeviceId(HttpServletRequest request, HttpServletResponse response) {
        Cookie[] cookies = request.getCookies();
        String existingDeviceId = null;

        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if ("deviceId".equals(cookie.getName())) {
                    existingDeviceId = cookie.getValue();
                    break;
                }
            }
        }

        if (existingDeviceId != null) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Cookie već postoji");
            error.put("deviceId", existingDeviceId);
            return ResponseEntity.status(409).body(error);
        }

        String newDeviceId = UUID.randomUUID().toString();

        ResponseCookie deviceCookie = ResponseCookie.from("deviceId", newDeviceId)
                .httpOnly(true)
                .secure(cookieSecure)
                .path("/")
                .domain(cookieDomain)
                .maxAge(7 * 24 * 60 * 60)
                .sameSite(sameSite)
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, deviceCookie.toString());

        Map<String, String> success = new HashMap<>();
        success.put("message", "deviceId cookie kreiran");
        success.put("deviceId", newDeviceId);
        return ResponseEntity.ok(success);
    }
}
