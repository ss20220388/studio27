package com.server.studio27.services;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

// Popust kursa (npr. Black Friday): uključuje se u adminu, uz procenat i novu cenu.
// Važi dok je uključen, od "popustOd" do "popustDo" (ako su upisani, po beogradskom vremenu).
// Procenat važi i za pakete kursa; nova cena kursa je ona upisana u adminu.
// Sve cene za plaćanje idu kroz cenaKursa(), da sajt, uplatnice i kartice računaju isto.
@Service
public class PopustService {

    public static final ZoneId ZONA = ZoneId.of("Europe/Belgrade");

    public static final String KOLONE =
            "popustUkljucen, popustProcenat, popustCena, popustOd, popustDo, popustOznaka, popustNaslov, popustTekst, popustBoja, popustSlika";

    private final JdbcTemplate jdbc;

    public PopustService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    // Red tabele kurs (cena + kolone popusta) -> podaci o popustu za sajt i admin
    public static Map<String, Object> podaci(Map<String, Object> red) {
        Map<String, Object> p = new HashMap<>();
        LocalDateTime doKada = vreme(red.get("popustDo"));
        p.put("ukljucen", istina(red.get("popustUkljucen")));
        p.put("procenat", procenat(red));
        p.put("cena", red.get("popustCena") instanceof Number n ? n.intValue() : null);
        LocalDateTime odKada = vreme(red.get("popustOd"));
        p.put("od", odKada == null ? null : odKada.toString());
        p.put("do", doKada == null ? null : doKada.toString());
        // za odbrojavanje na sajtu (milisekunde od 1970, nezavisno od vremenske zone posetioca)
        p.put("doMs", doKada == null ? null : doKada.atZone(ZONA).toInstant().toEpochMilli());
        p.put("oznaka", red.get("popustOznaka"));
        p.put("naslov", red.get("popustNaslov"));
        p.put("tekst", red.get("popustTekst"));
        p.put("boja", red.get("popustBoja"));
        p.put("slika", red.get("popustSlika"));
        boolean traje = traje(red);
        p.put("traje", traje);
        p.put("novaCena", traje ? cenaKursa(red) : null);
        return p;
    }

    // Da li popust trenutno važi
    public static boolean traje(Map<String, Object> red) {
        if (!istina(red.get("popustUkljucen"))) return false;
        BigDecimal procenat = procenat(red);
        if (procenat == null || procenat.signum() <= 0 || procenat.compareTo(BigDecimal.valueOf(100)) >= 0) return false;
        return uRoku(vreme(red.get("popustOd")), vreme(red.get("popustDo")));
    }

    // sada je između početka i kraja (prazno = bez ograničenja)
    private static boolean uRoku(LocalDateTime od, LocalDateTime doKada) {
        LocalDateTime sada = LocalDateTime.now(ZONA);
        return (od == null || !sada.isBefore(od)) && (doKada == null || sada.isBefore(doKada));
    }

    // Cena kursa (bez paketa) sa popustom: upisana nova cena, a ako je nema, cena umanjena za procenat
    private static int cenaKursa(Map<String, Object> red) {
        int cena = red.get("cena") instanceof Number n ? n.intValue() : 0;
        if (red.get("popustCena") instanceof Number nova && nova.intValue() > 0) return nova.intValue();
        return umanji(cena, procenat(red));
    }

