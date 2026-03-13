package com.server.studio27.routes;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.server.studio27.controllers.PlatioController;
import com.server.studio27.models.Student;

import org.springframework.web.bind.annotation.RequestParam;

@RequestMapping("/api")
@RestController
public class PlatioRoute {

    @Autowired
    private PlatioController platioController;

    @GetMapping("/studentsWhoPay")
    public List<Student> getStudentsWhoPay(Integer kursId) {
        return platioController.getAllStudentsWhoPay(kursId);
    }

    @GetMapping("/kupljeni-poslednjih-12meseci")
    public ResponseEntity<Map<String, Object>> getKupljeniPoslednjih12meseci() {
        return platioController.getKupljeniPoslednjih12meseci();
    }

}
