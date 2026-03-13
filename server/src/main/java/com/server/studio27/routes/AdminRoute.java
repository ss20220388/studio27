package com.server.studio27.routes;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.server.studio27.controllers.AdminController;
import com.server.studio27.models.Admin;


@RestController
@RequestMapping("/api")


public class AdminRoute {
    
    @Autowired
    private AdminController adminController;

    private List<Admin> admins;
    
    @GetMapping("/admins")
    public List<Admin> getAdmins() {
        admins = adminController.getAdmins();
        return admins;
    }
   @PostMapping("/admin-edit")
   public String postMethodName(@RequestBody Admin admin) {
       try {
           return adminController.editAdmin(admin);
       } catch (Exception e) {
           return "Error editing admin: " + e.getMessage();
       }
   }

   @GetMapping("/admin-stats")
   public ResponseEntity<Map<String,Object>> getAdminStats() {
       return adminController.getAdminStats();
   }
   
   
}
