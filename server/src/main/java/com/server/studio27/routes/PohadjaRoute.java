package com.server.studio27.routes;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.server.studio27.controllers.PohadjaController;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;


@RestController
@RequestMapping("/api")

public class PohadjaRoute {

    @Autowired
    private PohadjaController pohadjaController;

    @GetMapping("/moj-kursevi/{userId}")
    public ResponseEntity<Map<String, Object>> mojKursevi(@PathVariable Integer userId) {
        return pohadjaController.mojKursevi(userId);
    }

    @GetMapping("/pohadjam-kurs")
    public ResponseEntity<Map<String, Object>> studentPohadjaKurs(@RequestParam Integer userId,
            @RequestParam Integer kursId) {
        return pohadjaController.studentPohadjaKurs(userId, kursId);
    }

    @GetMapping("/pohadjam-kurs-lekcije")
    public ResponseEntity<Map<String, Object>> studentPohadjaKursSaLekcijama(@RequestParam Integer userId,
            @RequestParam Integer kursId) {
        return pohadjaController.pohadjaKursILekcije(userId, kursId);
    }

    @PostMapping("/novi-korisnik")
    public String dodajKorisnikaUKurs(@RequestBody Map<String, Object> request) {
        String studentId = request.get("studentId").toString();
        String kursId = request.get("kursId").toString();
        pohadjaController.dodajKorisnikaUKurs(Integer.parseInt(studentId), Integer.parseInt(kursId));
        
        return "Uspesno ste dodat korisnik na kurs"; 
    }
    

}
