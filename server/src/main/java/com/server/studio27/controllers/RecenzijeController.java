package com.server.studio27.controllers;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import com.server.studio27.models.Kurs;
import com.server.studio27.models.Recenzije;
import com.server.studio27.models.Student;

@Service
public class RecenzijeController {
    @Autowired
    private JdbcTemplate jdbcTemplate;

    public List<Recenzije> getRecenzije() {
        List<Recenzije> recenzije = new ArrayList<>();

        String SQL = """
            SELECT r.recenzijaId, r.opis, r.ocena, r.datum, r.instagram, r.ime AS imeRecenzije,
                   r.audioUrl, r.trajanje, r.talas, r.slikaUrl AS slikaRecenzije,
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
                    (String) row.get("brojTelefona"),
                    "STUDENT"
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

            Recenzije recenzija = new Recenzije(
                recenzijaId != null ? recenzijaId.intValue() : 0,
                (String) row.get("opis"),
                ocena != null ? ocena.intValue() : 0,
                (Date) row.get("datum"),
                student,
                kurs
            );
            recenzija.setInstagram((String) row.get("instagram"));
            recenzija.setIme((String) row.get("imeRecenzije"));
            recenzija.setAudioUrl((String) row.get("audioUrl"));
            recenzija.setTrajanje(row.get("trajanje") instanceof Number n ? n.intValue() : null);
            recenzija.setTalas((String) row.get("talas"));
            recenzija.setSlikaUrl((String) row.get("slikaRecenzije"));
            recenzije.add(recenzija);
        }

        return recenzije;
    }

    // Admin: recenzija bez naloga na sajtu (npr. poruka sa Instagrama)
    public void dodaj(Map<String, Object> podaci) {
        jdbcTemplate.update(
            "INSERT INTO recenzija (opis, ocena, datum, kursId, instagram, ime, audioUrl, trajanje, talas, slikaUrl) VALUES (?, ?, CURDATE(), ?, ?, ?, ?, ?, ?, ?)",
            tekst(podaci.get("opis")), ocena(podaci.get("ocena")), kursId(podaci.get("kursId")),
            prazanUNull(podaci.get("instagram")), prazanUNull(podaci.get("ime")),
            putanja(podaci.get("audioUrl")), trajanje(podaci.get("trajanje")), talas(podaci.get("talas")), putanja(podaci.get("slikaUrl")));
    }

    public boolean izmeni(int recenzijaId, Map<String, Object> podaci) {
        return jdbcTemplate.update(
            "UPDATE recenzija SET opis = ?, ocena = ?, kursId = ?, instagram = ?, ime = ?, audioUrl = ?, trajanje = ?, talas = ?, slikaUrl = ? WHERE recenzijaId = ?",
            tekst(podaci.get("opis")), ocena(podaci.get("ocena")), kursId(podaci.get("kursId")),
            prazanUNull(podaci.get("instagram")), prazanUNull(podaci.get("ime")),
            putanja(podaci.get("audioUrl")), trajanje(podaci.get("trajanje")), talas(podaci.get("talas")), putanja(podaci.get("slikaUrl")),
            recenzijaId) > 0;
    }

    private static final String UPLOAD_DIR = "/assets/uploads/";

    // Snimak glasovne recenzije -> /uploads/...; sa ffmpeg-om (server) samo zvuk u .m4a, inače original
    public String sacuvajSnimak(org.springframework.web.multipart.MultipartFile file) throws Exception {
        String original = java.nio.file.Paths.get(String.valueOf(file.getOriginalFilename())).getFileName().toString();
        String ime = System.currentTimeMillis() + "-" + original.replaceAll("[^A-Za-z0-9._-]", "-");
        java.nio.file.Path folder = java.nio.file.Paths.get(UPLOAD_DIR);
        java.nio.file.Files.createDirectories(folder);
        java.nio.file.Path ulaz = folder.resolve(ime);
        file.transferTo(ulaz);

        String bezEkstenzije = ime.contains(".") ? ime.substring(0, ime.lastIndexOf('.')) : ime;
        java.nio.file.Path izlaz = folder.resolve(bezEkstenzije + "-glas.m4a");
        if (uM4a(ulaz, izlaz, true) || uM4a(ulaz, izlaz, false)) {
            java.nio.file.Files.deleteIfExists(ulaz);
            return "/uploads/" + izlaz.getFileName();
        }
        return "/uploads/" + ime;
    }

    // kopija = samo prepakuje AAC zvuk (brzo); inače ponovo kodira u AAC
    private static boolean uM4a(java.nio.file.Path ulaz, java.nio.file.Path izlaz, boolean kopija) {
        String ffmpeg = System.getProperty("os.name").toLowerCase().contains("win") ? "C:\\ffmpeg\\bin\\ffmpeg.exe" : "ffmpeg";
        List<String> komanda = new ArrayList<>(List.of(ffmpeg, "-y", "-i", ulaz.toString(), "-vn"));
        komanda.addAll(kopija ? List.of("-c:a", "copy") : List.of("-c:a", "aac", "-b:a", "128k"));
        komanda.add(izlaz.toString());
        try {
            Process proces = new ProcessBuilder(komanda).redirectErrorStream(true)
                    .redirectOutput(ProcessBuilder.Redirect.DISCARD).start();
            boolean gotovo = proces.waitFor(120, java.util.concurrent.TimeUnit.SECONDS);
            if (!gotovo) {
                proces.destroyForcibly();
                return false;
            }
            return proces.exitValue() == 0 && java.nio.file.Files.size(izlaz) > 0;
        } catch (Exception e) {
            // nema ffmpeg-a (npr. lokalno): ostaje originalni fajl
            return false;
        }
    }

    public void obrisi(int recenzijaId) {
        jdbcTemplate.update("DELETE FROM recenzija WHERE recenzijaId = ?", recenzijaId);
    }

    private static String tekst(Object o) {
        return o == null ? "" : o.toString().trim();
    }

    // putanja fajla iz upload-a (/uploads/...), samo unutar uploads foldera
    private static String putanja(Object o) {
        String s = tekst(o);
        return s.startsWith("/uploads/") && !s.contains("..") && s.length() <= 255 ? s : null;
    }

    private static Integer trajanje(Object o) {
        return o instanceof Number n && n.intValue() > 0 ? Math.min(n.intValue(), 24 * 3600) : null;
    }

    // "3,5,9,..." najviše 60 brojeva 0-9 (izgled talasa u plejeru)
    private static String talas(Object o) {
        String s = tekst(o);
        return s.matches("[0-9](,[0-9]){0,59}") ? s : null;
    }

    // Instagram nalog se čuva bez @ (dodaje se pri prikazu)
    private static String prazanUNull(Object o) {
        String s = tekst(o).replaceFirst("^@", "");
        return s.isEmpty() ? null : s;
    }

    private static int ocena(Object o) {
        int ocena = o instanceof Number n ? n.intValue() : 5;
        return Math.max(1, Math.min(5, ocena));
    }

    private static Long kursId(Object o) {
        if (o instanceof Number n) return n.longValue();
        try {
            return o == null || o.toString().isBlank() ? null : Long.parseLong(o.toString().trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
