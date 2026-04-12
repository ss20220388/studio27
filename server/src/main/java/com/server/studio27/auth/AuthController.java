package com.server.studio27.auth;

import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.beans.factory.annotation.Autowired;

import com.server.studio27.requests.LoginRequest;
import com.server.studio27.requests.RegisterAdminRequest;
import com.server.studio27.requests.RegisterRequest;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;

@RestController
@RequestMapping("api/auth")
public class AuthController {

    @Value("${app.cookie.domain}")
    private String cookieDomain;

    @Value("${app.cookie.secure}")
    private boolean cookieSecure;

    @Value("${app.cookie.same-site}")
    private String sameSite;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;
    private final JdbcTemplate jdbcTemplate;
    private final PasswordEncoder passwordEncoder;
    
    @Autowired
    private PasswordResetService passwordResetService;


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

        System.out.println("--- LOGIN REQUEST STARTED ---");
        System.out.println("Email: " + request.getEmail());
        System.out.println("DeviceId: " + request.getDeviceId());

        try {
            System.out.println("Attempting authentication...");
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(),
                            request.getPassword()));
            System.out.println("Authentication successful!");
        } catch (Exception e) {
            System.out.println("Authentication failed: " + e.getMessage());
            return ResponseEntity.status(401).body(Map.of("error", "Pogresan email ili lozinka"));
        }

        System.out.println("Loading user details...");
        UserDetails user = userDetailsService.loadUserByUsername(request.getEmail());
        System.out.println("User details loaded for: " + user.getUsername());

        System.out.println("Executing db query to check existing device id...");
        String existingDeviceId = jdbcTemplate.queryForObject(
                "SELECT deviceId FROM user WHERE email = ?", String.class, request.getEmail());
        System.out.println("Existing DeviceId from DB: " + existingDeviceId);

        if (existingDeviceId != null && !existingDeviceId.isBlank()
                && !existingDeviceId.equals(request.getDeviceId())
                && user.getAuthorities().iterator().next().getAuthority().equals("STUDENT")) {
            System.out.println("Device ID mismatch for STUDENT. Rejecting login.");
            return ResponseEntity.status(403).body(Map.of("error",
                    "Vec ste ulogovani na drugom racunaru. Kontaktirajte admina za otkljucavanje."));
        }

        if (existingDeviceId == null || existingDeviceId.isBlank()) {
            System.out.println("No existing device ID found/blank, updating device ID in DB...");
            jdbcTemplate.update("UPDATE user SET deviceId = ? WHERE email = ?",
                    request.getDeviceId(), request.getEmail());
        }

        System.out.println("Updating login provider...");
        jdbcTemplate.update(
                "UPDATE user SET loginProvider = 'EMAIL' WHERE email = ? AND loginProvider IS NULL",
                request.getEmail());

        System.out.println("Generating tokens...");
        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        System.out.println("Building cookies...");
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

        System.out.println("--- LOGIN REQUEST COMPLETED SUCCESSFULLY ---");
        return ResponseEntity.ok(Map.of(
                "accessToken", accessToken,
                "message", "Uspesno ulogovan"));
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
                        u.userId, u.email, u.loginProvider,
                        COALESCE(a.ime, s.ime) AS ime,
                        COALESCE(a.prezime, s.prezime) AS prezime,
                        s.brojTelefona
                    FROM user u
                    LEFT JOIN admin a ON u.userId = a.adminId
                    LEFT JOIN student s ON u.userId = s.studentId
                    WHERE u.email = ?
                """;

        Map<String, Object> row = jdbcTemplate.queryForMap(SQL, email);
        String loginProvider = row.get("loginProvider") != null ? row.get("loginProvider").toString() : "EMAIL";

        return ResponseEntity.ok(Map.of(
                "userId", row.get("userId"),
                "email", row.get("email"),
                "ime", row.get("ime") != null ? row.get("ime") : "",
                "prezime", row.get("prezime") != null ? row.get("prezime") : "",
                "brojTelefona", row.get("brojTelefona") != null ? row.get("brojTelefona") : "",
                "role", role,
                "loginProvider", loginProvider));
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateProfile(
            Authentication authentication,
            @RequestBody Map<String, String> request) {
        if (authentication == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Niste prijavljeni"));
        }

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String email = userDetails.getUsername();

        String ime = request.get("ime");
        String prezime = request.get("prezime");
        String brojTelefona = request.get("brojTelefona");

        if (ime == null || ime.isBlank() || prezime == null || prezime.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Ime i prezime su obavezni"));
        }

        try {
            // Prvo dohvati userId
            Integer userId = jdbcTemplate.queryForObject(
                    "SELECT userId FROM user WHERE email = ?", Integer.class, email);

            if (userId == null) {
                return ResponseEntity.status(404).body(Map.of("error", "Korisnik nije pronađen"));
            }

            // Provjeri da li je admin ili student
            Integer adminId = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM admin WHERE adminId = ?", Integer.class, userId);

            if (adminId > 0) {
                // Ažuriraj admin
                jdbcTemplate.update(
                        "UPDATE admin SET ime = ?, prezime = ? WHERE adminId = ?",
                        ime, prezime, userId);
            } else {
                // Ažuriraj student
                jdbcTemplate.update(
                        "UPDATE student SET ime = ?, prezime = ?, brojTelefona = ? WHERE studentId = ?",
                        ime, prezime, brojTelefona, userId);
            }

            return ResponseEntity.ok(Map.of("message", "Profil uspešno ažuriran"));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Greška pri ažuriranju profila"));
        }
    }

    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(
            Authentication authentication,
            @RequestBody Map<String, String> request) {
        if (authentication == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Niste prijavljeni"));
        }

        String oldPassword = request.get("oldPassword");
        String newPassword = request.get("newPassword");
        String confirmPassword = request.get("confirmPassword");

        if (oldPassword == null || oldPassword.isBlank() ||
                newPassword == null || newPassword.isBlank() ||
                confirmPassword == null || confirmPassword.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Sva polja su obavezna"));
        }

        if (!newPassword.equals(confirmPassword)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Nove lozinke se ne podudaraju"));
        }

        if (newPassword.length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("error", "Lozinka mora imati najmanje 6 karaktera"));
        }

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String email = userDetails.getUsername();

        try {
            // Dohvati trenutnu lozinku iz baze
            String currentHashedPassword = jdbcTemplate.queryForObject(
                    "SELECT password FROM user WHERE email = ?", String.class, email);

            if (currentHashedPassword == null) {
                return ResponseEntity.status(404).body(Map.of("error", "Korisnik nije pronađen"));
            }

            // Validira da li je stara lozinka ispravna
            if (!passwordEncoder.matches(oldPassword, currentHashedPassword)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Stara lozinka nije tačna"));
            }

            // Heširuj novu lozinku
            String hashedNewPassword = passwordEncoder.encode(newPassword);

            // Ažuriraj lozinku u bazi
            jdbcTemplate.update(
                    "UPDATE user SET password = ? WHERE email = ?",
                    hashedNewPassword, email);

            return ResponseEntity.ok(Map.of("message", "Lozinka uspešno promenjena"));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Greška pri promeni lozinke"));
        }
    }

    @PostMapping("/zaboravljena-lozinka")
    public ResponseEntity<?> zaboravljenaLozinka(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email je obavezan"));
        }

        try {
            Integer count = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM user WHERE email = ?", Integer.class, email);
            if (count == null || count == 0) {
                return ResponseEntity.badRequest().body(Map.of("error", "Korisnik sa ovim email-om ne postoji"));
            }
            String SQLProvera = "Select count(*) from provera where email = ? and kod = ? ";
            Integer proveraCount = jdbcTemplate.queryForObject(SQLProvera, Integer.class, email, request.get("kod"));

            if (proveraCount == null || proveraCount == 0) {
                return ResponseEntity.badRequest().body(Map.of("error", "Nevalidan reset token"));
            }

            String hashedNewPassword = passwordEncoder.encode(request.get("password"));
            String SQL="""
                    Update user 
                    set password = ?
                    where email = ?
                    """;

            jdbcTemplate.update(SQL, hashedNewPassword, email);
            String SQLDelete = "DELETE FROM provera WHERE email = ?";
            jdbcTemplate.update(SQLDelete, email);
            return ResponseEntity.ok(Map.of("message", "Lozinka uspešno resetovana"));
        }catch(Exception e){
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Greška pri generisanju reset tokena"));
        }
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

    @PostMapping("/access-token")
    public ResponseEntity<?> getAccess(jakarta.servlet.http.HttpServletRequest request) {
        String accessToken = null;
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if ("accessToken".equals(cookie.getName())) {
                    accessToken = cookie.getValue();
                    break;
                }
            }
        }
        if (accessToken == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Access token nije pronadjen"));
        }
        return ResponseEntity.ok(Map.of("accessToken", accessToken, "message", "Access token pronadjen"));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {

        // Clear refreshToken
        ResponseCookie.ResponseCookieBuilder refreshCookieBuilder = ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .secure(cookieSecure)
                .path("/")
                .maxAge(0);
        if (sameSite != null && !sameSite.isBlank()) {
            refreshCookieBuilder.sameSite(sameSite);
        }
        if (cookieDomain != null && !cookieDomain.isBlank()) {
            refreshCookieBuilder.domain(cookieDomain);
        }
        ResponseCookie refreshCookie = refreshCookieBuilder.build();
        response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());

        // Optionally clear accessToken and deviceId if you use them as cookies
        ResponseCookie.ResponseCookieBuilder accessCookieBuilder = ResponseCookie.from("accessToken", "")
                .httpOnly(true)
                .secure(cookieSecure)
                .path("/")
                .maxAge(0);
        if (sameSite != null && !sameSite.isBlank()) {
            accessCookieBuilder.sameSite(sameSite);
        }
        if (cookieDomain != null && !cookieDomain.isBlank()) {
            accessCookieBuilder.domain(cookieDomain);
        }
        ResponseCookie accessCookie = accessCookieBuilder.build();
        response.addHeader(HttpHeaders.SET_COOKIE, accessCookie.toString());

        return ResponseEntity.ok(Map.of("message", "Uspesno odjavljen"));
    }

}