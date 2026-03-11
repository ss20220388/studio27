package com.server.studio27.controllers;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@Service
public class StudentLekcijaController {
     @Autowired
    private JdbcTemplate jdbcTemplate;

    @PostMapping("/lekcija/zavrsena")
    public ResponseEntity<?> zavrsenaLekcija(@RequestBody Map<String, Integer> body){

    int studentId = body.get("studentId");
    int lekcijaId = body.get("lekcijaId");

    String SQL = """
        INSERT INTO student_lekcija(studentId, lekcijaId, zavrsena)
        VALUES (?, ?, true)
        ON DUPLICATE KEY UPDATE zavrsena = true
    """;

    jdbcTemplate.update(SQL, studentId, lekcijaId);

    return ResponseEntity.ok("Lekcija završena");
}
}
