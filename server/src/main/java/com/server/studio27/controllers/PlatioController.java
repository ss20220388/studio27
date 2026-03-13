package com.server.studio27.controllers;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import com.server.studio27.models.Student;

@Service
public class PlatioController {
    @Autowired
    private JdbcTemplate jdbcTemplate;

    public List<Student> getAllStudentsWhoPay(Integer kursId) {
        List<Student> studenti = new ArrayList<>();
        String SQL = "SELECT s.* FROM student s JOIN platio p ON s.studentId = p.studentId WHERE p.kursId = ?";

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(SQL, kursId);

        for (Map<String, Object> row : rows) {
            studenti.add(new Student(
                    ((Number) row.get("studentId")).intValue(),
                    (String) row.get("ime"),
                    (String) row.get("prezime"),
                    (String) row.get("email"),
                    (String) row.get("password"),
                    (String) row.get("brojTelefona"),
                    "STUDENT"

            ));

        }

        return studenti;
    }

    public ResponseEntity<Map<String, Object>> getKupljeniPoslednjih12meseci() {
        try {
            String SQL = """
                                        WITH RECURSIVE meseci AS (
                        SELECT 0 AS n
                        UNION ALL
                        SELECT n + 1
                        FROM meseci
                        WHERE n < 11
                    ),
                    zarade AS (
                        SELECT DATE_FORMAT(datumPlacanja, '%Y-%m') AS mesec,
                               SUM(cenaPlacanja) AS zarada
                        FROM platio
                        GROUP BY mesec
                    ),
                    korisnici AS (
                        SELECT DATE_FORMAT(datumKreiranjaNaloga, '%Y-%m') AS mesec,
                               COUNT(*) AS korisnici
                        FROM student
                        GROUP BY mesec
                    )
                    SELECT
                        DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL n MONTH), '%Y-%m') AS mesec,
                        COALESCE(z.zarada,0) AS zarada,
                        COALESCE(k.korisnici,0) AS korisnici
                    FROM meseci m
                    LEFT JOIN zarade z
                        ON z.mesec = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL n MONTH), '%Y-%m')
                    LEFT JOIN korisnici k
                        ON k.mesec = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL n MONTH), '%Y-%m')
                    ORDER BY mesec;
                                                        """;

            List<Map<String, Object>> rows = jdbcTemplate.queryForList(SQL);

            return ResponseEntity.ok(Map.of("data", rows));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Greška prilikom dohvatanja podataka"));
        }

    }

}
