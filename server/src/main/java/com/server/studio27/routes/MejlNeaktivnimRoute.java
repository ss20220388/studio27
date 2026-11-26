package com.server.studio27.routes;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.server.studio27.services.MailService;

// Mejl svima koji su se registrovali, a nisu kupili nijedan kurs (nemaju ni aktivan kurs ni plaćanje).
// Samo admin. Ko se odjavio sa podsetnika (podsetnik_odjava) ne dobija ni ovaj mejl.
@RestController
@RequestMapping("/api/mail/neaktivni")
public class MejlNeaktivnimRoute {
    private static final String PRIMAOCI = """
            SELECT DISTINCT u.email FROM user u JOIN student s ON s.studentId = u.userId
            WHERE u.email IS NOT NULL AND u.email <> ''
              AND NOT EXISTS (SELECT 1 FROM pohadja p WHERE p.studentId = s.studentId)
              AND NOT EXISTS (SELECT 1 FROM platio pl WHERE pl.studentId = s.studentId AND pl.status IN ('P', 'C'))
              AND NOT EXISTS (SELECT 1 FROM podsetnik_odjava o WHERE o.email = u.email)
            """;

    private final JdbcTemplate jdbc;
    private final MailService mail;

    public MejlNeaktivnimRoute(JdbcTemplate jdbc, MailService mail) {
        this.jdbc = jdbc;
        this.mail = mail;
    }

    private static boolean admin(Authentication a) {
        return a != null && a.getAuthorities().stream().anyMatch(g -> "ADMIN".equals(g.getAuthority()));
    }

    @GetMapping
    public ResponseEntity<?> broj(Authentication auth) {
        if (!admin(auth)) return ResponseEntity.status(403).body(Map.of("error", "Nemate dozvolu"));
        return ResponseEntity.ok(Map.of("broj", jdbc.queryForList(PRIMAOCI, String.class).size()));
    }

    // { subject, body, probni? } - sa "probni" ide samo na tu adresu, inače svim neaktivnim
    @PostMapping
    public ResponseEntity<?> posalji(@RequestBody Map<String, String> podaci, Authentication auth) {
        if (!admin(auth)) return ResponseEntity.status(403).body(Map.of("error", "Nemate dozvolu"));
        String naslov = podaci.getOrDefault("subject", "").trim();
        String telo = podaci.getOrDefault("body", "").trim();
        if (naslov.isEmpty() || telo.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Naslov i poruka su obavezni."));
        }
        String html = telo.replace("\n", "<br>");
        String probni = podaci.getOrDefault("probni", "").trim();
        List<String> primaoci = probni.isEmpty() ? jdbc.queryForList(PRIMAOCI, String.class) : List.of(probni);

        // slanje ide u pozadini, svakom posebno (da se ne vide tuđe adrese i da jedna greška ne zaustavi ostale)
        Thread t = new Thread(() -> {
            int ok = 0, greske = 0;
            for (String email : primaoci) {
                try {
                    mail.sendHtmlEmail(email, naslov, null, html);
                    ok++;
                } catch (Exception e) {
                    greske++;
                }
            }
            System.out.println("Mejl neaktivnim: poslato " + ok + ", greške " + greske);
        }, "mejl-neaktivnim");
        t.setDaemon(true);
        t.start();
        return ResponseEntity.ok(Map.of("success", true, "broj", primaoci.size()));
    }
}
