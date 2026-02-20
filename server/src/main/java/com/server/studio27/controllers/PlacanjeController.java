package com.server.studio27.controllers;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import com.server.studio27.models.Placanje;

@Service
public class PlacanjeController {
    private static PlacanjeController placanjeController;
    

     @Autowired
    private JdbcTemplate jdbcTemplate;

    @SuppressWarnings("empty-statement")
   public List<Placanje> savePayment(Integer studentId, Integer kursId, String datumPlacanja, Integer cenaPlacanja) {
    List<Placanje> placanja = new ArrayList<>();
    String SQL = "SELECT p.*, s.*, u.email FROM platio p JOIN student s ON p.studentId=s.studentId JOIN user u ON s.studentId=u.userId WHERE p.studentId=? AND p.kursId=?";
    List<Map<String, Object>> rows = jdbcTemplate.queryForList(SQL, studentId, kursId);

    for (Map<String, Object> row : rows) {
        placanja.add(new Placanje(
            ((Number) row.get("studentId")).intValue(),
            (String) row.get("ime"),
            (String) row.get("prezime"),
            (String) row.get("email"),
            (String) row.get("brojTelefona"),
            (String) row.get("datumPlacanja"),
            ((Number) row.get("cenaPlacanja")).intValue()
        ));
    }

    return placanja;
}
}
