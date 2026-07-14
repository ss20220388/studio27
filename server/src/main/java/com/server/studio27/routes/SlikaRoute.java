package com.server.studio27.routes;
import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class SlikaRoute {
    @Autowired
    private JdbcTemplate jdbcTemplate;
    
    @PostMapping("/dodajsliku")
    public ResponseEntity<Map<String, Object>> dodajKursSlika(@RequestBody Map<String, Object> kursData) {

        String SQL = """
            INSERT INTO slika (url)
            VALUES (?);
            """;

        String url = (String) kursData.get("url");

        jdbcTemplate.update(SQL, url);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("idSlika", jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Long.class));

        return ResponseEntity.ok(response);
    }
}
