package com.server.studio27.routes;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// Ko je trenutno u web aplikaciji i šta gleda (admin -> Uživo).
// Plejer javlja na svakih 20 sekundi dok je stranica otvorena; podaci su samo u memoriji
// (posle restarta servera lista je prazna dok se plejeri ponovo ne jave) i ne upisuju se u bazu.
@RestController
@RequestMapping("/api")
public class PrisutnostRoute {

    // korisnik se smatra prisutnim ako se javio u poslednjih 70 sekundi
    private static final Duration AKTIVAN = Duration.ofSeconds(70);

    private record Zapis(String email, String video, double sekunda, double trajanje, boolean gleda, Instant od, Instant poslednji) {}

    private final Map<String, Zapis> prisutni = new ConcurrentHashMap<>();
    private final JdbcTemplate jdbcTemplate;

    public PrisutnostRoute(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    // Plejer: korisnik iz tokena (ne iz tela zahteva), video, pozicija i da li video ide
    @PostMapping("/prisutnost")
    public ResponseEntity<?> javiSe(@RequestBody Map<String, Object> podaci, Authentication authentication) {
        if (authentication == null || authentication.getName() == null) return ResponseEntity.status(401).build();
        String email = authentication.getName();
        String video = String.valueOf(podaci.getOrDefault("video", ""));
        if (video.length() > 200) video = video.substring(0, 200);
        Instant sada = Instant.now();
        Zapis stari = prisutni.get(email);
        // nova "sesija" ako se korisnik dugo nije javio
        Instant od = stari != null && Duration.between(stari.poslednji(), sada).compareTo(AKTIVAN) < 0 ? stari.od() : sada;
        prisutni.put(email, new Zapis(email, video, broj(podaci.get("sekunda")), broj(podaci.get("trajanje")),
                Boolean.TRUE.equals(podaci.get("gleda")), od, sada));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/admin-uzivo")
    public ResponseEntity<?> uzivo(Authentication authentication) {
        boolean admin = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> "ADMIN".equals(a.getAuthority()));
        if (!admin) return ResponseEntity.status(403).body(Map.of("error", "Nemate dozvolu"));

        Instant sada = Instant.now();
        prisutni.values().removeIf(z -> Duration.between(z.poslednji(), sada).compareTo(AKTIVAN) >= 0);

        List<Map<String, Object>> lista = new ArrayList<>();
        for (Zapis z : prisutni.values().stream().sorted(Comparator.comparing(Zapis::od)).toList()) {
            Map<String, Object> red = new java.util.HashMap<>();
            red.put("email", z.email());
            red.put("gleda", z.gleda());
            red.put("sekunda", Math.round(z.sekunda()));
            red.put("trajanje", Math.round(z.trajanje()));
            red.put("od", z.od().toString());
            red.put("poslednji", z.poslednji().toString());

            List<Map<String, Object>> korisnik = jdbcTemplate.queryForList(
                    "SELECT s.ime, s.prezime FROM user u JOIN student s ON s.studentId = u.userId WHERE u.email = ? LIMIT 1", z.email());
            if (!korisnik.isEmpty()) {
                red.put("ime", korisnik.get(0).get("ime"));
                red.put("prezime", korisnik.get(0).get("prezime"));
            }
            List<Map<String, Object>> video = jdbcTemplate.queryForList("""
                    SELECT l.naziv AS lekcija, k.naziv AS kurs, k.kursId, pk.naziv AS paket
                    FROM video v
                    JOIN lekcija l ON l.lekcijaId = v.lekcijaId
                    JOIN kurs k ON k.kursId = l.kursId
                    LEFT JOIN user u ON u.email = ?
                    LEFT JOIN pohadja p ON p.studentId = u.userId AND p.kursId = k.kursId
                    LEFT JOIN paket pk ON pk.paketId = p.paketId
                    WHERE v.url = ?
                    LIMIT 1
                    """, z.email(), z.video());
            if (!video.isEmpty()) red.putAll(video.get(0));
            lista.add(red);
        }
        return ResponseEntity.ok(lista);
    }

    private static double broj(Object o) {
        if (o instanceof Number n && Double.isFinite(n.doubleValue())) return Math.max(0, n.doubleValue());
        return 0;
    }
}
