package com.server.studio27.auth;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletResponse;

@RestController
@RequestMapping("/api.cookies")
public class CookieController {
    @GetMapping("/create-deviceId")
    public Map<String, Object> getDeviceId(Authentication authentication, HttpServletResponse response) {
        try {
            
            String deviceId = UUID.randomUUID().toString();
            ResponseCookie cookie = ResponseCookie.from("deviceId", deviceId)
                    .httpOnly(true)
                    .secure(true)
                    .path("/")
                    .domain(".studio27.rs")
                    .maxAge(200 * 365 * 24 * 60 * 60)
                    .sameSite("Lax")
                    .build();

            response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
            Map<String, Object> responseMap = new HashMap<>();
            responseMap.put("deviceId", deviceId);
            return responseMap;
        } catch (Exception e) {
            Map<String, Object> errorMap = new HashMap<>();
            errorMap.put("error", "nesupesno dodat deviceId cookie");
            return errorMap;
        }
    }

}
