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
         switch (user.getRole()) {
            case "STUDENT" -> {
               System.out.println("Student access - fetching enrolled courses for userId: " + userId);
               String SQL = "Select kurs.*\r\n" + //
                     " from kurs\r\n" + //
                     " left join pohadja using(kursId)\r\n" + //
                     " left join student using(studentId)\r\n" + //
                     " where studentId = ?";
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
         ResponseEntity<Map<Integer, Map<String, Object>>> lekcijeResponse = LekcijeVideo(userId, kursId);
         Map<Integer, Map<String, Object>> lekcije = lekcijeResponse.getBody();
         if (lekcije == null) {
            response.put("pohadja", false);
            response.put("error", "Lekcije nisu dostupne (null)");
            System.out.println("Lekcije nisu dostupne (null)");
            return ResponseEntity.ok(response);
         }
         switch (user.getRole()) {
            case "STUDENT" -> {
               String SQL = "Select k.*  from pohadja join kurs k on pohadja.kursId = k.kursId where studentId = ? and  k.kursId = ? limit 1";
               Map<String, Object> result = jdbcTemplate.queryForMap(SQL, userId, kursId);
               if (result != null && !result.isEmpty()) {

                  response.put("pohadja", true);
                  response.put("message", "Student is enrolled in the course");
                  response.put("kurs", result);
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

   public void dodajKorisnikaUKurs(Integer studentId, Integer kursId) {
      try {
         String SQL = "INSERT INTO pohadja (studentId, kursId) VALUES (?, ?)";
         jdbcTemplate.update(SQL, studentId, kursId);
      } catch (Exception e) {
         System.out.println("Error adding user to course: " + e.getMessage());
      }
   }

   public ResponseEntity<Map<Integer, Map<String, Object>>> LekcijeVideo(Integer userId, Integer kursId) {
      try{String Sql=
         """
               SELECT l.lekcijaId,
                  l.kursId,
                  l.naziv,
                  l.opis,
                  v.videoId,
                  v.url,
                  CASE
                     WHEN o.procenat > 0 THEN o.procenat
                     ELSE 0
                  END AS procenat
            FROM lekcija l
            LEFT JOIN video v
               ON l.lekcijaId = v.lekcijaId
            LEFT JOIN odgledao o
               ON v.url = o.videoUrl
               AND o.userId = ?   
            WHERE l.kursId = ?
            ORDER BY l.lekcijaId, v.videoId""";

         List<Map<String, Object>> result = jdbcTemplate.queryForList(Sql, userId, kursId);
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
            if (entry.get("videoId") != null) {
               Map<String, Object> video = new HashMap<>();
               video.put("videoId", entry.get("videoId"));
               video.put("procenat", entry.get("procenat") != null ? entry.get("procenat") : 0);
               video.put("url", entry.get("url"));

              ((List<Map<String, Object>>) lekcija.get("klipovi")).add(video);
            }
         }

         return ResponseEntity.ok(lekcijaMap);

      } catch (Exception e) {
         Map<String, Object> response = new HashMap<>();
         response.put("error",e.getMessage());Map<Integer,Map<String,Object>>emptyResponse=new HashMap<>();emptyResponse.put(-1,response);return ResponseEntity.ok(emptyResponse);}
   }

}
