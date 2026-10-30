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
            recenzije.add(recenzija);
        }

        return recenzije;
    }

    // Admin: recenzija bez naloga na sajtu (npr. poruka sa Instagrama)
    public void dodaj(Map<String, Object> podaci) {
        jdbcTemplate.update(
            "INSERT INTO recenzija (opis, ocena, datum, kursId, instagram, ime) VALUES (?, ?, CURDATE(), ?, ?, ?)",
            tekst(podaci.get("opis")), ocena(podaci.get("ocena")), kursId(podaci.get("kursId")),
            prazanUNull(podaci.get("instagram")), prazanUNull(podaci.get("ime")));
    }

    public boolean izmeni(int recenzijaId, Map<String, Object> podaci) {
        return jdbcTemplate.update(
            "UPDATE recenzija SET opis = ?, ocena = ?, kursId = ?, instagram = ?, ime = ? WHERE recenzijaId = ?",
            tekst(podaci.get("opis")), ocena(podaci.get("ocena")), kursId(podaci.get("kursId")),
            prazanUNull(podaci.get("instagram")), prazanUNull(podaci.get("ime")), recenzijaId) > 0;
    }

    public void obrisi(int recenzijaId) {
        jdbcTemplate.update("DELETE FROM recenzija WHERE recenzijaId = ?", recenzijaId);
    }

    private static String tekst(Object o) {
        return o == null ? "" : o.toString().trim();
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
