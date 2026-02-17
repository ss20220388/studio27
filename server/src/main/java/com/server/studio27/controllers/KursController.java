package com.server.studio27.controllers;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import com.server.studio27.models.Kurs;
import com.server.studio27.models.Student;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;  

import java.util.List;
import java.util.Map;

import jakarta.validation.constraints.Null;

@Service
public class KursController {
    @Autowired
    private JdbcTemplate jdbcTemplate;

    public List<Kurs> getAllKursevi() {
        List<Kurs> kursevi = new ArrayList<>();
         String SQL = "SELECT * FROM kurs";

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(SQL);

        for (Map<String, Object> row : rows) {
            kursevi.add(new Kurs(
                ((Number) row.get("kursId")).intValue(),
                (String)row.get("naziv"),
                (String)row.get("opis"),
                ((Number) row.get("cena")).intValue(),
                ((Number) row.get("trajanje")).intValue(),
                (String) row.get("slikaUrl")
            ));
        
        }        


        return kursevi;
    }

}
