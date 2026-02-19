package com.server.studio27.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;


import com.server.studio27.models.Placanje;
import com.server.studio27.models.Student;

@Service
public class PlacanjeController {
    private static PlacanjeController placanjeController;
    

     @Autowired
    private JdbcTemplate jdbcTemplate;

    @SuppressWarnings("empty-statement")
   public List<Placanje> savePayment(Integer studentId, Integer kursId, String datumPlacanja, Integer cenaPlacanja) {
    List<Placanje> placanja = new ArrayList<>();
    String SQL = "SELECT * FROM platio p JOIN student s ON p.studentId=s.studentId WHERE p.studentId=? AND p.kursId=?";
    List<Map<String, Object>> rows = jdbcTemplate.queryForList(SQL, studentId, kursId);

    for (Map<String, Object> row : rows) {
        placanja.add(new Placanje(
            ((Number) row.get("studentId")).intValue(),
            (String) row.get("ime"),
            (String) row.get("prezime"),
            (String) row.get("brojTelefona"),
            (String) row.get("datumPlacanja"),
            ((Number) row.get("cenaPlacanja")).intValue()
        ));
    }

    return placanja; // vraća listu, a ne cast
}
}
