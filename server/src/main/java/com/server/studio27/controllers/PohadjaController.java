package com.server.studio27.controllers;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import com.server.studio27.models.User;

@Service
public class PohadjaController {

   @Autowired
   private JdbcTemplate jdbcTemplate;

   @Autowired
   private UserController UserController;

   public ResponseEntity<Map<String, Object>> mojKursevi(Integer userId) {

      try {
         User user = UserController.getUserById(userId);
         System.out.println("User role: " + user.getEmail() + " - " + user.getRole());
         switch (user.getRole()) {
            case "STUDENT" -> {
               String SQL = "Select kurs.*\r\n" + //
                     "from kurs\r\n" + //
                     "join pohadja using(kursId)\r\n" + //
                     "join student using(studentId)\r\n" + //
                     "where studentId = ?";
               List<Map<String, Object>> result = jdbcTemplate.queryForList(SQL, userId);
               Map<String, Object> response = new HashMap<>();
               response.put("kursevi", result);
               return ResponseEntity.ok(response);
            }
            case "ADMIN" -> {
               System.out.println("Admin access - fetching all courses");
               String SQL = "Select * from kurs";
               List<Map<String, Object>> result = jdbcTemplate.queryForList(SQL);
               Map<String, Object> response = new HashMap<>();
               response.put("kursevi", result);
               return ResponseEntity.ok(response);
            }
            default -> {
               Map<String, Object> response = new HashMap<>();
               response.put("kursevi", null);
               return ResponseEntity.ok(response);
            }
         }

      } catch (Exception e) {
         Map<String, Object> response = new HashMap<>();
         response.put("pohadja", false);
         response.put("error", e.getMessage());
         return ResponseEntity.ok(response);
      }
   }

   public ResponseEntity<Map<String, Object>> studentPohadjaKurs(Integer userId, Integer kursId) {
      try {
         User user = UserController.getUserById(userId);
         System.out.println("User role: " + user.getEmail() + " - " + user.getRole());
         switch (user.getRole()) {
            case "STUDENT" -> {
               String SQL = "  Select *  from pohadja where studentId = ? and kursId = ? limit 1";
               Map<String, Object> result = jdbcTemplate.queryForMap(SQL, userId, kursId);
               String SQL2 = "Select * from kurs where kursId = ? join ";
               Map<String, Object> response = new HashMap<>();
               response.put("pohadja", result != null && !result.isEmpty());
               response.put("message", result != null && !result.isEmpty() ? "Student is enrolled in the course"
                     : "Student is not enrolled in the course");
               return ResponseEntity.ok(response);
            }
            case "ADMIN" -> {

               Map<String, Object> response = new HashMap<>();
               response.put("pohadja", true);
               response.put("message", "Admin has access to all courses");
               return ResponseEntity.ok(response);
            }
            default -> {
               Map<String, Object> response = new HashMap<>();
               response.put("pohadja", false);
               response.put("error", "Unauthorized role");
               return ResponseEntity.ok(response);
            }
         }

      } catch (Exception e) {
         Map<String, Object> response = new HashMap<>();
         response.put("pohadja", false);
         response.put("error", e.getMessage());
         return ResponseEntity.ok(response);
      }
   }

