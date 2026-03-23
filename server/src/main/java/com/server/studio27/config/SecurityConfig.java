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
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/login").permitAll()
                        .requestMatchers("/api/auth/register-user").permitAll()
                        .requestMatchers("/api/auth/register-admin").permitAll()
                        .requestMatchers("/api/auth/refresh").permitAll()
                        .requestMatchers("/api/auth/access-token").permitAll()
                        .requestMatchers("/api/auth/me").permitAll()
                        .requestMatchers("/api/auth/oauth2").permitAll()
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

                        .anyRequest().authenticated())
                .oauth2Login(oauth -> oauth
                        .successHandler((request, response, authentication) -> {
                            System.out.println("USAO U GOOGLE SUCCESS HANDLER");

                            OAuth2User oauthUser = (OAuth2User) authentication.getPrincipal();
                            String email = oauthUser.getAttribute("email");

                            System.out.println("OAuth2 login successful for email: " + email);
                            Integer count = jdbcTemplate.queryForObject(
                                    "SELECT COUNT(*) FROM user WHERE email = ?",
                                    Integer.class,
                                    email);

                            if (count == null || count == 0) {

                                PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
                                String randomPassword = passwordEncoder.encode(java.util.UUID.randomUUID().toString());

                                jdbcTemplate.update(
                                        "INSERT INTO user (email, password) VALUES (?, ?)",
                                        email,
                                        randomPassword);

                                Integer userId = jdbcTemplate.queryForObject(
                                        "SELECT userId FROM user WHERE email = ?",
                                        Integer.class,
                                        email);

                                jdbcTemplate.update(
                                        "INSERT INTO student (studentId, ime, prezime, brojTelefona) VALUES (?, ?, ?, ?)",
                                        userId,
                                        oauthUser.getAttribute("given_name"),
                                        oauthUser.getAttribute("family_name"),
                                        "");
                            }

                            // 3. učitaj user-a
                            UserDetails user = userDetailsService.loadUserByUsername(email);

                            // 4. generiši tokene
                            String accessToken = jwtService.generateAccessToken(user);
                            String refreshToken = jwtService.generateRefreshToken(user);

                            // 5. cookie (ISTO kao tvoj login)
                            ResponseCookie refreshCookie = ResponseCookie.from("refreshToken", refreshToken)
                                    .httpOnly(true)
                                    .secure(cookieSecure)
                                    .path("/")
                                    .domain(cookieDomain)
                                    .maxAge(7 * 24 * 60 * 60)
                                    .sameSite(sameSite)
                                    .build();

                            ResponseCookie accessCookie = ResponseCookie.from("accessToken", accessToken)
                                    .httpOnly(true)
                                    .secure(cookieSecure)
                                    .path("/")
                                    .domain(cookieDomain)
                                    .maxAge(7 * 24 * 60 * 60)
                                    .sameSite(sameSite)
                                    .build();

                            response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());
                            response.addHeader(HttpHeaders.SET_COOKIE, accessCookie.toString());

                            // 6. redirect na frontend
                            System.out.println("PRE REDIRECTA");
                            response.sendRedirect(frontendUrl);
                        })
                        .failureHandler((request, response, authenticationException) -> {
                            System.out.println("OAuth2 login failed for email: " + request.getParameter("email"));
                            response.sendRedirect(frontendUrl);
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
