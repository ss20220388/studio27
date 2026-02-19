package com.server.studio27.routes;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.server.studio27.controllers.PohadjaController;

@RestController
@RequestMapping("/api")

public class PohadjaRoute {
  
    private final PohadjaController pohadjaController;
    public PohadjaRoute(PohadjaController pohadjaController) {
        this.pohadjaController = pohadjaController;
    }
    @GetMapping("/pohadja")
    public boolean studentPohadjaKurs(Integer studentId, Integer kursId) {
        return pohadjaController.studentPohadjaKurs(studentId, kursId);
    }
    
       
}
