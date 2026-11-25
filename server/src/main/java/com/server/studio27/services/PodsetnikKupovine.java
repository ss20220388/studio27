package com.server.studio27.services;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

// Podsetnik za napuštenu kupovinu.
// Kad prijavljen kupac otvori stranicu plaćanja (/pay), sajt to javi serveru (zabelezi) i nastaje zapis
// u napustena_kupovina. Ako kurs ne kupi, dobija mejl posle "prvi-sati" (3 dana) od poslednjeg dolaska
// na plaćanje. Drugi mejl se šalje samo ako je "drugi-sati" veći od "prvi-sati" (podrazumevano nema drugog). Kupljeni kursevi (platio P/C ili pohadja)
// se izbacuju iz podsetnika, a kad ne ostane nijedan, zapis se zatvara. Svaki mejl ima link za odjavu.
// Vremena se porede u bazi (NOW()), pa vremenska zona servera ne smeta.
@Service
public class PodsetnikKupovine {

    private static final int NAJVISE_POKUSAJA = 3;
    private static final SecureRandom SLUCAJNO = new SecureRandom();

    private final JdbcTemplate jdbc;
    private final MailService mailService;
    private final PopustService popustService;

    @Value("${podsetnik.ukljucen:true}")
    private boolean ukljucen;
    @Value("${podsetnik.prvi-sati:72}")
    private int prviSati;
    @Value("${podsetnik.drugi-sati:0}")
    private int drugiSati;

    public PodsetnikKupovine(JdbcTemplate jdbc, MailService mailService, PopustService popustService) {
        this.jdbc = jdbc;
        this.mailService = mailService;
        this.popustService = popustService;
    }

    // Kupac je na stranici plaćanja: pamti korpu (jedan otvoren zapis po kupcu; novi dolazak ga osvežava)
    public void zabelezi(String email, List<Long> kursIds, Map<Long, Long> paketi) {
        if (email == null || kursIds == null || kursIds.isEmpty()) return;
        List<Map<String, Object>> korisnik = jdbc.queryForList(
                "SELECT u.userId, s.ime FROM user u JOIN student s ON s.studentId = u.userId WHERE u.email = ?", email);
        if (korisnik.isEmpty()) return; // admini i nalozi bez studenta ne dobijaju podsetnike
        long studentId = ((Number) korisnik.get(0).get("userId")).longValue();
        String ime = (String) korisnik.get(0).get("ime");

        String kursevi = String.join(",", kursIds.stream().distinct().limit(20).map(String::valueOf).toList());
        String paketiCsv = paketi == null ? null : String.join(",", paketi.entrySet().stream()
                .filter(e -> e.getKey() != null && e.getValue() != null)
                .map(e -> e.getKey() + ":" + e.getValue()).toList());
        if (paketiCsv != null && paketiCsv.isEmpty()) paketiCsv = null;

        int izmenjeno = jdbc.update(
                "UPDATE napustena_kupovina SET kursIds = ?, paketIds = ?, email = ?, ime = ?, azurirano = NOW() "
                        + "WHERE studentId = ? AND zavrseno IS NULL",
                kursevi, paketiCsv, email, ime, studentId);
        if (izmenjeno == 0) {
            jdbc.update(
                    "INSERT INTO napustena_kupovina (studentId, email, ime, kursIds, paketIds, token) VALUES (?, ?, ?, ?, ?, ?)",
                    studentId, email, ime, kursevi, paketiCsv, noviToken());
        }
    }

    // Odjava sa podsetnika (link iz mejla); vraća false ako token ne postoji
    public boolean odjavi(String token) {
        if (token == null || !token.matches("[0-9a-f]{32,64}")) return false;
        List<String> email = jdbc.queryForList("SELECT email FROM napustena_kupovina WHERE token = ?", String.class, token);
        if (email.isEmpty()) return false;
        jdbc.update("INSERT IGNORE INTO podsetnik_odjava (email) VALUES (?)", email.get(0));
        jdbc.update("UPDATE napustena_kupovina SET zavrseno = NOW() WHERE email = ? AND zavrseno IS NULL", email.get(0));
        return true;
    }

