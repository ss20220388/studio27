package com.server.studio27.routes;
import com.server.studio27.controllers.UserController;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;

@RestController
@RequestMapping("/api")
public class UserRoute {
    
    private final UserController userController;

    public UserRoute(UserController userController) {
        this.userController = userController;
    }

    @GetMapping("/users")
    public Object getUsers() {
        return userController.getUsers();
    }
    
}
