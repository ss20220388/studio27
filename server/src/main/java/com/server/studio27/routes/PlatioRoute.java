package com.server.studio27.routes;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.server.studio27.controllers.PlatioController;
import com.server.studio27.models.Student;

@RequestMapping("/api")
@RestController
public class PlatioRoute {

    private final PlatioController platioController;

    public PlatioRoute(PlatioController platioController) {
        this.platioController = platioController;
    }

    @GetMapping("/studentsWhoPay")
    public List<Student> getStudentsWhoPay(Integer kursId) {
        return platioController.getAllStudentsWhoPay(kursId);
    }

    

}
