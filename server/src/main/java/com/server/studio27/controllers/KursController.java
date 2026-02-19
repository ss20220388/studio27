package com.server.studio27.controllers;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import com.server.studio27.models.Kurs;
import com.server.studio27.models.Student;
import com.server.studio27.models.Lekcija;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

import jakarta.validation.constraints.Null;

@Service
public class KursController {
    @Autowired
    private JdbcTemplate jdbcTemplate;

    public List<Kurs> getAllKursevi() {
        List<Kurs> kursevi = new ArrayList<>();
        String SQL = "SELECT * FROM kurs";

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(SQL);

        for (Map<String, Object> row : rows) {
            kursevi.add(new Kurs(
                    ((Number) row.get("kursId")).intValue(),
                    (String) row.get("naziv"),
                    (String) row.get("opis"),
                    ((Number) row.get("cena")).intValue(),
                    ((Number) row.get("trajanje")).intValue(),
                    (String) row.get("slikaUrl")));

        }

        return kursevi;
    }

    public List<Kurs> getAllKurseviSaLekcijama() {
        List<Kurs> kursevi = new ArrayList<>();
        String SQL = "Select kursId,k.naziv as \"Naziv kursa\",k.opis as \"Opis kursa\", cena, trajanje as \"Trajanje u danima\", slikaUrl as \"Slika kursa\",lekcijaId, l.naziv as \"Naziv  lekcije\",\nl.opis as \"Opis lekcije\", url as \"Video url\" from Kurs k\n"
                +
                "join Lekcija l using(kursId)\n" +
                "join Video  v using(lekcijaId)\n" +
                "Group by kursId,lekcijaId,videoId;";
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
            }else{
                lekcije.add(new Lekcija(
                    ((Number) row.get("lekcijaId")).intValue(),
                    (String) row.get("Naziv  lekcije"),
                    (String) row.get("Opis lekcije"),
                    (String) row.get("Video url")));
            }

        }
        return kursevi;
    }

}
