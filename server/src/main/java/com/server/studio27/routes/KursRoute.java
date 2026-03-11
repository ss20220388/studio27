package com.server.studio27.routes;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.server.studio27.controllers.KursController;
import com.server.studio27.models.Kurs;


@RestController
@RequestMapping("/api")
public class KursRoute {
    private final KursController kursController;
    private List<Kurs> kursevi;
    
    public KursRoute(KursController kursController) {
        this.kursController = kursController;
    }
    @GetMapping("/kursevi")
    public ResponseEntity<Map<String, Object>> getAllKursevi() {
        return kursController.getAllKursevi();
    }
    @GetMapping("/kursevi-sa-lekcijama")
    public ResponseEntity<List<Kurs>> getAllKurseviSaLekcijama() {
        return kursController.getAllKurseviSaLekcijama();
    }
    @GetMapping("/kursevi/{id}")
    public ResponseEntity<Kurs> getKursSaLekcijama(@PathVariable int id) {
        return kursController.getKursSaLekcijama(id);
    }
    @GetMapping("/broj-kurseva/{studentId}")
    public ResponseEntity<Map<String, Object>> getBrojSvihKurseva(@PathVariable int studentId) {
        return kursController.getBrojSvihKursevi(studentId);
    }
    @GetMapping("/broj-odgledanih-kurseva/{studentId}")
    public ResponseEntity<Map<String, Object>> getBrojOdgledanihKurseva(@PathVariable int studentId) {
        return kursController.getBrojOdgledanihKursevi(studentId);
    }
     @GetMapping("/broj-u-toku-kurseva/{studentId}")
    public ResponseEntity<Map<String, Object>> getBrojUTokuKurseva(@PathVariable int studentId) {
        return kursController.getBrojUTokuKursevi(studentId);
    }
}
