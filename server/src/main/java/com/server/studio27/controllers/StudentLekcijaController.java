package com.server.studio27.controllers;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class StudentLekcijaController {
    @Autowired
    private JdbcTemplate jdbcTemplate;

    public ResponseEntity<Map<String, Object>> updateSatiGledanja(Integer studentId, String role, Integer lekcijaId, Integer satiGledanja) {
        try {
            if (!"STUDENT".equals(role)) {
                return ResponseEntity.status(403).body(Map.of("error", "Samo studenti mogu ažurirati sate gledanja"));
            }
            String sql = "UPDATE student_lekcija SET satiGledanja = ? WHERE studentId = ? AND lekcijaId = ?";
            jdbcTemplate.update(sql, satiGledanja, studentId, lekcijaId);

            return ResponseEntity.ok(Map.of("message", "Sati gledanja uspješno ažurirani"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Došlo je do greške prilikom ažuriranja sati gledanja"));
        }
    }

    
}
