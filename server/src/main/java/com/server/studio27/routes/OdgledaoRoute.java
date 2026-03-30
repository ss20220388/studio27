package com.server.studio27.routes;
import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RequestMapping("api/odgledao")
public class OdgledaoRoute {
    @Autowired
    private JdbcTemplate jdbcTemplate;

    @PutMapping("/update")
    public ResponseEntity<Map<String, Object>> updateOdgledao(@RequestBody Map<String, Object> entity) {
        String videoUrl = (String) entity.get("videoId");
        Number userId = (Number) entity.get("studentId");
        Number procenat = (Number) entity.get("procenat");
        Number vremeGledanja = (Number) entity.get("vremeGledanja");
  
        String sqlInsert = """
            INSERT INTO odgledao (userId, videoUrl, procenat, vremeGledanja) 
            VALUES (?, ?, ?, ?)
            AS new
            ON DUPLICATE KEY UPDATE 
                procenat = GREATEST(odgledao.procenat, new.procenat),
                vremeGledanja = GREATEST(odgledao.vremeGledanja, new.vremeGledanja);
        """;
        jdbcTemplate.update(sqlInsert, userId.intValue(), videoUrl, procenat.intValue(), vremeGledanja.intValue());
        return ResponseEntity.ok(new HashMap<>());
    }
    
}
