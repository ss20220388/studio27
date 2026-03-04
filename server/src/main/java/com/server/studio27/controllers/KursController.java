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
       try{
        String SQL = "Select * from kurs";
        List<Map<String, Object>> result = jdbcTemplate.queryForList(SQL);
        Map<String, Object> response = Map.of("kursevi", result);
        return ResponseEntity.ok(response);
       }
         catch(Exception e){
             Map<String, Object> response = new HashMap<>();
             response.put("kursevi", null);
             response.put("error", e.getMessage());
             return ResponseEntity.badRequest().body(response);
         }
    }

    public ResponseEntity<List<Kurs>> getAllKurseviSaLekcijama() {
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
        return ResponseEntity.ok(kursevi);
    }

}
