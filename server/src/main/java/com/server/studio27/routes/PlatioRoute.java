package com.server.studio27.routes;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.server.studio27.controllers.PlatioController;
import com.server.studio27.models.Platio;
import com.server.studio27.models.Student;

import org.springframework.web.bind.annotation.RequestBody;

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

    @GetMapping("/sve-uplate")
    public ResponseEntity<List<Map<String, Object>>> getSveUplate() {
        Map<String, Object> response = platioController.getSveUplate().getBody();
        return ResponseEntity.ok((List<Map<String, Object>>) response.get("data"));
    }

    @GetMapping("/sve-odbijene")
    public ResponseEntity<List<Map<String, Object>>> getSveOdbijene() {
        Map<String, Object> response = platioController.getSveOdbijene().getBody();
        return ResponseEntity.ok((List<Map<String, Object>>) response.get("data"));
    }

    @GetMapping("/sve-u-pripremi")
    public ResponseEntity<List<Map<String, Object>>> getSveUpriremi() {
        Map<String, Object> response = platioController.getSveUpriremi().getBody();
        return ResponseEntity.ok((List<Map<String, Object>>) response.get("data"));
    }

    @GetMapping("/my-payments")
    public ResponseEntity<?> getMyPayments(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Niste prijavljeni"));
        }

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String email = userDetails.getUsername();

        try {
            // Query za pronalaženje studentId-a
            List<Integer> studentIds = jdbcTemplate.queryForList(
                    "SELECT studentId FROM student WHERE studentId IN (SELECT userId FROM user WHERE email = ?)",
                    Integer.class,
                    email);

            // Ako nema rezultata, vraćamo praznu listu
            if (studentIds == null || studentIds.isEmpty()) {
                return ResponseEntity.ok(List.of());
            }

            Integer studentId = studentIds.get(0);
            List<Platio> payments = platioController.getStudentPayments(studentId);
            return ResponseEntity.ok(payments);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Greška prilikom dohvatanja plaćanja: " + e.getMessage()));
        }
    }

    @PutMapping("/update-payment-status")
    public ResponseEntity<Map<String, Object>> updatePaymentStatus(@RequestBody Map<String, Object> payload) {
        Integer studentId = (Integer) payload.get("studentId");
        Integer kursId = (Integer) payload.get("kursId");
        String newStatus = (String) payload.get("newStatus");
        return platioController.updatePaymentStatus(studentId, kursId, newStatus);
    }

    @PostMapping("/dodaj-placanje")
    public ResponseEntity<Map<String, Object>> dodajPlacanje(@RequestBody Map<String, Object> placanjeData) {
        Integer studentId = (Integer) placanjeData.get("studentId");
        Integer kursId = (Integer) placanjeData.get("kursId");
        String datumPlacanja = (String) placanjeData.get("datumPlacanja");
        Integer cenaPlacanja = (Integer) placanjeData.get("cenaPlacanja");
        String status = (String) placanjeData.get("status");
        String tip = (String) placanjeData.get("tip");
        String url = (String) placanjeData.get("url");
        return platioController.addNewPayment(studentId, kursId, datumPlacanja, cenaPlacanja, status, tip, url);
    }

}
