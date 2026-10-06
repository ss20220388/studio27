package com.server.studio27.routes;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.server.studio27.controllers.UserController;


@RestController
@RequestMapping("/api")
public class UserRoute {

    private final UserController userController;

    public UserRoute(UserController userController) {
        this.userController = userController;
    }

    @PostMapping("/unlock-device")
    public ResponseEntity<?> unlockDevice(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        userController.unlockDevice(email);
        return ResponseEntity.ok(Map.of("message", "Uredjaj je otkljucan za " + email));
    }

    @GetMapping("/broj-odgledanih-sati/{id}")
    public ResponseEntity<Map<String,Object>> getBrojOdgledanihStudenata(@PathVariable Integer id) {
        try {
            Integer brojOdgledanih = userController.getBrojSatiGledanja(id);
            Map<String,Object> response = new HashMap<>();
            response.put("studentId", id);
            response.put("brojSati", brojOdgledanih);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String,Object> response = new HashMap<>();
            response.put("studentId", id);
            response.put("brojSati", 0);
            return ResponseEntity.ok(response);
        }
    }
    

}
