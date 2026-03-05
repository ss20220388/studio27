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

public ResponseEntity<Kurs> getKursSaLekcijama(int id) {
    try {
        String SQL = "" + //
        "SELECT" + 
        " k.kursId," +//
        " k.naziv," +//
        " k.opis," +//
        " k.cena," +//
        " k.trajanje," +//
        " k.slikaUrl," +//
        " l.lekcijaId," +//
        " l.naziv AS nazivLekcije," +//
        " l.opis AS opisLekcije" +//
        " FROM Kurs k" +//
        " LEFT JOIN lekcija l USING(kursId)" +//
        " WHERE k.kursId = ?" +//
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
                +
                "left join Lekcija l using(kursId)\n" +
                "left join Video  v using(lekcijaId)\n" +
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
