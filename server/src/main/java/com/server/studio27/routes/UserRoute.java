package com.server.studio27.routes;
import com.server.studio27.controllers.UserController;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;
import java.util.*;
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
    
}
