package com.server.studio27.routes;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RequestMapping("/api")
public class Materijali {
    @Autowired
    private JdbcTemplate jdbcTemplate;

    @PostMapping("/dodajMaterijaluKurs/{idKurs}")
    public ResponseEntity<Map<String, Object>> dodajMaterijaluKurs(@PathVariable int idKurs, @RequestBody Map<String, Object> materijaliData) {
        String SQL = """
                INSERT INTO materijali (idKurs, url)
                VALUES (?, ?);
                """;

        String url = (String) materijaliData.get("url");

        jdbcTemplate.update(SQL, idKurs, url);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/materijaliZaKurs/{idKurs}")
    public ResponseEntity<Map<String, Object>> materijaliZaKurs(@PathVariable int idKurs) {
        String SQL = """
                SELECT * FROM materijali WHERE idKurs = ?
                """;

        List<Map<String, Object>> materijali = jdbcTemplate.queryForList(SQL, idKurs);

        Map<String, Object> response = new HashMap<>();
        response.put("materijali", materijali);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/delete-file")
    public ResponseEntity<Map<String, Object>> deleteFile(@RequestBody Map<String, String> request) {
        String url= request.get("url");

        String SQL = "DELETE FROM materijali WHERE url = ?";
        jdbcTemplate.update(SQL, url);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PostMapping("/materijali/addNaziv")
    public ResponseEntity<Map<String,Object>> addNaziv(@RequestBody Map<String,Object> request) {
        String url = (String) request.get("url");
        String naziv = (String) request.get("naziv");
        String SQL = "UPDATE materijali SET naziv = ? WHERE url = ?";
        jdbcTemplate.update(SQL, naziv, url);
        return ResponseEntity.ok(Map.of("success", true));
    }
    @PostMapping("/materijali/addUrlSlika")
    public ResponseEntity<Map<String,Object>> addSlika(@RequestBody Map<String,Object> request) {
        String url = (String) request.get("url");
        String urlSlika = (String) request.get("urlSlika");
        String SQL = "UPDATE materijali SET urlSlika = ? WHERE url = ?";
        jdbcTemplate.update(SQL, urlSlika, url);
        return ResponseEntity.ok(Map.of("success", true));
    }
}