    private static int umanji(int cena, BigDecimal procenat) {
        return BigDecimal.valueOf(cena)
                .multiply(BigDecimal.valueOf(100).subtract(procenat))
                .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP)
                .intValue();
    }

    private static BigDecimal procenat(Map<String, Object> red) {
        Object o = red.get("popustProcenat");
        if (o instanceof BigDecimal b) return b;
        if (o instanceof Number n) return BigDecimal.valueOf(n.doubleValue());
        return null;
    }

    private static boolean istina(Object o) {
        if (o instanceof Boolean b) return b;
        if (o instanceof Number n) return n.intValue() != 0;
        return false;
    }

    private static LocalDateTime vreme(Object o) {
        if (o instanceof LocalDateTime l) return l;
        if (o instanceof Timestamp t) return t.toLocalDateTime();
        return null;
    }

    // Popust svih kurseva (kursId -> podaci), za liste kurseva
    public Map<Integer, Map<String, Object>> sviKursevi() {
        Map<Integer, Map<String, Object>> mapa = new HashMap<>();
        for (Map<String, Object> red : jdbc.queryForList("SELECT kursId, cena, " + KOLONE + " FROM kurs")) {
            mapa.put(((Number) red.get("kursId")).intValue(), podaci(red));
        }
        return mapa;
    }

    public Map<String, Object> zaKurs(long kursId) {
        List<Map<String, Object>> redovi = jdbc.queryForList("SELECT kursId, cena, " + KOLONE + " FROM kurs WHERE kursId = ?", kursId);
        return redovi.isEmpty() ? null : podaci(redovi.get(0));
    }

    public record Cena(Integer cena, Long paketId) {}

    // Cena koju kupac plaća (EUR): cena paketa (ako paket pripada kursu) ili cena kursa, uz popust ako traje.
    // Vraća cenu null ako kurs ne postoji.
    public Cena cenaKursa(long kursId, Long paketId) {
        List<Map<String, Object>> redovi = jdbc.queryForList("SELECT kursId, cena, " + KOLONE + " FROM kurs WHERE kursId = ?", kursId);
        if (redovi.isEmpty()) return new Cena(null, null);
        Map<String, Object> kurs = redovi.get(0);
        boolean traje = traje(kurs);

        if (paketId != null) {
            List<Map<String, Object>> paket = jdbc.queryForList("SELECT cena, cenaPopust FROM paket WHERE paketId = ? AND kursId = ?", paketId, kursId);
            if (!paket.isEmpty()) {
                int cena = ((Number) paket.get(0).get("cena")).intValue();
                return new Cena(traje ? cenaPaketa(cena, paket.get(0).get("cenaPopust"), procenat(kurs)) : cena, paketId);
            }
        }
        int cena = kurs.get("cena") instanceof Number n ? n.intValue() : 0;
        return new Cena(traje ? cenaKursa(kurs) : cena, null);
    }

    // Cena paketa sa popustom kursa (za prikaz paketa na sajtu)
    public Map<Long, Integer> ceneSaPopustomPaketa(long kursId) {
        Map<Long, Integer> mapa = new HashMap<>();
        List<Map<String, Object>> redovi = jdbc.queryForList("SELECT kursId, cena, " + KOLONE + " FROM kurs WHERE kursId = ?", kursId);
        if (redovi.isEmpty() || !traje(redovi.get(0))) return mapa;
        BigDecimal procenat = procenat(redovi.get(0));
        jdbc.query("SELECT paketId, cena, cenaPopust FROM paket WHERE kursId = ?",
                rs -> {
                    int nova = cenaPaketa(rs.getInt("cena"), rs.getObject("cenaPopust"), procenat);
                    if (nova < rs.getInt("cena")) mapa.put(rs.getLong("paketId"), nova); // paket bez popusta ostaje bez precrtane cene
                }, kursId);
        return mapa;
    }

    // Paket na popustu: njegova cena upisana u adminu, inače procenat kursa.
    // Upisana redovna cena znači da taj paket nije na popustu.
    private static int cenaPaketa(int cena, Object cenaPopust, BigDecimal procenat) {
        if (cenaPopust instanceof Number n && n.intValue() > 0 && n.intValue() <= cena) return n.intValue();
        return umanji(cena, procenat);
    }

    // Akcija na početnoj (poseban vizual, nezavisan od kursa)
    public Map<String, Object> akcija() {
        List<Map<String, Object>> redovi = jdbc.queryForList("SELECT * FROM akcija WHERE id = 1");
        Map<String, Object> red = redovi.isEmpty() ? Map.of() : redovi.get(0);
        Map<String, Object> a = new HashMap<>();
        LocalDateTime doKada = vreme(red.get("doKada"));
        boolean ukljucen = istina(red.get("ukljucen"));
        a.put("ukljucen", ukljucen);
        LocalDateTime odKada = vreme(red.get("odKada"));
        a.put("traje", ukljucen && uRoku(odKada, doKada));
        a.put("od", odKada == null ? null : odKada.toString());
        a.put("do", doKada == null ? null : doKada.toString());
        a.put("doMs", doKada == null ? null : doKada.atZone(ZONA).toInstant().toEpochMilli());
        for (String k : List.of("oznaka", "naslov", "tekst", "boja", "slika", "dugme", "link")) a.put(k, red.get(k));
        return a;
    }
}
