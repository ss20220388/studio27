package com.server.studio27.routes;
 import com.server.studio27.controllers.UserController;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;
import java.util.*;
import com.server.studio27.models.User;
import com.server.studio27.controllers.AdminController;
import com.server.studio27.models.Admin;
@RestController
@RequestMapping("/api")


public class AdminRoute {
    
    private final AdminController adminController;
    private List<Admin> admins;
    public AdminRoute(AdminController adminController) {
        this.adminController = adminController;
    }
    
    @GetMapping("/admins")
    public List<Admin> getAdmins() {
        admins = adminController.getAdmins();
        return admins;
    }
   
}
