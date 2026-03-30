package com.server.studio27.routes;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/progres")
public class ProgressRoute {

    private final JdbcTemplate jdbcTemplate;

    public ProgressRoute(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    // 1) Sve zavrsene lekcije za korisnika
    @GetMapping("/zavrsene-lekcije")
    public List<Integer> getZavrseneLekcije(@RequestParam Integer userId) {
        String sql = """
            SELECT v.lekcijaId
            FROM video v
            JOIN odgledao o
              ON v.url COLLATE utf8mb4_general_ci = o.videoUrl COLLATE utf8mb4_general_ci
            WHERE o.userId = ?
              AND o.procenat > 85
            GROUP BY v.lekcijaId
            HAVING COUNT(DISTINCT v.videoId) = (
                SELECT COUNT(*)
                FROM video v2
                WHERE v2.lekcijaId = v.lekcijaId
            )
            """;

        return jdbcTemplate.queryForList(sql, Integer.class, userId);
    }

    // 2) Broj zavrsenih lekcija za korisnika
    @GetMapping("/broj-zavrsenih-lekcija")
    public Map<String, Object> getBrojZavrsenihLekcija(@RequestParam Integer userId) {
        String sql = """
            SELECT COUNT(*) 
            FROM (
                SELECT v.lekcijaId
                FROM video v
                JOIN odgledao o
                  ON v.url COLLATE utf8mb4_general_ci = o.videoUrl COLLATE utf8mb4_general_ci
                WHERE o.userId = ?
                  AND o.procenat > 85
                GROUP BY v.lekcijaId
                HAVING COUNT(DISTINCT v.videoId) = (
                    SELECT COUNT(*)
                    FROM video v2
                    WHERE v2.lekcijaId = v.lekcijaId
                )
            ) AS zavrsene
            """;

        Integer broj = jdbcTemplate.queryForObject(sql, Integer.class, userId);
        return Map.of("userId", userId, "brojZavrsenihLekcija", broj != null ? broj : 0);
    }

    // 3) Sve zavrsene kurseve za korisnika
    @GetMapping("/zavrseni-kursevi")
    public List<Integer> getZavrseniKursevi(@RequestParam Integer userId) {
        String sql = """
            SELECT l.kursId
            FROM lekcija l
            JOIN (
                SELECT v.lekcijaId
                FROM video v
                JOIN odgledao o
                  ON v.url COLLATE utf8mb4_general_ci = o.videoUrl COLLATE utf8mb4_general_ci
                WHERE o.userId = ?
                  AND o.procenat > 85
                GROUP BY v.lekcijaId
                HAVING COUNT(DISTINCT v.videoId) = (
                    SELECT COUNT(*)
                    FROM video v2
                    WHERE v2.lekcijaId = v.lekcijaId
                )
            ) zavrsene_lekcije ON zavrsene_lekcije.lekcijaId = l.lekcijaId
            GROUP BY l.kursId
            HAVING COUNT(DISTINCT l.lekcijaId) = (
                SELECT COUNT(*)
                FROM lekcija l2
                WHERE l2.kursId = l.kursId
            )
            """;

        return jdbcTemplate.queryForList(sql, Integer.class, userId);
    }

    // 4) Broj zavrsenih kurseva za korisnika
    @GetMapping("/broj-zavrsenih-kurseva")
    public Map<String, Object> getBrojZavrsenihKurseva(@RequestParam Integer userId) {
        String sql = """
            SELECT COUNT(*)
            FROM (
                SELECT l.kursId
                FROM lekcija l
                JOIN (
                    SELECT v.lekcijaId
                    FROM video v
                    JOIN odgledao o
                      ON v.url COLLATE utf8mb4_general_ci = o.videoUrl COLLATE utf8mb4_general_ci
                    WHERE o.userId = ?
                      AND o.procenat > 85
                    GROUP BY v.lekcijaId
                    HAVING COUNT(DISTINCT v.videoId) = (
                        SELECT COUNT(*)
                        FROM video v2
                        WHERE v2.lekcijaId = v.lekcijaId
                    )
                ) zavrsene_lekcije ON zavrsene_lekcije.lekcijaId = l.lekcijaId
                GROUP BY l.kursId
                HAVING COUNT(DISTINCT l.lekcijaId) = (
                    SELECT COUNT(*)
                    FROM lekcija l2
                    WHERE l2.kursId = l.kursId
                )
            ) AS zavrseni_kursevi
            """;

        Integer broj = jdbcTemplate.queryForObject(sql, Integer.class, userId);
        return Map.of("userId", userId, "brojZavrsenihKurseva", broj != null ? broj : 0);
    }

    // 5) Broj kurseva u toku
    // Kurs u toku = nije zavrsen, ali ima bar neku aktivnost na nekom videu iz tog kursa
    @GetMapping("/broj-kurseva-u-toku")
    public Map<String, Object> getBrojKursevaUToku(@RequestParam Integer userId) {
        String sql = """
            SELECT COUNT(DISTINCT l.kursId)
            FROM lekcija l
            JOIN video v ON v.lekcijaId = l.lekcijaId
            JOIN odgledao o
              ON v.url COLLATE utf8mb4_general_ci = o.videoUrl COLLATE utf8mb4_general_ci
            WHERE o.userId = ?
              AND o.procenat > 0
              AND l.kursId NOT IN (
                  SELECT zavrseni.kursId
                  FROM (
                      SELECT l3.kursId
                      FROM lekcija l3
                      JOIN (
                          SELECT v3.lekcijaId
                          FROM video v3
                          JOIN odgledao o3
                            ON v3.url COLLATE utf8mb4_general_ci = o3.videoUrl COLLATE utf8mb4_general_ci
                          WHERE o3.userId = ?
                            AND o3.procenat > 85
                          GROUP BY v3.lekcijaId
                          HAVING COUNT(DISTINCT v3.videoId) = (
                              SELECT COUNT(*)
                              FROM video v4
                              WHERE v4.lekcijaId = v3.lekcijaId
                          )
                      ) zavrsene_lekcije ON zavrsene_lekcije.lekcijaId = l3.lekcijaId
                      GROUP BY l3.kursId
                      HAVING COUNT(DISTINCT l3.lekcijaId) = (
                          SELECT COUNT(*)
                          FROM lekcija l4
                          WHERE l4.kursId = l3.kursId
                      )
                  ) zavrseni
              )
            """;

        Integer broj = jdbcTemplate.queryForObject(sql, Integer.class, userId, userId);
        return Map.of("userId", userId, "brojKursevaUToku", broj != null ? broj : 0);
    }

    // 6) Procenat jedne lekcije za korisnika
    // Procenat lekcije = suma procenata svih videa / broj videa
    @GetMapping("/procenat-lekcije")
    public Map<String, Object> getProcenatLekcije(
            @RequestParam Integer userId,
            @RequestParam Integer lekcijaId) {

        String sql = """
            SELECT COALESCE(SUM(COALESCE(o.procenat, 0)) / COUNT(v.videoId), 0)
            FROM video v
            LEFT JOIN odgledao o
              ON v.url COLLATE utf8mb4_general_ci = o.videoUrl COLLATE utf8mb4_general_ci
             AND o.userId = ?
            WHERE v.lekcijaId = ?
            """;

        Double procenat = jdbcTemplate.queryForObject(sql, Double.class, userId, lekcijaId);

        return Map.of(
                "userId", userId,
                "lekcijaId", lekcijaId,
                "procenatLekcije", procenat != null ? procenat : 0.0
        );
    }

    // 7) Procenat jednog kursa za korisnika
    // Procenat kursa = suma procenata svih lekcija / broj lekcija
    @GetMapping("/procenat-kursa")
    public Map<String, Object> getProcenatKursa(
            @RequestParam Integer userId,
            @RequestParam Integer kursId) {

        String sql = """
            SELECT COALESCE(AVG(procenti.procenat_lekcije), 0)
            FROM (
                SELECT l.lekcijaId,
                       COALESCE(SUM(COALESCE(o.procenat, 0)) / COUNT(v.videoId), 0) AS procenat_lekcije
                FROM lekcija l
                JOIN video v ON v.lekcijaId = l.lekcijaId
                LEFT JOIN odgledao o
                  ON v.url COLLATE utf8mb4_general_ci = o.videoUrl COLLATE utf8mb4_general_ci
                 AND o.userId = ?
                WHERE l.kursId = ?
                GROUP BY l.lekcijaId
            ) procenti
            """;

        Double procenat = jdbcTemplate.queryForObject(sql, Double.class, userId, kursId);

        return Map.of(
                "userId", userId,
                "kursId", kursId,
                "procenatKursa", procenat != null ? procenat : 0.0
        );
    }

    // 8) Svi procenti lekcija za korisnika
    @GetMapping("/svi-procenti-lekcija")
    public List<Map<String, Object>> getSviProcentiLekcija(@RequestParam Integer userId) {
        String sql = """
            SELECT v.lekcijaId AS lekcijaId,
                   COALESCE(SUM(COALESCE(o.procenat, 0)) / COUNT(v.videoId), 0) AS procenatLekcije
            FROM video v
            LEFT JOIN odgledao o
              ON v.url COLLATE utf8mb4_general_ci = o.videoUrl COLLATE utf8mb4_general_ci
             AND o.userId = ?
            GROUP BY v.lekcijaId
            ORDER BY v.lekcijaId
            """;

        return jdbcTemplate.queryForList(sql, userId);
    }

    // 9) Svi procenti kurseva za korisnika
    @GetMapping("/svi-procenti-kurseva")
    public List<Map<String, Object>> getSviProcentiKurseva(@RequestParam Integer userId) {
        String sql = """
            SELECT l.kursId AS kursId,
                   COALESCE(AVG(procenti.procenat_lekcije), 0) AS procenatKursa
            FROM lekcija l
            JOIN (
                SELECT l2.lekcijaId,
                       l2.kursId,
                       COALESCE(SUM(COALESCE(o.procenat, 0)) / COUNT(v.videoId), 0) AS procenat_lekcije
                FROM lekcija l2
                JOIN video v ON v.lekcijaId = l2.lekcijaId
                LEFT JOIN odgledao o
                  ON v.url COLLATE utf8mb4_general_ci = o.videoUrl COLLATE utf8mb4_general_ci
                 AND o.userId = ?
                GROUP BY l2.lekcijaId, l2.kursId
            ) procenti ON procenti.lekcijaId = l.lekcijaId
            GROUP BY l.kursId
            ORDER BY l.kursId
            """;

        return jdbcTemplate.queryForList(sql, userId);
    }
}