    // Na svakih 15 minuta šalje podsetnike kojima je došlo vreme
    @Scheduled(initialDelay = 120_000, fixedDelay = 900_000)
    public void posaljiPodsetnike() {
        if (!ukljucen) return;
        List<Map<String, Object>> zapisi = jdbc.queryForList("""
                SELECT n.* FROM napustena_kupovina n
                WHERE n.zavrseno IS NULL AND n.pokusaja < ?
                  AND NOT EXISTS (SELECT 1 FROM podsetnik_odjava o WHERE o.email = n.email)
                  AND ((n.podsetnik1 IS NULL AND n.azurirano <= NOW() - INTERVAL ? HOUR)
                    OR (? AND n.podsetnik1 IS NOT NULL AND n.podsetnik2 IS NULL AND n.azurirano <= NOW() - INTERVAL ? HOUR
                        AND n.podsetnik1 <= NOW() - INTERVAL ? HOUR))
                """, NAJVISE_POKUSAJA, prviSati, imaDrugi(), drugiSati, Math.max(1, (drugiSati - prviSati) / 2));
        for (Map<String, Object> z : zapisi) {
            try {
                obradi(z);
            } catch (Exception e) {
                jdbc.update("UPDATE napustena_kupovina SET pokusaja = pokusaja + 1 WHERE id = ?", z.get("id"));
                System.err.println("[Podsetnik] Mejl nije poslat (zapis " + z.get("id") + "): " + e.getMessage());
            }
        }
    }

    private void obradi(Map<String, Object> z) throws Exception {
        long id = ((Number) z.get("id")).longValue();
        long studentId = ((Number) z.get("studentId")).longValue();
        Map<Long, Long> paketi = parsirajPakete((String) z.get("paketIds"));

        // samo kursevi koje još nije kupio (ni uplatnicom na čekanju)
        List<Long> nekupljeni = new ArrayList<>();
        for (String s : ((String) z.get("kursIds")).split(",")) {
            if (s.isBlank()) continue;
            long kursId = Long.parseLong(s.trim());
            Integer kupljen = jdbc.queryForObject(
                    "SELECT (SELECT COUNT(*) FROM platio WHERE studentId = ? AND kursId = ? AND status IN ('P', 'C')) "
                            + "+ (SELECT COUNT(*) FROM pohadja WHERE studentId = ? AND kursId = ?)",
                    Integer.class, studentId, kursId, studentId, kursId);
            if (kupljen == null || kupljen == 0) nekupljeni.add(kursId);
        }
        if (nekupljeni.isEmpty()) {
            jdbc.update("UPDATE napustena_kupovina SET zavrseno = NOW() WHERE id = ?", id);
            return;
        }

        boolean drugi = z.get("podsetnik1") != null;
        String token = (String) z.get("token");
        String ime = (String) z.get("ime");
        String mejl = sadrzaj(nekupljeni, paketi, ime, drugi, token);
        String naslov = drugi ? "Još uvek razmišljaš o kursu?" : "Tvoj kurs te čeka";
        String podnaslov = drugi ? "Poslednji podsetnik za kurs koji si izabrao/la" : "Kupovina nije završena";

        mailService.sendHtmlEmail((String) z.get("email"), naslov, podnaslov, mejl);
        jdbc.update(drugi
                ? "UPDATE napustena_kupovina SET podsetnik2 = NOW(), zavrseno = NOW(), pokusaja = 0 WHERE id = ?"
                : imaDrugi()
                        ? "UPDATE napustena_kupovina SET podsetnik1 = NOW(), pokusaja = 0 WHERE id = ?"
                        : "UPDATE napustena_kupovina SET podsetnik1 = NOW(), zavrseno = NOW(), pokusaja = 0 WHERE id = ?", id);
        System.out.println("[Podsetnik] Poslat " + (drugi ? "drugi" : "prvi") + " podsetnik (zapis " + id + ")");
    }

    private boolean imaDrugi() {
        return drugiSati > prviSati;
    }

