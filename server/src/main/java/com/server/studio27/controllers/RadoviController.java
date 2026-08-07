package com.server.studio27.controllers;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class RadoviController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public List<Map<String, Object>> getAllRadovi() {

        String SQL = """
            SELECT 
                rs.idRad AS idRad,
                rs.kursId AS idKurs,
                rs.slikaId AS slikaId,
                k.naziv AS naziv,
                rs.ime AS ime,
                rs.prezime AS prezime,
                ss.url AS url,
                rs.raspored as raspored,
                rs.redosledOsoba as redosledOsoba
            FROM radovistudenata rs
            LEFT JOIN kurs k ON rs.kursId = k.kursId
            LEFT JOIN slika ss ON ss.slikaId = rs.slikaId
        """;

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(SQL);
      

        return rows;
    }
    public List<Map<String, Object>> getAllRadoviSaRasporedom() {

        String SQL = """
            SELECT 
                rs.idRad AS idRad,
                rs.kursId AS idKurs,
                rs.slikaId AS slikaId,
                k.naziv AS naziv,
                rs.ime AS ime,
                rs.prezime AS prezime,
                ss.url AS url,
                rs.raspored as raspored
            FROM radovistudenata rs
            LEFT JOIN kurs k ON rs.kursId = k.kursId
            LEFT JOIN slika ss ON ss.slikaId = rs.slikaId
            WHERE rs.raspored IS NOT NULL
        """;

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(SQL);
      

        return rows;
    }

    public void deleteRadoviById(int idRad) {
        String SQL = "DELETE FROM radovistudenata WHERE idRad = ?";
        jdbcTemplate.update(SQL, idRad);
    }

    public void addRadovi(Map<String, Object> rad) {
        String SQL = "INSERT INTO radovistudenata (kursId, slikaId, ime, prezime) VALUES (?, ?, ?, ?)";
        jdbcTemplate.update(SQL, rad.get("kursId"), rad.get("slikaId"), rad.get("ime"), rad.get("prezime"));
    }
}