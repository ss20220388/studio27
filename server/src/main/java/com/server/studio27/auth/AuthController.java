package com.server.studio27.auth;


import java.util.Map;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.server.studio27.requests.LoginRequest;
import com.server.studio27.requests.RegisterAdminRequest;
import com.server.studio27.requests.RegisterRequest;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;

@RestController
@RequestMapping("api/auth")
public class AuthController {
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;
    private final JdbcTemplate jdbcTemplate;
    private final PasswordEncoder passwordEncoder;

    public AuthController(
            AuthenticationManager authenticationManager,
            JwtService jwtService,
            UserDetailsService userDetailsService,
            JdbcTemplate jdbcTemplate,
            PasswordEncoder passwordEncoder) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
        this.jdbcTemplate = jdbcTemplate;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody LoginRequest request,
            HttpServletResponse response) {

        // deviceId je obavezan
        if (request.getDeviceId() == null || request.getDeviceId().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "deviceId je obavezan"));
        }

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(),
                            request.getPassword()));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("error", "Pogresan email ili lozinka"));
        }

        UserDetails user = userDetailsService.loadUserByUsername(request.getEmail());

        // Proveri da li je nalog vec zakljucan za neki uredjaj
        String existingDeviceId = jdbcTemplate.queryForObject(
                "SELECT deviceId FROM user WHERE email = ?", String.class, request.getEmail());

        if (existingDeviceId != null && !existingDeviceId.isBlank() && !existingDeviceId.equals(request.getDeviceId())) {
            // Nalog je vezan za drugi uredjaj
            return ResponseEntity.status(403).body(Map.of("error",
                    "Vec ste ulogovani na drugom racunaru. Kontaktirajte admina za otkljucavanje."));
        }

        // Ako nema deviceId u bazi, zakljucaj nalog za ovaj uredjaj
        if (existingDeviceId == null || existingDeviceId.isBlank()) {
            jdbcTemplate.update("UPDATE user SET deviceId = ? WHERE email = ?",
                    request.getDeviceId(), request.getEmail());
        }

        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);


        ResponseCookie cookieAccess = ResponseCookie.from("accessToken", accessToken)
            .httpOnly(true)
            .secure(false) // Secure=true za SameSite=None
            .path("/")
            .domain(".studio27.rs")
            .maxAge( 7 * 24 * 60 * 60) // 7 dana
            .sameSite("Lax") // dozvoljava cross-subdomain
            .build();

        
        response.addHeader(HttpHeaders.SET_COOKIE, cookieAccess.toString());

         ResponseCookie cookieRefresh = ResponseCookie.from("refreshToken", refreshToken)
            .httpOnly(true)
            .secure(false) // Secure=true za SameSite=None
            .path("/")
            .domain(".studio27.rs")
            .maxAge( 7 * 24 * 60 * 60) // 7 dana
            .sameSite("Lax") // dozvoljava cross-subdomain
            .build();
        
        response.addHeader(HttpHeaders.SET_COOKIE, cookieRefresh.toString());
        return ResponseEntity.ok(Map.of(
            "accessToken", accessToken,
            "message", "Uspesno ulogovan"
        ));
    }

    @PostMapping("/register-user")
    public ResponseEntity<?> registerUser(@RequestBody RegisterRequest request) {
        String checkSQL = "SELECT COUNT(*) FROM user WHERE email = ?";
        Integer count = jdbcTemplate.queryForObject(checkSQL, Integer.class, request.getEmail());
        if (count != null && count > 0) {
            return ResponseEntity.badRequest().body(Map.of("error", "Korisnik sa ovim email-om vec postoji"));
        }

        String hashedPassword = passwordEncoder.encode(request.getPassword());

        jdbcTemplate.update("INSERT INTO user (email, password) VALUES (?, ?)",
                request.getEmail(), hashedPassword);

        Integer userId = jdbcTemplate.queryForObject(
                "SELECT userId FROM user WHERE email = ?", Integer.class, request.getEmail());

        jdbcTemplate.update(
                "INSERT INTO student (studentId, ime, prezime, brojTelefona) VALUES (?, ?, ?, ?)",
                userId, request.getIme(), request.getPrezime(), request.getBrojTelefona());

        return ResponseEntity.ok(Map.of("message", "Korisnik uspesno kreiran"));
    }

    @PostMapping("/register-admin")
    public ResponseEntity<?> registerAdmin(@RequestBody RegisterAdminRequest entity) {
        String checkSQL = "SELECT COUNT(*) FROM user WHERE email = ?";
        Integer count = jdbcTemplate.queryForObject(checkSQL, Integer.class, entity.getEmail());
        if (count != null && count > 0) {
            return ResponseEntity.badRequest().body(Map.of("error", "Admin sa ovim email-om vec postoji"));
        }

        String hashedPassword = passwordEncoder.encode(entity.getPassword());

        jdbcTemplate.update("INSERT INTO user (email, password) VALUES (?, ?)",
                entity.getEmail(), hashedPassword);

        Integer userId = jdbcTemplate.queryForObject(
                "SELECT userId FROM user WHERE email = ?", Integer.class, entity.getEmail());

        jdbcTemplate.update(
                "INSERT INTO admin (adminId, ime, prezime) VALUES (?, ?, ?)",
                userId, entity.getIme(), entity.getPrezime());

        return ResponseEntity.ok(Map.of("message", "Admin uspesno kreiran"));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(200).body(Map.of("error", "Niste prijavljeni"));
        }

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String email = userDetails.getUsername();
        String role = userDetails.getAuthorities().iterator().next().getAuthority();

        String SQL = """
                    SELECT
                        u.userId, u.email,
                        COALESCE(a.ime, s.ime) AS ime,
                        COALESCE(a.prezime, s.prezime) AS prezime
                    FROM user u
                    LEFT JOIN admin a ON u.userId = a.adminId
                    LEFT JOIN student s ON u.userId = s.studentId
                    WHERE u.email = ?
                """;

        Map<String, Object> row = jdbcTemplate.queryForMap(SQL, email);

        return ResponseEntity.ok(Map.of(
                "userId", row.get("userId"),
                "email", row.get("email"),
                "ime", row.get("ime") != null ? row.get("ime") : "",
                "prezime", row.get("prezime") != null ? row.get("prezime") : "",
                "role", role));
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(jakarta.servlet.http.HttpServletRequest request) {
        String refreshToken = null;
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if ("refreshToken".equals(cookie.getName())) {
                    refreshToken = cookie.getValue();
                    break;
                }
            }
        }

        if (refreshToken == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Refresh token nije pronadjen"));
        }

        try {
            String email = jwtService.extractUsername(refreshToken);
            UserDetails userDetails = userDetailsService.loadUserByUsername(email);

            if (jwtService.isTokenValid(refreshToken, userDetails)) {
                String newAccessToken = jwtService.generateAccessToken(userDetails);
                return ResponseEntity.ok(Map.of("accessToken", newAccessToken));
            } else {
                return ResponseEntity.status(401).body(Map.of("error", "Refresh token je istekao"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("error", "Nevalidan refresh token"));
        }
    }
    @PostMapping("/getAccesToken")
    public Map<String, Object> getAccessTokeString(jakarta.servlet.http.HttpServletRequest request) {
        String accessToken = null;
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if ("accessToken".equals(cookie.getName())) {
                    accessToken = cookie.getValue();
                    break;
                }
            }
        }
        if(accessToken == null) {
            return Map.of("error", "Nije pronadjen access token");
        }
        
        return Map.of("accessToken", accessToken, "message", "Access token pronadjen");
    }
    

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {

        // Clear refreshToken
        ResponseCookie refreshCookie = ResponseCookie.from("refreshToken", null)
            .httpOnly(true)
            .secure(false)
            .path("/")
            .domain(".studio27.rs")
            .sameSite("Lax")
            .maxAge(0)
            .build();
        response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());

        // Optionally clear accessToken and deviceId if you use them as cookies
        ResponseCookie accessCookie = ResponseCookie.from("accessToken", null)
            .httpOnly(true)
            .secure(false)
            .path("/")
            .domain(".studio27.rs")
            .sameSite("Lax")
            .maxAge(0)
            .build();
        response.addHeader(HttpHeaders.SET_COOKIE, accessCookie.toString());

      

        return ResponseEntity.ok(Map.of("message", "Uspesno odjavljen"));
    }

}
