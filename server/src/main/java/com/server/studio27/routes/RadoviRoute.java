package com.server.studio27.routes;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.server.studio27.controllers.RadoviController;
import com.server.studio27.models.RadoviStudenata;


@RequestMapping("/api")
@RestController
public class RadoviRoute {

    @Autowired
    private RadoviController radoviController;

    @GetMapping("/radovi")
    public List<RadoviStudenata> getRadovi() {
        return radoviController.getAllRadovi();
    }

    @PostMapping("/addRad")
    public String addRad(@RequestBody Map<String,Object> requestBody) {
        radoviController.addRadovi(requestBody);
        return "Uspesno";
    }
    
}