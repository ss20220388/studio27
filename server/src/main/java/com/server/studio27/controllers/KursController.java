package com.server.studio27.controllers;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import com.server.studio27.models.Kurs;
import com.server.studio27.models.Lekcija;

@Service
public class KursController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public ResponseEntity<Map<String, Object>> getAllKursevi() {
        try {
            String SQL = "Select * from kurs";
            List<Map<String, Object>> result = jdbcTemplate.queryForList(SQL);
            Map<String, Object> response = Map.of("kursevi", result);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("kursevi", null);
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    public ResponseEntity<Map<String, Object>> getBrojSvihKursevi(int studentId) {
        try {
            String SQL = "Select count(*) as brojKurseva from kurs k join platio p on k.kursId=p.kursId where p.studentId=?";

            Map<String, Object> result = jdbcTemplate.queryForMap(SQL, studentId);
            System.out.println("Query result: " + result);
            Map<String, Object> response = new HashMap<>();
            response.put("brojKurseva", ((Number) result.get("brojKurseva")).intValue());

            response.put("message", "Broj kurseva uspešno preuzet");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("brojKurseva", null);
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    public ResponseEntity<Map<String, Object>> getBrojOdgledanihKursevi(int studentId) {
        try {
            String SQL = "SELECT COUNT(*) as brojOdgledanihKurseva FROM kurs k Join pohadja p On k.kursId=p.kursId where p.studentId=? and (SELECT COUNT(*) FROM LEKCIJA l where l.kursId=k.kursId)=(select count(*) from student_lekcija sl join lekcija l on sl.lekcijaId=l.lekcijaId where sl.studentId=p.studentId and l.kursId=k.kursId);";

           Integer broj = jdbcTemplate.queryForObject(SQL, Integer.class, studentId);

        Map<String, Object> response = new HashMap<>();
        response.put("brojOdgledanihKurseva", broj != null ? broj : 0);
        response.put("message", "Broj kurseva uspešno preuzet");

        return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("brojOdgledanihKurseva", null);
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

   // ...existing code...

    public ResponseEntity<Map<String, Object>> getProgressChartStats(int studentId) {
        try {
            String SQL = """
                SELECT
                    (SELECT COUNT(*) FROM kurs) AS ukupno,
                    SUM(CASE WHEN odgledano_lekcija = ukupno_lekcija AND ukupno_lekcija > 0 THEN 1 ELSE 0 END) AS zavrseno,
                    SUM(CASE WHEN odgledano_lekcija > 0 AND odgledano_lekcija < ukupno_lekcija THEN 1 ELSE 0 END) AS uToku,
                    (SELECT COUNT(*) FROM kurs)
                        - SUM(CASE WHEN odgledano_lekcija = ukupno_lekcija AND ukupno_lekcija > 0 THEN 1 ELSE 0 END)
                        - SUM(CASE WHEN odgledano_lekcija > 0 AND odgledano_lekcija < ukupno_lekcija THEN 1 ELSE 0 END)
                    AS nijePoceto
                FROM (
                    SELECT
                        k.kursId,
                        COUNT(DISTINCT l.lekcijaId) AS ukupno_lekcija,
                        COUNT(DISTINCT sl.lekcijaId) AS odgledano_lekcija
                    FROM kurs k
                    JOIN platio p ON k.kursId = p.kursId
                    LEFT JOIN lekcija l ON l.kursId = k.kursId
                    LEFT JOIN student_lekcija sl
                        ON sl.lekcijaId = l.lekcijaId
                        AND sl.studentId = p.studentId
                    WHERE p.studentId = ?
                    GROUP BY k.kursId
                ) stats;
            """;

            Map<String, Object> result = jdbcTemplate.queryForMap(SQL, studentId);

            int zavrseno = ((Number) result.get("zavrseno")).intValue();
            int uToku = ((Number) result.get("uToku")).intValue();
            int nijePoceto = ((Number) result.get("nijePoceto")).intValue();
            int ukupno = ((Number) result.get("ukupno")).intValue();

            Map<String, Object> response = new HashMap<>();
            response.put("zavrseno", zavrseno);
            response.put("uToku", uToku);
            response.put("nijePoceto", nijePoceto);
            response.put("ukupno", ukupno);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("zavrseno", 0);
            response.put("uToku", 0);
            response.put("nijePoceto", 0);
            response.put("ukupno", 0);
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    // ...existing code...

    public ResponseEntity<List<Map<String, Object>>> getKurseviUToku(int studentId) {
        try {
            String SQL = """
                SELECT
                    k.kursId,
                    k.naziv,
                    k.slikaUrl,
                    COUNT(DISTINCT l.lekcijaId) AS ukupno_lekcija,
                    COUNT(DISTINCT sl.lekcijaId) AS odgledano_lekcija
                FROM kurs k
                JOIN platio p ON k.kursId = p.kursId
                LEFT JOIN lekcija l ON l.kursId = k.kursId
                LEFT JOIN student_lekcija sl
                    ON sl.lekcijaId = l.lekcijaId
                    AND sl.studentId = p.studentId
                WHERE p.studentId = ?
                GROUP BY k.kursId, k.naziv, k.slikaUrl
                HAVING COUNT(DISTINCT sl.lekcijaId) > 0
                    AND COUNT(DISTINCT sl.lekcijaId) < COUNT(DISTINCT l.lekcijaId)
            """;

            List<Map<String, Object>> rows = jdbcTemplate.queryForList(SQL, studentId);

            List<Map<String, Object>> result = new ArrayList<>();
            for (Map<String, Object> row : rows) {
                int ukupno = ((Number) row.get("ukupno_lekcija")).intValue();
                int odgledano = ((Number) row.get("odgledano_lekcija")).intValue();
                int progress = ukupno > 0 ? (odgledano * 100 / ukupno) : 0;

                Map<String, Object> kurs = new HashMap<>();
                kurs.put("kursId", ((Number) row.get("kursId")).intValue());
                kurs.put("naziv", row.get("naziv"));
                kurs.put("slikaUrl", row.get("slikaUrl"));
                kurs.put("progress", progress);
                result.add(kurs);
            }

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

// ...existing code...
// ...existing code...

    public ResponseEntity<Map<String, Object>> getBrojUTokuKursevi(int studentId) {
        try {
            String SQL = """
                SELECT COUNT(*) AS brojKursevaUToku
                FROM kurs k
                JOIN platio p ON k.kursId = p.kursId
                WHERE p.studentId = ?
                  AND (
                    SELECT COUNT(*)
                    FROM student_lekcija sl
                    JOIN lekcija l ON sl.lekcijaId = l.lekcijaId
                    WHERE sl.studentId = p.studentId
                      AND l.kursId = k.kursId
                  ) > 0
                  AND (
                    SELECT COUNT(*)
                    FROM student_lekcija sl
                    JOIN lekcija l ON sl.lekcijaId = l.lekcijaId
                    WHERE sl.studentId = p.studentId
                      AND l.kursId = k.kursId
                  ) < (
                    SELECT COUNT(*)
                    FROM lekcija l
                    WHERE l.kursId = k.kursId
                  );
            """;

            Integer broj = jdbcTemplate.queryForObject(SQL, Integer.class, studentId);

            Map<String, Object> response = new HashMap<>();
            response.put("brojUTokuKurseva", broj != null ? broj : 0);
            response.put("message", "Broj kurseva uspešno preuzet");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("brojUTokuKurseva", null);
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

// ...existing code...
    public ResponseEntity<Kurs> getKursSaLekcijama(int id) {
        try {
            String SQL = ""
                    + //
                    "SELECT"
                    + " k.kursId,"
                    +//
                    " k.naziv,"
                    +//
                    " k.opis,"
                    +//
                    " k.cena,"
                    +//
                    " k.trajanje,"
                    +//
                    " k.slikaUrl,"
                    +//
                    " l.lekcijaId,"
                    +//
                    " l.naziv AS nazivLekcije,"
                    +//
                    " l.opis AS opisLekcije"
                    +//
                    " FROM Kurs k"
                    +//
                    " LEFT JOIN lekcija l USING(kursId)"
                    +//
                    " WHERE k.kursId = ?"
                    +//
                    "";
            System.out.println("Executing SQL: " + SQL + " with id: " + id);

            List<Map<String, Object>> rows = jdbcTemplate.queryForList(SQL, id);
            System.out.println("Query returned " + rows.size() + " rows");

            if (rows.isEmpty()) {
                return ResponseEntity.badRequest().build();
            }

            List<Lekcija> lekcije = new ArrayList<>();
            if (rows.get(0).get("lekcijaId") != null) {
                for (Map<String, Object> row : rows) {

                    lekcije.add(new Lekcija(
                            ((Number) row.get("lekcijaId")).intValue(),
                            (String) row.get("nazivLekcije"),
                            (String) row.get("opisLekcije")
                    ));
                }
            }
            System.out.println("Parsed " + lekcije.size() + " lekcije for kursId: " + id);

            Map<String, Object> first = rows.get(0);

            Kurs kurs = new Kurs(
                    ((Number) first.get("kursId")).intValue(),
                    (String) first.get("naziv"),
                    (String) first.get("opis"),
                    ((Number) first.get("cena")).intValue(),
                    ((Number) first.get("trajanje")).intValue(),
                    (String) first.get("slikaUrl"),
                    lekcije
            );
            System.out.println("Constructed Kurs object: " + kurs.getNaziv() + " with " + lekcije.size() + " lekcije");

            return ResponseEntity.ok(kurs);

        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    public ResponseEntity<List<Kurs>> getAllKurseviSaLekcijama() {
        List<Kurs> kursevi = new ArrayList<>();
        String SQL = "Select kursId,k.naziv as \"Naziv kursa\",k.opis as \"Opis kursa\", cena, trajanje as \"Trajanje u danima\", slikaUrl as \"Slika kursa\",lekcijaId, l.naziv as \"Naziv  lekcije\",\nl.opis as \"Opis lekcije\", url as \"Video url\" from Kurs k\n"
                + "left join Lekcija l using(kursId)\n"
                + "left join Video  v using(lekcijaId)\n"
                + "Group by kursId,lekcijaId,videoId;";
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(SQL);
        int currentKursId = -1;
        List<Lekcija> lekcije = new ArrayList<>();
        for (Map<String, Object> row : rows) {
            int kursId = ((Number) row.get("kursId")).intValue();

            if (currentKursId != kursId) {
                lekcije = new ArrayList<>();
                lekcije.add(new Lekcija(
                        ((Number) row.get("lekcijaId")).intValue(),
                        (String) row.get("Naziv  lekcije"),
                        (String) row.get("Opis lekcije"),
                        (String) row.get("Video url")));
                kursevi.add(new Kurs(
                        kursId,
                        (String) row.get("Naziv kursa"),
                        (String) row.get("Opis kursa"),
                        ((Number) row.get("cena")).intValue(),
                        ((Number) row.get("Trajanje u danima")).intValue(),
                        (String) row.get("Slika kursa"),
                        lekcije));

                currentKursId = kursId;
            } else {
                lekcije.add(new Lekcija(
                        ((Number) row.get("lekcijaId")).intValue(),
                        (String) row.get("Naziv  lekcije"),
                        (String) row.get("Opis lekcije"),
                        (String) row.get("Video url")));
            }

        }
        return ResponseEntity.ok(kursevi);
    }

}
