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
public class KursSlikaRoute {
    @Autowired
    private JdbcTemplate jdbcTemplate;

    @PostMapping("/dodajkursslika")
    public ResponseEntity<Map<String, Object>> dodajKursSlika(@RequestBody Map<String, Object> kursData) {

        String SQL = """
                INSERT INTO KursSlika (idKurs, idSlika)
                VALUES (?, ?);
                """;

        Long idKurs = ((Number) kursData.get("idKurs")).longValue();
        Long idSlika = ((Number) kursData.get("idSlika")).longValue();

        jdbcTemplate.update(SQL, idKurs, idSlika);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/kursslika/{id}")
    public ResponseEntity<Map<String, Object>> prikazi(@PathVariable int id) {
        Map<String, Object> response = new HashMap<>();

        String SQL = """
                SELECT *
                FROM kursslika ks
                JOIN slika s ON ks.idSlika = s.slikaId
                WHERE ks.idKurs = ?;
                """;

        List<Map<String, Object>> kursSlike = jdbcTemplate.queryForList(SQL, id);

        response.put("kursSlika", kursSlike);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/deletekursslika/{idKurs}")
    public String postMethodName(@PathVariable int idKurs) {
        String SQL = """
                DELETE FROM kursslika
                WHERE idKurs = ?;
                """;
        jdbcTemplate.update(SQL, idKurs);
        return "Deleted";
    }
    
}
