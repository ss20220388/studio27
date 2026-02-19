package com.server.studio27.routes;

import com.server.studio27.controllers.KursController;
import java.util.List;
import com.server.studio27.models.Kurs;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;

@RestController
@RequestMapping("/api")
public class KursRoute {
    private final KursController kursController;
    private List<Kurs> kursevi;
    
    public KursRoute(KursController kursController) {
        this.kursController = kursController;
    }
    @GetMapping("/kursevi")
    public List<Kurs> getAllKursevi() {
        return kursController.getAllKursevi();
    }
    @GetMapping("/kursevi-sa-lekcijama")
    public List<Kurs> getAllKurseviSaLekcijama() {
        return kursController.getAllKurseviSaLekcijama();
    }
}
