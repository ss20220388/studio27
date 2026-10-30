package com.server.studio27.routes;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// Paketi kursa (npr. Online / Online + Review / Live mentorship): svaki ima svoju cenu i stavke.
// Čitanje je javno (stranica kursa), izmene sme samo admin.
@RestController
@RequestMapping("/api")
public class PaketRoute {
    private final JdbcTemplate jdbcTemplate;

    public PaketRoute(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private static boolean jeAdmin(Authentication authentication) {
        return authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> "ADMIN".equals(a.getAuthority()));
    }

    @GetMapping("/paketi/{kursId}")
    public List<Map<String, Object>> paketiKursa(@PathVariable long kursId) {
        return jdbcTemplate.queryForList(
                "SELECT paketId, kursId, naziv, cena, opis, redosled, podnaslov, uvod, istaknuto, dugme FROM paket WHERE kursId = ? ORDER BY redosled, paketId",
                kursId);
    }

    @PostMapping("/paketi")
    public ResponseEntity<?> dodaj(@RequestBody Map<String, Object> podaci, Authentication authentication) {
        if (!jeAdmin(authentication)) return ResponseEntity.status(403).body(Map.of("error", "Nemate dozvolu"));
        String greska = proveri(podaci);
        if (greska != null) return ResponseEntity.badRequest().body(Map.of("error", greska));
        jdbcTemplate.update(
                "INSERT INTO paket (kursId, naziv, cena, opis, redosled, podnaslov, uvod, istaknuto, dugme) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                broj(podaci.get("kursId")), tekst(podaci.get("naziv")), broj(podaci.get("cena")),
                tekst(podaci.get("opis")), broj(podaci.get("redosled")), ili(podaci.get("podnaslov")),
                ili(podaci.get("uvod")), ili(podaci.get("istaknuto")), ili(podaci.get("dugme")));
        Long paketId = jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
        return ResponseEntity.ok(Map.of("paketId", paketId));
    }

    @PutMapping("/paketi/{paketId}")
    public ResponseEntity<?> izmeni(@PathVariable long paketId, @RequestBody Map<String, Object> podaci, Authentication authentication) {
        if (!jeAdmin(authentication)) return ResponseEntity.status(403).body(Map.of("error", "Nemate dozvolu"));
        String greska = proveri(podaci);
        if (greska != null) return ResponseEntity.badRequest().body(Map.of("error", greska));
        int izmenjeno = jdbcTemplate.update(
                "UPDATE paket SET naziv = ?, cena = ?, opis = ?, redosled = ?, podnaslov = ?, uvod = ?, istaknuto = ?, dugme = ? WHERE paketId = ?",
                tekst(podaci.get("naziv")), broj(podaci.get("cena")), tekst(podaci.get("opis")),
                broj(podaci.get("redosled")), ili(podaci.get("podnaslov")), ili(podaci.get("uvod")),
                ili(podaci.get("istaknuto")), ili(podaci.get("dugme")), paketId);
        return izmenjeno > 0 ? ResponseEntity.ok(Map.of("success", true))
                : ResponseEntity.status(404).body(Map.of("error", "Paket ne postoji"));
    }

    @DeleteMapping("/paketi/{paketId}")
    public ResponseEntity<?> obrisi(@PathVariable long paketId, Authentication authentication) {
        if (!jeAdmin(authentication)) return ResponseEntity.status(403).body(Map.of("error", "Nemate dozvolu"));
        // kupljeni paketi ostaju zapisani u platio/pohadja (paketId), samo se više ne nudi
        jdbcTemplate.update("DELETE FROM paket WHERE paketId = ?", paketId);
        return ResponseEntity.ok(Map.of("success", true));
    }

    private static String proveri(Map<String, Object> podaci) {
        if (tekst(podaci.get("naziv")).isBlank()) return "Naziv paketa je obavezan.";
        if (broj(podaci.get("cena")) <= 0) return "Cena paketa mora biti veća od nule.";
        return null;
    }

    private static String tekst(Object o) {
        return o == null ? "" : o.toString().trim();
    }

    // prazno polje se čuva kao NULL
    private static String ili(Object o) {
        String s = tekst(o);
        return s.isEmpty() ? null : s;
    }

    private static long broj(Object o) {
        if (o instanceof Number n) return n.longValue();
        try {
            return o == null ? 0 : Long.parseLong(o.toString().trim());
        } catch (NumberFormatException e) {
            return 0;
        }
    }
}
