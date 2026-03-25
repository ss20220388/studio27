package com.server.studio27.controllers;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.RestController;

import com.server.studio27.models.Kurs;
import com.server.studio27.models.Lekcija;

@RestController
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

    public ResponseEntity<Map<String, Object>> getBrojUTokuKursevi1(int studentId) {
        try {
            String SQL = "SELECT COUNT(*) as brojKursevaUToku FROM kurs k Join pohadja p On k.kursId=p.kursId where p.studentId=? and (SELECT COUNT(*) FROM student_lekcija sl join lekcija l on sl.lekcijaId=l.lekcijaId where sl.studentId=p.studentId and l.kursId=k.kursId)=(select count(*) from lekcija l where l.kursId=k.kursId);";
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
            String SQL = """
                    SELECT
                     k.kursId,
                     k.naziv,
                    k.opis,
                    k.cena,
                    k.glavniKurs,
                    k.komentarDole,
                    k.komentarSredina,
                    k.komentarGore,
                     k.trajanje,
                     k.slikaUrl,
                     l.lekcijaId,
                     l.naziv AS nazivLekcije,
                     l.opis AS opisLekcije
                    FROM kurs k
                    LEFT JOIN lekcija l USING(kursId)
                     WHERE k.kursId = ?
                    """;
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
                            (String) row.get("opisLekcije")));
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
                    (String) first.get("glavniKurs"),
                    (String) first.get("komentarDole"),
                    (String) first.get("komentarSredina"),
                    (String) first.get("komentarGore"),
                    lekcije);
            System.out.println("Constructed Kurs object: " + kurs.getNaziv() + " with " + lekcije.size() + " lekcije");

            return ResponseEntity.ok(kurs);

        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    public ResponseEntity<List<Kurs>> getAllKurseviSaLekcijama() {
        List<Kurs> kursevi = new ArrayList<>();
        String SQL = """
                SELECT
                    k.kursId,
                    k.naziv,
                    k.opis,
                    k.cena,
                    k.trajanje,
                    k.slikaUrl,
                    k.glavniKurs,
                    k.komentarDole,
                    k.komentarSredina,
                    k.komentarGore,
                    l.lekcijaId,
                    l.naziv AS nazivLekcije,
                    l.opis AS opisLekcije
                FROM kurs k
                LEFT JOIN lekcija l USING(kursId)
                ORDER BY k.kursId, l.lekcijaId
                """;
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(SQL);
        int currentKursId = -1;
        List<Lekcija> lekcije = new ArrayList<>();

        for (Map<String, Object> row : rows) {
            int kursId = ((Number) row.get("kursId")).intValue();

            if (currentKursId != kursId) {
                // Dodaj prethodnji kurs ako postoji
                if (currentKursId != -1) {
                    kursevi.add(new Kurs(
                            currentKursId,
                            (String) row.get("naziv"),
                            (String) row.get("opis"),
                            ((Number) row.get("cena")).intValue(),
                            ((Number) row.get("trajanje")).intValue(),
                            (String) row.get("slikaUrl"),
                            (String) row.get("glavniKurs"),
                            (String) row.get("komentarDole"),
                            (String) row.get("komentarSredina"),
                            (String) row.get("komentarGore"),
                            lekcije));
                }

                // Počni novi kurs
                lekcije = new ArrayList<>();
                currentKursId = kursId;

                if (row.get("lekcijaId") != null) {
                    String sqlVideos = "SELECT url FROM video WHERE lekcijaId = ?";
                    int lekcijaId = ((Number) row.get("lekcijaId")).intValue();
                    List<Map<String, Object>> videoRows = jdbcTemplate.queryForList(sqlVideos, lekcijaId);

                    List<String> urls = new ArrayList<>();
                    for (Map<String, Object> videoRow : videoRows) {
                        urls.add((String) videoRow.get("url"));
                    }
                    System.out.println("Adding lekcija with ID: " + lekcijaId + " and " + urls.size() + " video URLs");

                    lekcije.add(new Lekcija(
                            lekcijaId,
                            (String) row.get("nazivLekcije"),
                            (String) row.get("opisLekcije"),
                            urls));
                }
            } else {
                if (row.get("lekcijaId") != null) {
                    String sqlVideos = "SELECT url FROM video WHERE lekcijaId = ?";
                    int lekcijaId = ((Number) row.get("lekcijaId")).intValue();
                    List<Map<String, Object>> videoRows = jdbcTemplate.queryForList(sqlVideos, lekcijaId);

                    List<String> urls = new ArrayList<>();
                    for (Map<String, Object> videoRow : videoRows) {
                        urls.add((String) videoRow.get("url"));
                    }
                    System.out.println("Adding lekcija with ID: " + lekcijaId + " and " + urls.size() + " video URLs to existing kurs ID: " + currentKursId);
                    lekcije.add(new Lekcija(
                            ((Number) row.get("lekcijaId")).intValue(),
                            (String) row.get("nazivLekcije"),
                            (String) row.get("opisLekcije"),
                            urls));
                }
            }
        }

        // Dodaj poslednji kurs
        if (currentKursId != -1 && !rows.isEmpty()) {
            Map<String, Object> lastRow = rows.get(rows.size() - 1);
            kursevi.add(new Kurs(
                    currentKursId,
                    (String) lastRow.get("naziv"),
                    (String) lastRow.get("opis"),
                    ((Number) lastRow.get("cena")).intValue(),
                    ((Number) lastRow.get("trajanje")).intValue(),
                    (String) lastRow.get("slikaUrl"),
                    (String) lastRow.get("glavniKurs"),
                    (String) lastRow.get("komentarDole"),
                    (String) lastRow.get("komentarSredina"),
                    (String) lastRow.get("komentarGore"),
                    lekcije));
        }

        return ResponseEntity.ok(kursevi);
    }

    public ResponseEntity<Map<String, Object>> getKursProdatoOvajMesec() {
        try {
            String SQL = """
                    Select kurs.naziv,
                    (Select count(*) from  platio p where p.kursId = kurs.kursId and p.datumPlacanja like DATE_FORMAT(CURDATE(), '%Y-%m%')) as "prodato"
                    from kurs
                    """;
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(SQL);
            Map<String, Object> response = new HashMap<>();
            response.put("data", rows);
            response.put("message", "Broj prodatih kurseva uspešno preuzet");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("data", null);
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

}
