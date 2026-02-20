package com.server.studio27.routes;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.server.studio27.controllers.PlacanjeController;
import com.server.studio27.models.Placanje;


@RequestMapping("/api")
@RestController
public class PlacanjeRoute {
     private final PlacanjeController placanjeController;

    

    @GetMapping("/placanje")
   public List<Placanje> savePayment(Integer studentId, Integer kursId, String datumPlacanja, Integer cenaPlacanja) {
        return placanjeController.savePayment(studentId, kursId, datumPlacanja, cenaPlacanja);
    }

    public PlacanjeRoute(PlacanjeController placanjeController) {
        this.placanjeController = placanjeController;
    }

}
