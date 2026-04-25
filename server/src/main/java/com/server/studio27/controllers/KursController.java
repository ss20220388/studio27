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
            String SQL = "Select * from kurs ORDER BY redosled ASC";
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
            String SQL = """
                        SELECT COUNT(*) AS brojKurseva
                        FROM kurs k
                        JOIN pohadja p ON k.kursId = p.kursId
                        WHERE p.studentId = ?
                        ORDER BY k.redosled ASC
                    """;

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

    public ResponseEntity<List<Map<String, Object>>> getKurseviUToku(int studentId) {
        try {
            String SQL = """
                        SELECT
                            k.kursId,
                            k.naziv,
                            k.slikaUrl,
                            COALESCE(AVG(procenti.procenat_lekcije), 0) AS progress
                        FROM kurs k
                        JOIN lekcija l ON l.kursId = k.kursId
                        JOIN (
                            SELECT
                                l2.lekcijaId,
                                l2.kursId,
                                COALESCE(SUM(COALESCE(o.procenat, 0)) / COUNT(v.videoId), 0) AS procenat_lekcije
                            FROM lekcija l2
                            JOIN video v ON v.lekcijaId = l2.lekcijaId
                            LEFT JOIN odgledao o
                              ON v.url COLLATE utf8mb4_general_ci = o.videoUrl COLLATE utf8mb4_general_ci
                             AND o.userId = ?
                            GROUP BY l2.lekcijaId, l2.kursId
                        ) procenti ON procenti.lekcijaId = l.lekcijaId
                        WHERE k.kursId IN (
                            SELECT DISTINCT k2.kursId
                            FROM kurs k2
                            JOIN lekcija l3 ON l3.kursId = k2.kursId
                            JOIN video v3 ON v3.lekcijaId = l3.lekcijaId
                            JOIN odgledao o3
                              ON v3.url COLLATE utf8mb4_general_ci = o3.videoUrl COLLATE utf8mb4_general_ci
                            WHERE o3.userId = ?
                              AND o3.procenat > 0
                              AND k2.kursId NOT IN (
                                  SELECT zavrseni.kursId
                                  FROM (
                                      SELECT l5.kursId
                                      FROM lekcija l5
                                      JOIN (
                                          SELECT v5.lekcijaId
                                          FROM video v5
                                          JOIN odgledao o5
                                            ON v5.url COLLATE utf8mb4_general_ci = o5.videoUrl COLLATE utf8mb4_general_ci
                                          WHERE o5.userId = ?
                                            AND o5.procenat > 85
                                          GROUP BY v5.lekcijaId
                                          HAVING COUNT(DISTINCT v5.videoId) = (
                                              SELECT COUNT(*)
                                              FROM video v6
                                              WHERE v6.lekcijaId = v5.lekcijaId
                                          )
                                      ) zavrsene_lekcije ON zavrsene_lekcije.lekcijaId = l5.lekcijaId
                                      GROUP BY l5.kursId
                                      HAVING COUNT(DISTINCT l5.lekcijaId) = (
                                          SELECT COUNT(*)
                                          FROM lekcija l6
                                          WHERE l6.kursId = l5.kursId
                                      )
                                  ) zavrseni
                              )
                        )
                        GROUP BY k.kursId, k.naziv, k.slikaUrl
                        ORDER BY k.redosled 
                    """;

            List<Map<String, Object>> rows = jdbcTemplate.queryForList(SQL, studentId, studentId, studentId);

            List<Map<String, Object>> result = new ArrayList<>();
            for (Map<String, Object> row : rows) {
                double progress = row.get("progress") != null
                        ? ((Number) row.get("progress")).doubleValue()
                        : 0.0;

                Map<String, Object> kurs = new HashMap<>();
                kurs.put("kursId", ((Number) row.get("kursId")).intValue());
                kurs.put("naziv", row.get("naziv"));
                kurs.put("slikaUrl", row.get("slikaUrl"));
                kurs.put("progress", Math.round(progress));
                result.add(kurs);
            }

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
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
                          
                          and p.status = 'P'
                          
                          
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
                ORDER BY k.redosled, l.lekcijaId
                """;
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(SQL);
        int currentKursId = -1;
        Map<String, Object> currentKursRow = null;
        List<Lekcija> lekcije = new ArrayList<>();

        for (Map<String, Object> row : rows) {
            int kursId = ((Number) row.get("kursId")).intValue();

            if (currentKursId != kursId) {
                // Dodaj prethodnji kurs ako postoji
                if (currentKursId != -1 && currentKursRow != null) {
                    kursevi.add(new Kurs(
                            currentKursId,
                            (String) currentKursRow.get("naziv"),
                            (String) currentKursRow.get("opis"),
                            ((Number) currentKursRow.get("cena")).intValue(),
                            ((Number) currentKursRow.get("trajanje")).intValue(),
                            (String) currentKursRow.get("slikaUrl"),
                            (String) currentKursRow.get("glavniKurs"),
                            (String) currentKursRow.get("komentarDole"),
                            (String) currentKursRow.get("komentarSredina"),
                            (String) currentKursRow.get("komentarGore"),
                            lekcije));
                }

                // Počni novi kurs
                lekcije = new ArrayList<>();
                currentKursId = kursId;
                currentKursRow = row;

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
                    System.out.println("Adding lekcija with ID: " + lekcijaId + " and " + urls.size()
                            + " video URLs to existing kurs ID: " + currentKursId);
                    lekcije.add(new Lekcija(
                            lekcijaId,
                            (String) row.get("nazivLekcije"),
                            (String) row.get("opisLekcije"),
                            urls));
                }
            }
        }

        // Dodaj poslednji kurs
        if (currentKursId != -1 && currentKursRow != null) {
            kursevi.add(new Kurs(
                    currentKursId,
                    (String) currentKursRow.get("naziv"),
                    (String) currentKursRow.get("opis"),
                    ((Number) currentKursRow.get("cena")).intValue(),
                    ((Number) currentKursRow.get("trajanje")).intValue(),
                    (String) currentKursRow.get("slikaUrl"),
                    (String) currentKursRow.get("glavniKurs"),
                    (String) currentKursRow.get("komentarDole"),
                    (String) currentKursRow.get("komentarSredina"),
                    (String) currentKursRow.get("komentarGore"),
                    lekcije));
        }

        return ResponseEntity.ok(kursevi);
    }

    public ResponseEntity<Map<String, Object>> getKursProdatoOvajMesec() {
        try {
            String SQL = """
                    Select kurs.naziv,
                    (Select count(*) from  platio p where p.kursId = kurs.kursId  and p.datumPlacanja like DATE_FORMAT(CURDATE(), '%Y-%m%') and p.status = 'P' ) as "prodato"
                    from kurs
                    ORDER BY kurs.redosled
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

    public ResponseEntity<Map<String, Object>> dodajKurs(Map<String, Object> kursData) {
        try {
            String SQL = "INSERT INTO kurs (naziv, opis, cena, trajanje, slikaUrl, glavniKurs, komentarDole, komentarSredina, komentarGore) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";

            jdbcTemplate.update(SQL,
                    kursData.get("naziv"),
                    kursData.get("opis"),
                    kursData.get("cena"),
                    kursData.get("trajanje"),
                    kursData.get("slikaUrl"),
                    kursData.get("glavniKurs"),
                    kursData.get("komentarDole"),
                    kursData.get("komentarSredina"),
                    kursData.get("komentarGore"));

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Kurs uspešno dodat.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    public ResponseEntity<Map<String, Object>> brisiKurs(int kursId) {

        try {
            System.err.println("Brisanje kursa sa ID: " + kursId);
            String SQLRecenzija = "DELETE FROM recenzija WHERE kursId = ?";
            jdbcTemplate.update(SQLRecenzija, kursId);

            String SQLPlatio = "DELETE FROM platio WHERE kursId = ?";
            jdbcTemplate.update(SQLPlatio, kursId);

            String SQLPohadja = "DELETE FROM pohadja WHERE kursId = ?";
            jdbcTemplate.update(SQLPohadja, kursId);

            String SQLVideo = "DELETE FROM video WHERE lekcijaId IN (SELECT lekcijaId FROM lekcija WHERE kursId = ?)";
            jdbcTemplate.update(SQLVideo, kursId);

            String SQLLekcije = "DELETE FROM lekcija WHERE kursId = ?";
            jdbcTemplate.update(SQLLekcije, kursId);

            String SQL = "DELETE FROM kurs WHERE kursId = ?";
            int rowsAffected = jdbcTemplate.update(SQL, kursId);

            Map<String, Object> response = new HashMap<>();
            if (rowsAffected > 0) {
                response.put("message", "Kurs uspešno obrisan.");
                return ResponseEntity.ok(response);
            } else {
                response.put("error", "Kurs nije pronađen.");
                return ResponseEntity.badRequest().body(response);
            }
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    public ResponseEntity<Map<String, Object>> dodajLekciju(int kursId, Map<String, Object> lekcijaData) {
        try {
            String SQL = "INSERT INTO lekcija (kursId, naziv, opis) VALUES (?, ?, ?)";

            jdbcTemplate.update(SQL,
                    kursId,
                    lekcijaData.get("naziv"),
                    lekcijaData.get("opis"));

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Lekcija uspešno dodata.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    public ResponseEntity<Map<String, Object>> promeniKurs(int kursId, Map<String, Object> kursData) {
        try {
            String SQL = "UPDATE kurs SET naziv=?, opis=?, cena=?, trajanje=?, slikaUrl=?, glavniKurs=?, komentarDole=?, komentarSredina=?, komentarGore=? WHERE kursId=?";

            int rowsAffected = jdbcTemplate.update(SQL,
                    kursData.get("naziv"),
                    kursData.get("opis"),
                    kursData.get("cena"),
                    kursData.get("trajanje"),
                    kursData.get("slikaUrl"),
                    kursData.get("glavniKurs"),
                    kursData.get("komentarDole"),
                    kursData.get("komentarSredina"),
                    kursData.get("komentarGore"),
                    kursId);

            Map<String, Object> response = new HashMap<>();
            if (rowsAffected > 0) {
                response.put("message", "Kurs uspešno ažuriran.");
                return ResponseEntity.ok(response);
            } else {
                response.put("error", "Kurs nije pronađen.");
                return ResponseEntity.badRequest().body(response);
            }
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    public ResponseEntity<Map<String, Object>> brisiLekciju(int kursId, int lekcijaId) {
        try {
            // Prvo brisanje evidencije pohadjanja lekcije
            String SQLStudentLekcija = "DELETE FROM student_lekcija WHERE lekcijaId = ?";
            jdbcTemplate.update(SQLStudentLekcija, lekcijaId);

            // Zatim brisanje svih videa koji pripadaju toj lekciji
            String deleteVideosSQL = "DELETE FROM video WHERE lekcijaId = ?";
            jdbcTemplate.update(deleteVideosSQL, lekcijaId);

            // Zatim brisanje same lekcije uz proveru kursId-a zbog sigurnosti
            String SQL = "DELETE FROM lekcija WHERE lekcijaId = ? AND kursId = ?";
            int rowsAffected = jdbcTemplate.update(SQL, lekcijaId, kursId);

            Map<String, Object> response = new HashMap<>();
            if (rowsAffected > 0) {
                response.put("message", "Lekcija i njeni videi su uspešno obrisani.");
                return ResponseEntity.ok(response);
            } else {
                response.put("error", "Lekcija nije pronađena ili ne pripada navedenom kursu.");
                return ResponseEntity.badRequest().body(response);
            }
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    public ResponseEntity<Map<String, Object>> brisiVideoByUrl(int lekcijaId, String videoUrl) {
        try {
            String SQL = "DELETE FROM video WHERE url = ? AND lekcijaId = ?";
            int rowsAffected = jdbcTemplate.update(SQL, videoUrl, lekcijaId);

            Map<String, Object> response = new HashMap<>();
            if (rowsAffected > 0) {
                response.put("message", "Video uspešno obrisan.");
                return ResponseEntity.ok(response);
            } else {
                response.put("error", "Video nije pronađen ili ne pripada navedenoj lekciji.");
                return ResponseEntity.badRequest().body(response);
            }
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

}
