package com.server.studio27.routes;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// Kurs evra (1 EUR = x RSD) po kome se na stranici plaćanja računa iznos u dinarima.
// GET je javan (stranica plaćanja), menja ga samo admin u Podešavanjima.
@RestController
@RequestMapping("/api")
public class KursEvraRoute {
    static final BigDecimal PODRAZUMEVANI = new BigDecimal("117.4");

    private final JdbcTemplate jdbcTemplate;

    public KursEvraRoute(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/kurs-evra")
    public Map<String, Object> kurs() {
        return Map.of("kurs", trenutni());
    }

    @PutMapping("/kurs-evra")
    public ResponseEntity<?> sacuvaj(@RequestBody Map<String, Object> podaci, Authentication authentication) {
        boolean admin = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> "ADMIN".equals(a.getAuthority()));
        if (!admin) return ResponseEntity.status(403).body(Map.of("error", "Nemate dozvolu"));

        BigDecimal kurs;
        try {
            kurs = new BigDecimal(String.valueOf(podaci.get("kurs")).trim().replace(",", "."))
                    .setScale(4, RoundingMode.HALF_UP).stripTrailingZeros();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Kurs nije ispravan broj."));
        }
        // zaštita od slučajnog upisa (npr. 1174 ili 11.74)
        if (kurs.compareTo(BigDecimal.valueOf(50)) < 0 || kurs.compareTo(BigDecimal.valueOf(300)) > 0)
            return ResponseEntity.badRequest().body(Map.of("error", "Kurs mora biti između 50 i 300 dinara za 1 €."));

        jdbcTemplate.update(
                "INSERT INTO podesavanje (kljuc, vrednost) VALUES ('kursEvra', ?) ON DUPLICATE KEY UPDATE vrednost = VALUES(vrednost)",
                kurs.toPlainString());
        return ResponseEntity.ok(Map.of("success", true, "kurs", trenutni()));
    }

    private BigDecimal trenutni() {
        try {
            List<String> v = jdbcTemplate.queryForList("SELECT vrednost FROM podesavanje WHERE kljuc = 'kursEvra'", String.class);
            if (!v.isEmpty() && v.get(0) != null) return new BigDecimal(v.get(0));
        } catch (Exception ignored) {
        }
        return PODRAZUMEVANI;
    }
}
