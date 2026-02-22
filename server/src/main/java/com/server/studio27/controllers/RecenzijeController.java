package com.server.studio27.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import com.server.studio27.models.Recenzije;
import java.util.*;

@Service
public class RecenzijeController {
    @Autowired
    private JdbcTemplate jdbcTemplate;

    public List<Recenzije> getRecenzije() {
        List<Recenzije> recenzije = new ArrayList<>();

        String SQL = "SELECT * FROM recenzija";

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(SQL);

        for (Map<String, Object> row : rows) {
            recenzije.add(new Recenzije(
                    ((Number) row.get("id")).intValue(),
                    (String) row.get("opis"),
                    ((Number) row.get("ocena")).intValue(),
                    (Date) row.get("datum"),
                    // Pretpostavljamo da su studentId i kursId strani ključevi
                    // i da ćemo ih kasnije koristiti za dohvat podataka o studentu i kursu
                    null, // Ovdje bi trebao biti objekat Student
                    null  // Ovdje bi trebao biti objekat Kurs
            ));
        }

        return recenzije;
    }
}
