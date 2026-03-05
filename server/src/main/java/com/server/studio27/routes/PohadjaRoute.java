package com.server.studio27.routes;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.server.studio27.controllers.PohadjaController;

@RestController
@RequestMapping("/api")

public class PohadjaRoute {
  
    private final PohadjaController pohadjaController;
    public PohadjaRoute(PohadjaController pohadjaController) {
        this.pohadjaController = pohadjaController;
    }
    @GetMapping("/moj-kursevi")
    public ResponseEntity<Map<String, Object>> mojKursevi(@RequestParam Integer userId) {
        return pohadjaController.mojKursevi(userId);
    }
    @GetMapping("/pohadjam-kurs")
    public ResponseEntity<Map<String,Object>> studentPohadjaKurs(@RequestParam Integer userId, @RequestParam Integer kursId) {
        return pohadjaController.studentPohadjaKurs(userId, kursId);
    }
    @GetMapping("/pohadjam-kurs-lekcije")
    public ResponseEntity<Map<String,Object>> studentPohadjaKursSaLekcijama(@RequestParam Integer userId, @RequestParam Integer kursId) {
        return pohadjaController.pohadjaKursILekcije(userId, kursId);
    }
    
    
    
    
       
}
