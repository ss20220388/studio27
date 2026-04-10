package com.server.studio27.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.server.studio27.auth.JwtAuthFilter;
import com.server.studio27.auth.JwtService;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

        @Value("${app.cookie.domain}")
        private String cookieDomain;

        @Value("${app.cookie.secure}")
        private boolean cookieSecure;

        @Value("${app.cookie.same-site}")
        private String sameSite;

        @Value("${app.frontend.url}")
        private String frontendUrl;

        private final JwtAuthFilter jwtAuthFilter;
        private final JwtService jwtService;
        private final UserDetailsService userDetailsService;
        private final JdbcTemplate jdbcTemplate;

        public SecurityConfig(
                        JwtAuthFilter jwtAuthFilter,
                        JwtService jwtService,
                        UserDetailsService userDetailsService,
                        JdbcTemplate jdbcTemplate) {
                this.jwtAuthFilter = jwtAuthFilter;
                this.jwtService = jwtService;
                this.userDetailsService = userDetailsService;
                this.jdbcTemplate = jdbcTemplate;

        }

        @Bean
        public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
                http
                                .cors(cors -> {
                                })
                                .csrf(csrf -> csrf.disable())
                                .sessionManagement(session -> session
                                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                                .authorizeHttpRequests(auth -> auth
                                                .requestMatchers("/api/auth/login").permitAll()
                                                .requestMatchers("/api/auth/logout").permitAll()
                                                .requestMatchers("/api/auth/register-user").permitAll()
                                                .requestMatchers("/api/auth/register-admin").permitAll()
                                                .requestMatchers("/api/auth/refresh").permitAll()
                                                .requestMatchers("/api/auth/access-token").permitAll()
                                                .requestMatchers("/api/auth/me").permitAll()
                                                .requestMatchers("/api/auth/oauth2").permitAll()
                                                .requestMatchers("/api/auth/send-otp").permitAll()
                                                .requestMatchers("/api/auth/verify-otp-and-reset").permitAll()
                                                .requestMatchers("/login/**").permitAll()
                                                .requestMatchers("/oauth2/authorization/google").permitAll()
                                                .requestMatchers("/oauth2/**").permitAll()
                                                .requestMatchers("/login/oauth2/**").permitAll()
                                                .requestMatchers("/api/auth/**").authenticated()
                                                .requestMatchers("/api/kursevi/**").permitAll()
                                                .requestMatchers("/api/kursevi-sa-lekcijama").permitAll()
                                                .requestMatchers("/api/media/**").permitAll()
                                                .requestMatchers("/api/recenzije").permitAll()
                                                .requestMatchers("/api/unlock-admin").permitAll()
                                                .requestMatchers("/api/video/stream").permitAll()
                                                .requestMatchers("/api/video/stream-protected").permitAll()
                                                .requestMatchers("/api/radovi").permitAll()
                                                .requestMatchers("/api/upload-hls-hetzner").permitAll()
                                                .requestMatchers("/api/kursevi/{id}").permitAll()
                                                .requestMatchers("/api/progress-chart/**").permitAll()
                                                .requestMatchers("/api/cookies/create-cookie-by-local-storage").permitAll()

                                                .anyRequest().authenticated())
                                .oauth2Login(oauth -> oauth
                                                .successHandler((request, response, authentication) -> {
                                                        try {
                                                                System.out.println("USAO U GOOGLE SUCCESS HANDLER");

                                                                OAuth2User oauthUser = (OAuth2User) authentication
                                                                                .getPrincipal();
                                                                String email = oauthUser.getAttribute("email");

                                                                // Čitaj deviceId iz cookie-ja
                                                                String deviceId = null;
                                                                jakarta.servlet.http.Cookie[] cookies = request
                                                                                .getCookies();
                                                                if (cookies != null) {
                                                                        for (jakarta.servlet.http.Cookie cookie : cookies) {
                                                                                if ("deviceId".equals(
                                                                                                cookie.getName())) {
                                                                                        deviceId = cookie.getValue();
                                                                                        break;
                                                                                }
                                                                        }
                                                                }
                                                                System.out.println(
                                                                                "Device ID from cookie: " + deviceId);

                                                                // Ako nema deviceId - odbij
                                                                if (deviceId == null || deviceId.isEmpty()) {
                                                                        ResponseCookie errorCookie = ResponseCookie
                                                                                        .from("losGmail",
                                                                                                        "missing_device_id")
                                                                                        .httpOnly(false)
                                                                                        .secure(cookieSecure)
                                                                                        .path("/")
                                                                                        .maxAge(10)
                                                                                        .sameSite(sameSite)
                                                                                        .domain(cookieDomain)
                                                                                        .build();
                                                                        response.addHeader(HttpHeaders.SET_COOKIE,
                                                                                        errorCookie.toString());
                                                                        response.sendRedirect(frontendUrl);
                                                                        return;
                                                                }

                                                                // Proveri da li korisnik postoji
                                                                Integer count = jdbcTemplate.queryForObject(
                                                                                "SELECT COUNT(*) FROM user WHERE email = ?",
                                                                                Integer.class,
                                                                                email);

                                                                if (count == null || count == 0) {
                                                                        // Novi korisnik - kreiraj sa ovim deviceId
                                                                        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
                                                                        String randomPassword = passwordEncoder.encode(
                                                                                        java.util.UUID.randomUUID()
                                                                                                        .toString());

                                                                        jdbcTemplate.update(
                                                                                        "INSERT INTO user (email, password, deviceId) VALUES (?, ?, ?)",
                                                                                        email,
                                                                                        randomPassword,
                                                                                        deviceId);

                                                                        Integer userId = jdbcTemplate.queryForObject(
                                                                                        "SELECT userId FROM user WHERE email = ?",
                                                                                        Integer.class,
                                                                                        email);

                                                                        jdbcTemplate.update(
                                                                                        "INSERT INTO student (studentId, ime, prezime, brojTelefona) VALUES (?, ?, ?, ?)",
                                                                                        userId,
                                                                                        oauthUser.getAttribute(
                                                                                                        "given_name"),
                                                                                        oauthUser.getAttribute(
                                                                                                        "family_name"),
                                                                                        "");
                                                                        System.out.println(
                                                                                        "New user created with deviceId: "
                                                                                                        + deviceId);
                                                                } else {
                                                                        // Korisnik postoji - proveri deviceId

                                                                        String existingDeviceId = jdbcTemplate
                                                                                        .queryForObject(
                                                                                                        "SELECT deviceId FROM user WHERE email = ?",
                                                                                                        String.class,
                                                                                                        email);

                                                                        if (existingDeviceId != null
                                                                                        && !existingDeviceId
                                                                                                        .equals(deviceId)) {
                                                                                ResponseCookie errorCookie = ResponseCookie
                                                                                                .from("losGmail",
                                                                                                                "device_mismatch")
                                                                                                .httpOnly(false)
                                                                                                .secure(cookieSecure)
                                                                                                .path("/")
                                                                                                .maxAge(10)
                                                                                                .sameSite(sameSite)
                                                                                                .domain(cookieDomain)
                                                                                                .build();
                                                                                response.addHeader(
                                                                                                HttpHeaders.SET_COOKIE,
                                                                                                errorCookie.toString());
                                                                                response.sendRedirect(
                                                                                                frontendUrl);
                                                                                return;
                                                                        } else {
                                                                                jdbcTemplate.update(
                                                                                                "UPDATE user SET deviceId = ? WHERE email = ?",
                                                                                                deviceId, email);
                                                                        }

                                                                }

                                                                // Ažuriraj loginProvider na GOOGLE za ovog korisnika
                                                                jdbcTemplate.update(
                                                                                "UPDATE user SET loginProvider = 'GOOGLE' WHERE email = ?",
                                                                                email);

                                                                UserDetails user = userDetailsService
                                                                                .loadUserByUsername(email);
                                                                String accessToken = jwtService
                                                                                .generateAccessToken(user);
                                                                String refreshToken = jwtService
                                                                                .generateRefreshToken(user);

                                                                ResponseCookie refreshCookie = ResponseCookie
                                                                                .from("refreshToken", refreshToken)
                                                                                .httpOnly(true)
                                                                                .secure(cookieSecure)
                                                                                .path("/")
                                                                                .domain(cookieDomain)
                                                                                .maxAge(7 * 24 * 60 * 60)
                                                                                .sameSite(sameSite)
                                                                                .build();

                                                                ResponseCookie accessCookie = ResponseCookie
                                                                                .from("accessToken", accessToken)
                                                                                .httpOnly(true)
                                                                                .secure(cookieSecure)
                                                                                .path("/")
                                                                                .domain(cookieDomain)
                                                                                .maxAge(7 * 24 * 60 * 60)
                                                                                .sameSite(sameSite)
                                                                                .build();

                                                                response.addHeader(HttpHeaders.SET_COOKIE,
                                                                                refreshCookie.toString());
                                                                response.addHeader(HttpHeaders.SET_COOKIE,
                                                                                accessCookie.toString());
                                                                response.sendRedirect(frontendUrl);

                                                        } catch (Exception e) {
                                                                ResponseCookie errorCookie = ResponseCookie
                                                                                .from("losGmail", "server_error")
                                                                                .httpOnly(false)
                                                                                .secure(cookieSecure)
                                                                                .path("/")
                                                                                .domain(cookieDomain)
                                                                                .maxAge(10)
                                                                                .sameSite(sameSite)
                                                                                .build();
                                                                response.addHeader(HttpHeaders.SET_COOKIE,
                                                                                errorCookie.toString());
                                                                try {
                                                                        response.sendRedirect(frontendUrl);
                                                                } catch (Exception ex) {
                                                                        ex.printStackTrace();
                                                                }
                                                        }
                                                })
                                                .failureHandler((request, response, authenticationException) -> {
                                                        try {
                                                                ResponseCookie errorCookie = ResponseCookie
                                                                                .from("losGmail", "oauth2_failed")
                                                                                .httpOnly(false)
                                                                                .secure(cookieSecure)
                                                                                .path("/")
                                                                                .domain(cookieDomain)
                                                                                .maxAge(10)
                                                                                .sameSite(sameSite)
                                                                                .build();
                                                                response.addHeader(HttpHeaders.SET_COOKIE,
                                                                                errorCookie.toString());
                                                                response.sendRedirect(frontendUrl);
                                                        } catch (Exception e) {
                                                                e.printStackTrace();
                                                        }
                                                }))

                                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

                return http.build();
        }

        @Bean
        public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
                return config.getAuthenticationManager();
        }

        @Bean
        public PasswordEncoder passwordEncoder() {
                return new BCryptPasswordEncoder();
        }
}
