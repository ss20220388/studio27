package com.server.studio27.routes;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.server.studio27.services.PodsetnikKupovine;

// Napuštena kupovina: stranica plaćanja javlja šta je u korpi (samo prijavljen kupac, mejl iz prijave),
// a link iz podsetnika odjavljuje od daljih podsetnika.
@RestController
@RequestMapping("/api/podsetnik")
public class PodsetnikRoute {
    private final PodsetnikKupovine podsetnik;

    public PodsetnikRoute(PodsetnikKupovine podsetnik) {
        this.podsetnik = podsetnik;
    }

    // { kursIds: [7], paketi: { "7": 2 } }
    @PostMapping("/korpa")
    public ResponseEntity<?> korpa(@RequestBody Map<String, Object> podaci, Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof UserDetails korisnik)) {
            return ResponseEntity.status(401).body(Map.of("error", "Niste prijavljeni"));
        }
        List<Long> kursIds = new ArrayList<>();
        if (podaci.get("kursIds") instanceof List<?> lista) {
            for (Object o : lista) {
                Long id = broj(o);
                if (id != null) kursIds.add(id);
            }
        }
        Map<Long, Long> paketi = new HashMap<>();
        if (podaci.get("paketi") instanceof Map<?, ?> mapa) {
            mapa.forEach((k, v) -> {
                Long kursId = broj(k);
                Long paketId = broj(v);
                if (kursId != null && paketId != null) paketi.put(kursId, paketId);
            });
        }
        podsetnik.zabelezi(korisnik.getUsername(), kursIds, paketi);
        return ResponseEntity.ok(Map.of("success", true));
    }

    // { token } iz linka u mejlu
    @PostMapping("/odjava")
    public ResponseEntity<?> odjava(@RequestBody Map<String, Object> podaci) {
        Object token = podaci.get("token");
        return podsetnik.odjavi(token == null ? null : token.toString())
                ? ResponseEntity.ok(Map.of("success", true))
                : ResponseEntity.status(404).body(Map.of("error", "Link za odjavu nije ispravan."));
    }

    private static Long broj(Object o) {
        if (o instanceof Number n) return n.longValue();
        try {
            return o == null ? null : Long.parseLong(o.toString().trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
