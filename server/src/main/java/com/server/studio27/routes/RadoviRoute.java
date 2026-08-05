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


@RequestMapping("/api")
@RestController
public class RadoviRoute {

    @Autowired
    private RadoviController radoviController;

    @GetMapping("/radovi")
    public List<Map<String, Object>> getRadovi() {
        return radoviController.getAllRadovi();
    }

    @GetMapping("/radovi-sa-rasporedom")
    public List<Map<String, Object>> getRadoviSaRasporedom() {
        return radoviController.getAllRadoviSaRasporedom();
    }

    @PostMapping("/addRad")
    public String addRad(@RequestBody Map<String,Object> requestBody) {
        radoviController.addRadovi(requestBody);
        return "Uspesno";
    }
    
}