    // HTML mejla: pozdrav, kursevi sa cenom (stara precrtana ako traje popust), dugme i odjava
    private String sadrzaj(List<Long> kursIds, Map<Long, Long> paketi, String ime, boolean drugi, String token) {
        String sajt = mailService.getFrontendUrl().replaceAll("/+$", "");
        StringBuilder stavke = new StringBuilder();
        String popustDo = null;
        Long prviKurs = null;
        for (Long kursId : kursIds) {
            List<Map<String, Object>> kurs = jdbc.queryForList("SELECT naziv, cena FROM kurs WHERE kursId = ?", kursId);
            if (kurs.isEmpty()) continue;
            if (prviKurs == null) prviKurs = kursId;
            String naziv = lepNaziv((String) kurs.get(0).get("naziv"));
            Long paketId = paketi.get(kursId);
            int redovna = ((Number) kurs.get(0).get("cena")).intValue();
            if (paketId != null) {
                List<Map<String, Object>> paket = jdbc.queryForList("SELECT naziv, cena FROM paket WHERE paketId = ? AND kursId = ?", paketId, kursId);
                if (!paket.isEmpty()) {
                    naziv += " — " + paket.get(0).get("naziv");
                    redovna = ((Number) paket.get(0).get("cena")).intValue();
                } else {
                    paketId = null;
                }
            }
            PopustService.Cena cena = popustService.cenaKursa(kursId, paketId);
            int sada = cena.cena() == null ? redovna : cena.cena();
            String cenaHtml = sada < redovna
                    ? "<span style='color:#a1a1aa;text-decoration:line-through;margin-right:8px'>" + redovna + " €</span><strong style='color:#e8c48f'>" + sada + " €</strong>"
                    : "<strong>" + sada + " €</strong>";
            stavke.append("<div class='invoice-row'><span>").append(esc(naziv)).append("</span><span>").append(cenaHtml).append("</span></div>");

            Map<String, Object> popust = popustService.zaKurs(kursId);
            if (sada < redovna && popust != null && popust.get("do") != null && popustDo == null) {
                String d = popust.get("do").toString(); // 2026-11-30T23:59
                popustDo = d.substring(8, 10) + "." + d.substring(5, 7) + ". u " + d.substring(11, 16) + " h";
            }
        }

        String pozdrav = ime != null && !ime.isBlank() ? "Zdravo " + esc(ime.trim()) + "," : "Zdravo,";
        String uvod = drugi
                ? "Primetili smo da još nisi završio/la kupovinu. Ako ti nešto nije jasno oko kursa, plaćanja ili paketa, samo odgovori na ovaj mejl ili nam piši na WhatsApp – rado ćemo pomoći."
                : "Video smo da si započeo/la kupovinu, ali plaćanje nije završeno. Kurs te i dalje čeka:";
        String pomoc = drugi ? ""
                : "<p>Ako ti nešto nije jasno oko kursa, paketa ili plaćanja, samo odgovori na ovaj mejl – rado ćemo pomoći.</p>";
        String popustTekst = popustDo == null ? ""
                : "<p style='color:#e8c48f'><strong>Popust važi još do " + popustDo + "</strong> – posle toga cena se vraća na redovnu.</p>";
        String link = sajt + (prviKurs != null ? "/kurs/" + prviKurs : "/#edukacije");
        String odjava = sajt + "/odjava-podsetnika?t=" + token;

        return "<p>" + pozdrav + "</p>"
                + "<p>" + uvod + "</p>"
                + "<div class='invoice-box'>" + stavke + "</div>"
                + popustTekst
                + pomoc
                + "<p style='text-align:center'><a class='btn' href='" + link + "'>Završi kupovinu</a></p>"
                + "<p style='margin-top:30px;font-size:12px;color:#71717a'>Ovaj mejl smo poslali jer si otvorio/la stranicu za plaćanje na našem sajtu. "
                + "Ne želiš ovakve podsetnike? <a href='" + odjava + "'>Odjavi se</a>.</p>";
    }

    private static Map<Long, Long> parsirajPakete(String csv) {
        Map<Long, Long> mapa = new LinkedHashMap<>();
        if (csv == null) return mapa;
        for (String par : csv.split(",")) {
            String[] d = par.split(":");
            if (d.length != 2) continue;
            try {
                mapa.put(Long.parseLong(d[0].trim()), Long.parseLong(d[1].trim()));
            } catch (NumberFormatException ignored) {
            }
        }
        return mapa;
    }

    // "OD NULE DO PROFESIONALNOG RENDERA" -> "Od nule do profesionalnog rendera" (kao lepNaziv na sajtu)
    private static String lepNaziv(String tekst) {
        if (tekst == null || tekst.isBlank()) return "Kurs";
        String s = tekst.substring(0, 1) + tekst.substring(1).toLowerCase();
        return s.replaceAll("(?i)\\b3ds max\\b", "3ds Max").replaceAll("(?i)\\b3d\\b", "3D")
                .replaceAll("(?i)\\bcorona\\b", "Corona").replaceAll("(?i)(^|[\\s+(])ai(?=$|[\\s+).,])", "$1AI")
                .replaceAll("(?i)\\bautocad\\b", "AutoCAD").replaceAll("(?i)\\bphotoshop\\b", "Photoshop");
    }

    private static String esc(String s) {
        return s == null ? "" : s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;").replace("'", "&#39;");
    }

    private static String noviToken() {
        byte[] b = new byte[24];
        SLUCAJNO.nextBytes(b);
        return HexFormat.of().formatHex(b);
    }
}
