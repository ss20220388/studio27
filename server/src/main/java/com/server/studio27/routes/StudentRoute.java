package com.server.studio27.routes;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.server.studio27.controllers.StudentController;
import org.springframework.web.bind.annotation.RequestParam;

@RestController
@RequestMapping("/api")

public class StudentRoute {
    private final StudentController studentController;
    private List<Map<String, Object>> students;

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
    public List<Map<String,Object>> getStudentMails(@RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            System.out.println("Nedostaje JWT token");
            return null;
        }
        String accessToken = authHeader.substring(7);
        String email = jwtService.extractUsername(accessToken);
        UserDetails userDetails = customUserDetailsService.loadUserByUsername(email);
        if(!userDetails.getAuthorities().stream().anyMatch(auth -> auth.getAuthority().equals("ADMIN"))) {
            System.out.println("Korisnik nema ADMIN ulogu, pristup odbijen.");
            return null;
        }
        return studentController.getStudentMails();
    }

    @PostMapping("/dodaj-studenta")
    public String postMethodName(@RequestHeader("Authorization") String authHeader,@RequestBody Map<String, Object> studentData) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return "Nedostaje JWT token";
        }

        String accessToken = authHeader.substring(7);
        String email = jwtService.extractUsername(accessToken);
        UserDetails userDetails = customUserDetailsService.loadUserByUsername(email);
        
        System.out.println("Email iz JWT tokena: " + userDetails.getUsername() + ", Role: " + userDetails.getAuthorities());
        if(!userDetails.getAuthorities().stream().anyMatch(auth -> auth.getAuthority().equals("ADMIN"))) {
            System.out.println("Korisnik nema ADMIN ulogu, pristup odbijen.");
            return "Neuspešno dodavanje studenta. Nemate dozvolu.";
        } else {
            System.out.println("Korisnik ima ADMIN ulogu, pristup odobren.");
            studentController.addStudent(studentData);
            return "Uspešno dodavanje studenta.";
        }

        
    }
    @DeleteMapping("/obrisi-studenta")
    public String deleteStudent(@RequestHeader("Authorization") String authHeader,@RequestBody Integer studentId) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return "Nedostaje JWT token";   
        }
        String accessToken = authHeader.substring(7);
        String email = jwtService.extractUsername(accessToken);
        UserDetails userDetails = customUserDetailsService.loadUserByUsername(email);
        if(!userDetails.getAuthorities().stream().anyMatch(auth -> auth.getAuthority().equals("ADMIN"))) {
            System.out.println("Korisnik nema ADMIN ulogu, pristup odbijen.");
            return "Neuspešno dodavanje studenta. Nemate dozvolu.";
        }
        return studentController.deleteStudent(studentId);
    }

    @PutMapping("/edit-student-sa-adminom")
    public String editStudentaKaoAdmin(@RequestHeader("Authorization") String authHeader,@RequestBody Map<String, Object> studentData) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return "Nedostaje JWT token";   
        }
        String accessToken = authHeader.substring(7);
        String email = jwtService.extractUsername(accessToken);
        UserDetails userDetails = customUserDetailsService.loadUserByUsername(email);
        if(!userDetails.getAuthorities().stream().anyMatch(auth -> auth.getAuthority().equals("ADMIN"))) {
            System.out.println("Korisnik nema ADMIN ulogu, pristup odbijen.");
            return "Neuspešno dodavanje studenta. Nemate dozvolu.";
        }
        
        return studentController.editStudentAsAdmin(studentData);
    }

}
