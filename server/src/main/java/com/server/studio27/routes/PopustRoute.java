package com.server.studio27.routes;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.server.studio27.services.PopustService;

// Popust kursa (Black Friday i sl.): admin ga uključuje i podešava izgled, sajt ga čita uz kurs.
// /api/cene-korpe je javna: korpa pre plaćanja proverava trenutne cene (popust je mogao da počne ili istekne).
@RestController
@RequestMapping("/api")
public class PopustRoute {
    private final JdbcTemplate jdbcTemplate;
    private final PopustService popustService;

    public PopustRoute(JdbcTemplate jdbcTemplate, PopustService popustService) {
        this.jdbcTemplate = jdbcTemplate;
        this.popustService = popustService;
    }

    private static boolean jeAdmin(Authentication authentication) {
        return authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> "ADMIN".equals(a.getAuthority()));
    }

    @PutMapping("/popust/{kursId}")
    public ResponseEntity<?> sacuvaj(@PathVariable long kursId, @RequestBody Map<String, Object> podaci, Authentication authentication) {
        if (!jeAdmin(authentication)) return ResponseEntity.status(403).body(Map.of("error", "Nemate dozvolu"));

        List<Integer> cene = jdbcTemplate.queryForList("SELECT cena FROM kurs WHERE kursId = ?", Integer.class, kursId);
        if (cene.isEmpty()) return ResponseEntity.status(404).body(Map.of("error", "Kurs ne postoji"));
        int cena = cene.get(0) == null ? 0 : cene.get(0);

        boolean ukljucen = Boolean.TRUE.equals(podaci.get("ukljucen"));
        BigDecimal procenat = decimal(podaci.get("procenat"));
        Integer novaCena = ceo(podaci.get("cena"));
        LocalDateTime odKada, doKada;
        try {
            odKada = datum(podaci.get("od"));
            doKada = datum(podaci.get("do"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Datum početka ili kraja popusta nije ispravan."));
        }
        if (odKada != null && doKada != null && !odKada.isBefore(doKada))
            return ResponseEntity.badRequest().body(Map.of("error", "Popust mora da počne pre nego što se završi."));

        // procenat i nova cena se dopunjuju: dovoljno je upisati jedno
        if (procenat == null && novaCena != null && cena > 0) {
            procenat = BigDecimal.valueOf(cena - novaCena).multiply(BigDecimal.valueOf(100))
                    .divide(BigDecimal.valueOf(cena), 2, RoundingMode.HALF_UP);
        }
        if (novaCena == null && procenat != null && cena > 0) {
            novaCena = BigDecimal.valueOf(cena).multiply(BigDecimal.valueOf(100).subtract(procenat))
                    .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP).intValue();
        }

        // cene paketa na popustu: [{ paketId, cena }] (prazna cena = procenat kursa)
        List<Object[]> cenePaketa = new ArrayList<>();
        if (podaci.get("paketi") instanceof List<?> lista) {
            for (Object o : lista) {
                if (!(o instanceof Map<?, ?> m)) continue;
                Integer paketId = ceo(m.get("paketId"));
                if (paketId == null) continue;
                Integer cenaPaketa = ceo(m.get("cena"));
                List<Map<String, Object>> paket = jdbcTemplate.queryForList("SELECT naziv, cena FROM paket WHERE paketId = ? AND kursId = ?", paketId, kursId);
                if (paket.isEmpty()) continue;
                int redovnaPaketa = ((Number) paket.get(0).get("cena")).intValue();
                // redovna cena = paket nije na popustu
                if (cenaPaketa != null && (cenaPaketa <= 0 || cenaPaketa > redovnaPaketa))
                    return ResponseEntity.badRequest().body(Map.of("error", "Cena paketa \"" + paket.get(0).get("naziv") + "\" na popustu ne sme biti veća od " + redovnaPaketa + " €."));
                cenePaketa.add(new Object[] { cenaPaketa, paketId });
            }
        }

        if (ukljucen) {
            if (procenat == null || procenat.signum() <= 0 || procenat.compareTo(BigDecimal.valueOf(100)) >= 0)
                return ResponseEntity.badRequest().body(Map.of("error", "Popust mora biti između 0 i 100%."));
            if (novaCena == null || novaCena <= 0 || (cena > 0 && novaCena >= cena))
                return ResponseEntity.badRequest().body(Map.of("error", "Nova cena mora biti manja od redovne cene (" + cena + " €)."));
        }

        jdbcTemplate.update(
                "UPDATE kurs SET popustUkljucen = ?, popustProcenat = ?, popustCena = ?, popustOd = ?, popustDo = ?, popustOznaka = ?, "
                        + "popustNaslov = ?, popustTekst = ?, popustBoja = ?, popustSlika = ? WHERE kursId = ?",
                ukljucen ? 1 : 0, procenat, novaCena, odKada, doKada, tekst(podaci.get("oznaka")), tekst(podaci.get("naslov")),
                tekst(podaci.get("tekst")), boja(podaci.get("boja")), tekst(podaci.get("slika")), kursId);
        for (Object[] c : cenePaketa) {
            jdbcTemplate.update("UPDATE paket SET cenaPopust = ? WHERE paketId = ?", c[0], c[1]);
        }

        return ResponseEntity.ok(Map.of("success", true, "popust", popustService.zaKurs(kursId)));
    }

    @GetMapping("/akcija")
    public Map<String, Object> akcija() {
        return popustService.akcija();
    }

    // Akcija na početnoj (poseban vizual, npr. Black Friday za ceo sajt)
    @PutMapping("/akcija")
    public ResponseEntity<?> sacuvajAkciju(@RequestBody Map<String, Object> podaci, Authentication authentication) {
        if (!jeAdmin(authentication)) return ResponseEntity.status(403).body(Map.of("error", "Nemate dozvolu"));
        LocalDateTime odKada, doKada;
        try {
            odKada = datum(podaci.get("od"));
            doKada = datum(podaci.get("do"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Datum početka ili kraja akcije nije ispravan."));
        }
        if (odKada != null && doKada != null && !odKada.isBefore(doKada))
            return ResponseEntity.badRequest().body(Map.of("error", "Akcija mora da počne pre nego što se završi."));
        boolean ukljucen = Boolean.TRUE.equals(podaci.get("ukljucen"));
        if (ukljucen && tekst(podaci.get("naslov")) == null)
            return ResponseEntity.badRequest().body(Map.of("error", "Upišite naslov akcije."));
        jdbcTemplate.update("INSERT IGNORE INTO akcija (id) VALUES (1)");
        jdbcTemplate.update(
                "UPDATE akcija SET ukljucen = ?, oznaka = ?, naslov = ?, tekst = ?, boja = ?, slika = ?, odKada = ?, doKada = ?, dugme = ?, link = ? WHERE id = 1",
                ukljucen ? 1 : 0, tekst(podaci.get("oznaka")), tekst(podaci.get("naslov")), tekst(podaci.get("tekst")),
                boja(podaci.get("boja")), tekst(podaci.get("slika")), odKada, doKada, tekst(podaci.get("dugme")), link(podaci.get("link")));
        return ResponseEntity.ok(Map.of("success", true, "akcija", popustService.akcija()));
    }

    // "2026-11-27T00:00" iz admina (datetime-local); prazno = null
    private static LocalDateTime datum(Object o) {
        String s = tekst(o);
        if (s == null) return null;
        return LocalDateTime.parse(s.length() == 16 ? s + ":00" : s);
    }

    // samo adrese na sajtu (/kurs/7, /#edukacije) ili https://
    private static String link(Object o) {
        String s = tekst(o);
        if (s == null) return null;
        return s.startsWith("/") || s.startsWith("#") || s.startsWith("https://") ? s : null;
    }

    // [{ kursId, paketId? }] -> [{ kursId, paketId, cena }] po trenutnim cenama (sa popustom)
    @PostMapping("/cene-korpe")
    public List<Map<String, Object>> ceneKorpe(@RequestBody List<Map<String, Object>> stavke) {
        List<Map<String, Object>> rezultat = new ArrayList<>();
        for (Map<String, Object> s : stavke == null ? List.<Map<String, Object>>of() : stavke) {
            Integer kursId = ceo(s.get("kursId"));
            if (kursId == null) continue;
            Integer paketId = ceo(s.get("paketId"));
            PopustService.Cena c = popustService.cenaKursa(kursId, paketId == null ? null : paketId.longValue());
            if (c.cena() == null) continue;
            Map<String, Object> red = new HashMap<>();
            red.put("kursId", kursId);
            red.put("paketId", c.paketId());
            red.put("cena", c.cena());
            rezultat.add(red);
        }
        return rezultat;
    }

    private static String tekst(Object o) {
        if (o == null) return null;
        String s = o.toString().trim();
        return s.isEmpty() ? null : s;
    }

    // samo #rgb / #rrggbb, da u stil stranice ne uđe ništa drugo
    private static String boja(Object o) {
        String s = tekst(o);
        return s != null && s.matches("#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?") ? s : null;
    }

    private static Integer ceo(Object o) {
        if (o instanceof Number n) return (int) Math.round(n.doubleValue());
        String s = tekst(o);
        if (s == null) return null;
        try {
            return (int) Math.round(Double.parseDouble(s.replace(",", ".")));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static BigDecimal decimal(Object o) {
        String s = o == null ? null : tekst(o.toString());
        if (s == null) return null;
        try {
            return new BigDecimal(s.replace(",", ".")).setScale(2, RoundingMode.HALF_UP);
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
