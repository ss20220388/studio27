package com.server.studio27.routes;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.server.studio27.controllers.StudentController;


@RestController
@RequestMapping("/api")

public class StudentRoute {
    private final StudentController studentController;

    @Autowired
    private com.server.studio27.auth.JwtService jwtService;

    @Autowired
    private com.server.studio27.auth.CustomUserDetailsService customUserDetailsService;

    public StudentRoute(StudentController studentController) {
        this.studentController = studentController;
    }

    @GetMapping("/students")
    public Map<String, Object> getStudents() {
        return studentController.getStudents();
    }

    @GetMapping("/student-mails")
    public List<String> getStudentMails() {
        return studentController.getStudentMails();
    }

    @DeleteMapping("/obrisi-studenta")
    public ResponseEntity<String> deleteStudent(@RequestHeader("Authorization") String authHeader,@RequestBody Integer studentId) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body("Nedostaje JWT token");
        }
        String accessToken = authHeader.substring(7);
        String email = jwtService.extractUsername(accessToken);
        UserDetails userDetails = customUserDetailsService.loadUserByUsername(email);
        if(!userDetails.getAuthorities().stream().anyMatch(auth -> auth.getAuthority().equals("ADMIN"))) {
            System.out.println("Korisnik nema ADMIN ulogu, pristup odbijen.");
            return ResponseEntity.status(403).body("Neuspešno brisanje studenta. Nemate dozvolu.");
        }
        return toResponse(studentController.deleteStudent(studentId));
    }

    @PutMapping("/edit-student-sa-adminom")
    public ResponseEntity<String> editStudentaKaoAdmin(@RequestHeader("Authorization") String authHeader,@RequestBody Map<String, Object> studentData) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body("Nedostaje JWT token");
        }
        String accessToken = authHeader.substring(7);
        String email = jwtService.extractUsername(accessToken);
        UserDetails userDetails = customUserDetailsService.loadUserByUsername(email);
        if(!userDetails.getAuthorities().stream().anyMatch(auth -> auth.getAuthority().equals("ADMIN"))) {
            System.out.println("Korisnik nema ADMIN ulogu, pristup odbijen.");
            return ResponseEntity.status(403).body("Neuspešna izmena studenta. Nemate dozvolu.");
        }

        return toResponse(studentController.editStudentAsAdmin(studentData));
    }

    // Kontroler vraca poruku koja pocinje sa "Error" kada nesto pukne;
    // frontend mora da dobije pravi status da ne bi prikazao lazni uspeh
    private ResponseEntity<String> toResponse(String result) {
        if (result != null && result.startsWith("Error")) {
            return ResponseEntity.internalServerError().body(result);
        }
        return ResponseEntity.ok(result);
    }

    
}
