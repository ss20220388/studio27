package com.server.studio27.routes;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.server.studio27.controllers.RadoviController;
import com.server.studio27.models.RadoviStudenata;

@RequestMapping("/api")
@RestController
public class RadoviRoute {

    private final RadoviController radoviController;

    public RadoviRoute(RadoviController radoviController) {
        this.radoviController = radoviController;
    }

    @GetMapping("/radovi")
    public List<RadoviStudenata> getRadovi() {
        return radoviController.getAllRadovi();
    }
}