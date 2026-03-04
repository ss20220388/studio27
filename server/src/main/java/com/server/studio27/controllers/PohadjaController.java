package com.server.studio27.controllers;

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
               String SQL2 = "Select * from kurs where kursId = ? join " ;
               Map<String, Object> response = new HashMap<>();
               response.put("pohadja", result != null && !result.isEmpty());
               response.put("message", result != null && !result.isEmpty() ? "Student is enrolled in the course" : "Student is not enrolled in the course");
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

}
