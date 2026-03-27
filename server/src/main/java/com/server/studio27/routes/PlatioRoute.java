package com.server.studio27.routes;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.server.studio27.controllers.PlatioController;
import com.server.studio27.models.Platio;
import com.server.studio27.models.Student;

import org.springframework.web.bind.annotation.RequestParam;

@RequestMapping("/api")
@RestController
public class PlatioRoute {

    @Autowired
    private PlatioController platioController;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @GetMapping("/studentsWhoPay")
    public List<Student> getStudentsWhoPay(Integer kursId) {
        return platioController.getAllStudentsWhoPay(kursId);
    }

    @GetMapping("/kupljeni-poslednjih-12meseci")
    public ResponseEntity<Map<String, Object>> getKupljeniPoslednjih12meseci() {
        return platioController.getKupljeniPoslednjih12meseci();
    }

    @GetMapping("/my-payments")
    public ResponseEntity<?> getMyPayments(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Niste prijavljeni"));
        }

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String email = userDetails.getUsername();

        try {
            Integer studentId = jdbcTemplate.queryForObject(
                    "SELECT studentId FROM student WHERE studentId IN (SELECT userId FROM user WHERE email = ?)",
                    Integer.class,
                    email
            );

            if (studentId == null) {
                return ResponseEntity.status(404).body(Map.of("error", "Korisnik nije student"));
            }

            List<Platio> payments = platioController.getStudentPayments(studentId);
            return ResponseEntity.ok(payments);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Greška prilikom dohvatanja plaćanja"));
        }
    }

}