   public ResponseEntity<Map<String, Object>> pohadjaKursILekcije(Integer userId, Integer kursId) {
      try {
         User user = UserController.getUserById(userId);
         Map<String, Object> response = new HashMap<>();
         ResponseEntity<Map<Integer, Map<String, Object>>> lekcijeResponse = LekcijeVideo();
         Map<Integer, Map<String, Object>> lekcije = lekcijeResponse.getBody();
         if (lekcije == null) {
            response.put("pohadja", false);
            response.put("error", "Lekcije nisu dostupne (null)");
            return ResponseEntity.ok(response);
         }
         switch (user.getRole()) {
            case "STUDENT" -> {
               String SQL = "  Select k.*  from pohadja join kurs k on pohadja.kursId = k.kursId where studentId = ? and kursId = ? limit 1";
               Map<String, Object> result = jdbcTemplate.queryForMap(SQL, userId, kursId);
               if (result != null && !result.isEmpty()) {
                  response.put("pohadja", true);
                  response.put("message", "Student is enrolled in the course");
                  response.put("kurs", result);
                  List<Map<String, Object>> kursLekcije = new java.util.ArrayList<>();
                  for (Map<String, Object> lekcija : lekcije.values()) {
                     if (lekcija.get("kursId").equals(kursId)) {
                        Map<String, Object> lekcijaData = new HashMap<>();
                        lekcijaData.put("lekcijaId", lekcija.get("lekcijaId"));
                        lekcijaData.put("naziv", lekcija.get("naziv"));
                        lekcijaData.put("opis", lekcija.get("opis"));
                        lekcijaData.put("klipovi", lekcija.get("klipovi"));
                        kursLekcije.add(lekcijaData);
                     }
                  }
                  response.put("lekcije", kursLekcije);
               } else {
                  response.put("pohadja", false);
                  response.put("message", "Student is not enrolled in the course");
               }
               return ResponseEntity.ok(response);
            }
            case "ADMIN" -> {
               String SQL = "Select * from kurs where kursId = ?";
               Map<String, Object> result = jdbcTemplate.queryForMap(SQL, kursId);
               response.put("pohadja", true);
               response.put("message", "Admin has access to all courses");
               List<Map<String, Object>> kursLekcije = new java.util.ArrayList<>();
               for (Map<String, Object> lekcija : lekcije.values()) {
                  Number kursIdNum = (Number) lekcija.get("kursId");
                  Integer kursidLekcija = kursIdNum.intValue();
                  if (kursidLekcija.equals(kursId)) {

                     Map<String, Object> lekcijaData = new HashMap<>();
                     lekcijaData.put("lekcijaId", lekcija.get("lekcijaId"));
                     lekcijaData.put("naziv", lekcija.get("naziv"));
                     lekcijaData.put("opis", lekcija.get("opis"));
                     lekcijaData.put("klipovi", lekcija.get("klipovi"));
                     kursLekcije.add(lekcijaData);
                  }
               }
               response.put("lekcije", kursLekcije);
               response.put("kurs", result);
               return ResponseEntity.ok(response);
            }
            default -> {
               response = new HashMap<>();
               response.put("pohadja", false);
               response.put("error", "Unauthorized role");
               return ResponseEntity.ok(response);
            }
         }
      } catch (Exception e) {
         Map<String, Object> response = new HashMap<>();
         response.put("pohadja", false);
         response.put("error", e.getMessage());
         return ResponseEntity.ok(response);
      }
   }

   public ResponseEntity<Map<Integer, Map<String, Object>>> LekcijeVideo() {
      try {
         String Sql = "Select l.lekcijaId, l.kursId, l.naziv, l.opis, v.videoId, v.url " +
               "from lekcija l " +
               "left join video v on l.lekcijaId = v.lekcijaId " +
               "order by l.lekcijaId";

         List<Map<String, Object>> result = jdbcTemplate.queryForList(Sql);
         Map<Integer, Map<String, Object>> lekcijaMap = new HashMap<>();

         for (Map<String, Object> entry : result) {

            Number lekcijaIdNum = (Number) entry.get("lekcijaId");
            Integer lekcijaId = lekcijaIdNum.intValue();

            Map<String, Object> lekcija = lekcijaMap.get(lekcijaId);

            if (lekcija == null) {
               lekcija = new HashMap<>();
               lekcija.put("lekcijaId", lekcijaId);
               lekcija.put("kursId", entry.get("kursId"));
               lekcija.put("naziv", entry.get("naziv"));
               lekcija.put("opis", entry.get("opis"));
               lekcija.put("klipovi", new ArrayList<Map<String, Object>>());

               lekcijaMap.put(lekcijaId, lekcija);
            }

            // 🔥 KLJUČNA PROVERA
            if (entry.get("videoId") != null) {
               Map<String, Object> video = new HashMap<>();
               video.put("videoId", entry.get("videoId"));
               video.put("url", entry.get("url"));

               ((List<Map<String, Object>>) lekcija.get("klipovi")).add(video);
            }
         }

         return ResponseEntity.ok(lekcijaMap);

      } catch (Exception e) {
         Map<String, Object> response = new HashMap<>();
         response.put("error", e.getMessage());
         Map<Integer, Map<String, Object>> emptyResponse = new HashMap<>();
         emptyResponse.put(-1, response);
         return ResponseEntity.ok(emptyResponse);
      }
   }

}
