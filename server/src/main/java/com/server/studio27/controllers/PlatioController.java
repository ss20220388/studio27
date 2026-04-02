package com.server.studio27.controllers;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Service;

import com.server.studio27.models.Platio;
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
                        where status='P'
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

    public List<Platio> getStudentPayments(Integer studentId) {
        List<Platio> platanja = new ArrayList<>();
        String SQL = """
                SELECT p.studentId, p.kursId, p.datumPlacanja, p.cenaPlacanja, k.naziv, 'Plaćeno' as status
                FROM platio p
                JOIN kurs k ON p.kursId = k.kursId
                WHERE p.studentId = ?
                ORDER BY p.datumPlacanja DESC
                """;

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(SQL, studentId);

        for (Map<String, Object> row : rows) {
            Platio platio = new Platio(
                    ((Number) row.get("studentId")).intValue(),
                    ((Number) row.get("kursId")).intValue(),
                    (java.sql.Date) row.get("datumPlacanja"),
                    ((Number) row.get("cenaPlacanja")).intValue(),
                    (String) row.get("naziv"),
                    (String) row.get("status"));
            platanja.add(platio);
        }

        return platanja;
    }

    public ResponseEntity<Map<String, Object>> getSveUplate() {
        try {
            String SQL = """
                    Select p.studentId, p.kursId, p.datumPlacanja, p.cenaPlacanja, k.naziv,p.status,p.tip,p.url,ime,prezime,email
                    FROM platio p
                    JOIN kurs k ON p.kursId = k.kursId
                    join student s ON p.studentId = s.studentId
                    join user u ON s.studentId = u.userId
                    where status='P'
                    """;
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(SQL);
            List<Map<String, Object>> platanja = new ArrayList<>();
            for (Map<String, Object> row : rows) {
                Map<String, Object> platio = new HashMap<>();
                platio.put("studentId", ((Number) row.get("studentId")).intValue());
                platio.put("kursId", ((Number) row.get("kursId")).intValue());
                platio.put("datumPlacanja", (java.sql.Date) row.get("datumPlacanja"));
                platio.put("cenaPlacanja", ((Number) row.get("cenaPlacanja")).intValue());
                platio.put("nazivKursa", (String) row.get("naziv"));
                platio.put("ime", (String) row.get("ime"));
                platio.put("prezime", (String) row.get("prezime"));
                platio.put("email", (String) row.get("email"));
                platio.put("status", (String) row.get("status"));
                platio.put("tip", (String) row.get("tip"));
                platio.put("url", (String) row.get("url"));
                platanja.add(platio);
            }
            return ResponseEntity.ok(Map.of("data",platanja));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Greška prilikom dohvatanja podataka"));
        }
    }

    public ResponseEntity<Map<String, Object>> getSveOdbijene() {
        try {
            String SQL = """
                    Select p.studentId, p.kursId, p.datumPlacanja, p.cenaPlacanja, k.naziv,p.status,p.tip,p.url,ime,prezime,email
                    FROM platio p
                    JOIN kurs k ON p.kursId = k.kursId
                    join student s ON p.studentId = s.studentId
                    join user u ON s.studentId = u.userId
                    WHERE p.status = 'O'
                    """;
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(SQL);
            List<Map<String, Object>> platanja = new ArrayList<>();
            for (Map<String, Object> row : rows) {
                Map<String, Object> platio = new HashMap<>();
                platio.put("studentId", ((Number) row.get("studentId")).intValue());
                platio.put("kursId", ((Number) row.get("kursId")).intValue());
                platio.put("datumPlacanja", (java.sql.Date) row.get("datumPlacanja"));
                platio.put("cenaPlacanja", ((Number) row.get("cenaPlacanja")).intValue());
                platio.put("nazivKursa", (String) row.get("naziv"));
                platio.put("status", (String) row.get("status"));
                platio.put("tip", (String) row.get("tip"));
                platio.put("url", (String) row.get("url"));
                platio.put("ime", (String) row.get("ime"));
                platio.put("prezime", (String) row.get("prezime"));
                platio.put("email", (String) row.get("email"));
                platanja.add(platio);
            }
            return ResponseEntity.ok(Map.of("data",platanja));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Greška prilikom dohvatanja podataka"));
        }
    }

    public ResponseEntity<Map<String,Object>> getSveUpriremi(){
        try {
            String SQL = """
                    Select p.studentId, p.kursId, p.datumPlacanja, p.cenaPlacanja, k.naziv,p.status,p.tip,p.url,ime,prezime,email
                    FROM platio p
                    JOIN kurs k ON p.kursId = k.kursId
                    join student s ON p.studentId = s.studentId
                    join user u ON s.studentId = u.userId
                    WHERE p.status = 'C'
                    """;
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(SQL);
            List<Map<String, Object>> platanja = new ArrayList<>();
            for (Map<String, Object> row : rows) {
                Map<String, Object> platio = new HashMap<>();
                platio.put("studentId", ((Number) row.get("studentId")).intValue());
                platio.put("kursId", ((Number) row.get("kursId")).intValue());
                platio.put("datumPlacanja", (java.sql.Date) row.get("datumPlacanja"));
                platio.put("cenaPlacanja", ((Number) row.get("cenaPlacanja")).intValue());
                platio.put("nazivKursa", (String) row.get("naziv"));
                platio.put("status", (String) row.get("status"));
                platio.put("tip", (String) row.get("tip"));
                platio.put("url", (String) row.get("url"));
                platio.put("ime", (String) row.get("ime"));
                platio.put("prezime", (String) row.get("prezime"));
                platio.put("email", (String) row.get("email"));

                platanja.add(platio);
            }
            return ResponseEntity.ok(Map.of("data",platanja));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Greška prilikom dohvatanja podataka"));
        }
    }

    public ResponseEntity<Map<String, Object>> updatePaymentStatus(Integer studentId, Integer kursId, String newStatus) {
        try {
            String SQL = "UPDATE platio SET status = ? WHERE studentId = ? AND kursId = ?";
            int rowsAffected = jdbcTemplate.update(SQL, newStatus, studentId, kursId);

            if (rowsAffected > 0) {
                return ResponseEntity.ok(Map.of("message", "Status plaćanja uspešno ažuriran"));
            } else {
                return ResponseEntity.status(404).body(Map.of("error", "Plaćanje nije pronađeno"));
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Greška prilikom ažuriranja statusa plaćanja"));
        }
    }
    public ResponseEntity<Map<String,Object>> addNewPayment(Integer studentId,Integer kursId,String datumPlacanja,Integer cenaPlacanja,String status,String tip,String url){
        try {
            String SQL = "INSERT INTO platio (studentId, kursId, datumPlacanja, cenaPlacanja, status, tip, url) VALUES (?, ?, ?, ?, ?, ?, ?)";
            int rowsAffected = jdbcTemplate.update(SQL, studentId, kursId, datumPlacanja, cenaPlacanja, status, tip, url);

            if (rowsAffected > 0) {
                return ResponseEntity.ok(Map.of("message", "Novo plaćanje uspešno dodato"));
            } else {
                return ResponseEntity.status(400).body(Map.of("error", "Nije moguće dodati novo plaćanje"));
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Greška prilikom dodavanja novog plaćanja"));
        }

    }

}
