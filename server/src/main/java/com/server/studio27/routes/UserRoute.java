package com.server.studio27.routes;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.server.studio27.controllers.UserController;
import com.server.studio27.models.User;

@RestController
@RequestMapping("/api")
public class UserRoute {

    private final UserController userController;
    private List<User> users;

    public UserRoute(UserController userController) {
        this.userController = userController;
    }

    @GetMapping("/users")
    public List<User> getUsers() {
        return userController.getUsers();
    }

    @PostMapping("/unlock-admin")
    public ResponseEntity<?> unlockDevice(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        userController.unlockDevice(email);
        return ResponseEntity.ok(Map.of("message", "Uredjaj je otkljucan za " + email));
    }

}
