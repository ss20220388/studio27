package com.server.studio27.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import com.server.studio27.models.Recenzije;
import com.server.studio27.models.Student;
import com.server.studio27.models.Kurs;
import java.util.*;

@Service
public class RecenzijeController {
    @Autowired
    private JdbcTemplate jdbcTemplate;

    public List<Recenzije> getRecenzije() {
        List<Recenzije> recenzije = new ArrayList<>();

        String SQL = """
            SELECT r.recenzijaId, r.opis, r.ocena, r.datum,
                   s.studentId, s.ime, s.prezime, s.brojTelefona,
                   k.kursId, k.naziv as kursNaziv
            FROM recenzija r
            LEFT JOIN student s ON r.studentId = s.studentId
            LEFT JOIN kurs k ON r.kursId = k.kursId
        """;

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(SQL);

        for (Map<String, Object> row : rows) {
            Number recenzijaId = (Number) row.get("recenzijaId");
            Number ocena = (Number) row.get("ocena");

            Student student = null;
            Number studentId = (Number) row.get("studentId");
            if (studentId != null) {
                student = new Student(
                    studentId.intValue(), null, null,
                    (String) row.get("ime"),
                    (String) row.get("prezime"),
                    (String) row.get("brojTelefona")
                );
            }

            Kurs kurs = null;
            Number kursId = (Number) row.get("kursId");
            if (kursId != null) {
                kurs = new Kurs(
                    kursId.intValue(),
                    (String) row.get("kursNaziv"),
                    null, 0
                );
            }

            recenzije.add(new Recenzije(
                recenzijaId != null ? recenzijaId.intValue() : 0,
                (String) row.get("opis"),
                ocena != null ? ocena.intValue() : 0,
                (Date) row.get("datum"),
                student,
                kurs
            ));
        }

        return recenzije;
    }
}
