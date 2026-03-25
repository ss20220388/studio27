package com.server.studio27.controllers;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import com.server.studio27.models.RadoviStudenata;

@Service
public class RadoviController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public List<RadoviStudenata> getAllRadovi() {

        String SQL = """
            SELECT 
                rs.idRad AS idRad,
                rs.kursId AS idKurs,
                rs.slikaId AS slikaId,
                k.naziv AS naziv,
                rs.ime AS ime,
                rs.prezime AS prezime,
                ss.url AS url
            FROM radoviStudenata rs
            LEFT JOIN kurs k ON rs.kursId = k.kursId
            LEFT JOIN slika ss ON ss.slikaId = rs.slikaId
        """;

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(SQL);
        List<RadoviStudenata> radovi = new ArrayList<>();

        for (Map<String, Object> row : rows) {
            radovi.add(new RadoviStudenata(
                ((Number) row.get("idRad")).intValue(),
                ((Number) row.get("idKurs")).intValue(),
                ((Number) row.get("slikaId")).intValue(),
                (String) row.get("naziv"),
                (String) row.get("ime"),
                (String) row.get("prezime"),
                (String) row.get("url")
            ));
        }

        return radovi;
    }
}