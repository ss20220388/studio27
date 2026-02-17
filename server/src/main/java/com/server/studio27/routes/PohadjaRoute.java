package com.server.studio27.routes;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.GetMapping;

import com.server.studio27.controllers.PohadjaController;
import com.server.studio27.models.Kurs;
import java.util.List;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;

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
