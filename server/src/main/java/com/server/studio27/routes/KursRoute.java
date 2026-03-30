package com.server.studio27.routes;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
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
   
     @GetMapping("/broj-u-toku-kurseva/{studentId}")
    public ResponseEntity<Map<String, Object>> getBrojUTokuKurseva(@PathVariable int studentId) {
        return kursController.getBrojUTokuKursevi(studentId);
    }
    @GetMapping("/kurs-prodato-ovaj-mesec")
    public ResponseEntity<Map<String,Object>> getKursProdatoOvajMesec() {
        return kursController.getKursProdatoOvajMesec();
    }
    
     @GetMapping("/kursevi-u-toku/{studentId}")
    public ResponseEntity<List<Map<String, Object>>> getKurseviUToku(@PathVariable int studentId) {
        return kursController.getKurseviUToku(studentId);
    }

   

    @PostMapping("/dodaj-kurs")
    public ResponseEntity<Map<String, Object>> dodajKurs(@RequestBody Map<String, Object> kursData) {
        return kursController.dodajKurs(kursData);
    }
    
    @DeleteMapping("/obrisi-kurs/{id}")
    public ResponseEntity<Map<String, Object>> brisiKurs(@PathVariable int id) {
        return kursController.brisiKurs(id);
    }    
    @PostMapping("/dodaj-lekciju/{kursId}")
    public ResponseEntity<Map<String, Object>> dodajLekciju(@PathVariable int kursId, @RequestBody Map<String, Object> lekcijaData) {
        return kursController.dodajLekciju(kursId, lekcijaData);
    }
    
    @PutMapping("/promeni-kurs/{id}")
    public ResponseEntity<Map<String, Object>> promeniKurs(@PathVariable int id, @RequestBody Map<String, Object> kursData) {
        return kursController.promeniKurs(id, kursData);
    }
    
    @DeleteMapping("/obrisi-lekciju/{kursId}/{lekcijaId}")
    public ResponseEntity<Map<String, Object>> brisiLekciju(@PathVariable int kursId, @PathVariable int lekcijaId) {
        return kursController.brisiLekciju(kursId, lekcijaId);
    }
    
    @PostMapping("/obrisi-video/{lekcijaId}")
    public ResponseEntity<Map<String, Object>> brisiVideo(@PathVariable int lekcijaId, @RequestBody Map<String, String> payload) {
        String videoUrl = payload.get("url");
        return kursController.brisiVideoByUrl(lekcijaId, videoUrl);
    }
}
