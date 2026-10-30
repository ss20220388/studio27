package com.server.studio27.routes;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import com.server.studio27.controllers.RecenzijeController;
import com.server.studio27.models.Recenzije;



@RestController
@RequestMapping("/api")
public class RecenzijeRoute {
    private final RecenzijeController recenzijeController;

    public RecenzijeRoute(RecenzijeController recenzijeController) {
        this.recenzijeController = recenzijeController;
    }
    
    @GetMapping("/recenzije")
    public List<Recenzije> getRecenzije() {
        return recenzijeController.getRecenzije();
    }

    private static boolean jeAdmin(Authentication authentication) {
        return authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> "ADMIN".equals(a.getAuthority()));
    }

    // Admin: dodavanje, izmena i brisanje recenzija (stranica Recenzije u adminu)
    @PostMapping("/admin-recenzije")
    public ResponseEntity<?> dodaj(@RequestBody Map<String, Object> podaci, Authentication authentication) {
        if (!jeAdmin(authentication)) return ResponseEntity.status(403).body(Map.of("error", "Nemate dozvolu"));
        if (podaci.get("opis") == null || podaci.get("opis").toString().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Tekst recenzije je obavezan."));
        }
        recenzijeController.dodaj(podaci);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PutMapping("/admin-recenzije/{id}")
    public ResponseEntity<?> izmeni(@PathVariable int id, @RequestBody Map<String, Object> podaci, Authentication authentication) {
        if (!jeAdmin(authentication)) return ResponseEntity.status(403).body(Map.of("error", "Nemate dozvolu"));
        if (podaci.get("opis") == null || podaci.get("opis").toString().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Tekst recenzije je obavezan."));
        }
        return recenzijeController.izmeni(id, podaci)
                ? ResponseEntity.ok(Map.of("success", true))
                : ResponseEntity.status(404).body(Map.of("error", "Recenzija ne postoji"));
    }

    @DeleteMapping("/admin-recenzije/{id}")
    public ResponseEntity<?> obrisi(@PathVariable int id, Authentication authentication) {
        if (!jeAdmin(authentication)) return ResponseEntity.status(403).body(Map.of("error", "Nemate dozvolu"));
        recenzijeController.obrisi(id);
        return ResponseEntity.ok(Map.of("success", true));
    }
}
