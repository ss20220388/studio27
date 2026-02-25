package com.server.studio27.controllers;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import com.server.studio27.models.Admin;

@Service
public class AdminController {
    
    @Autowired
    private JdbcTemplate jdbcTemplate;

    public List<Admin> getAdmins() {
        List<Admin> admins = new ArrayList<>();

        String SQL = "SELECT * FROM admin";

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(SQL);

        for (Map<String, Object> row : rows) {
            admins.add(new Admin(
                    ((Number) row.get("adminId")).intValue(),
                    (String) row.get("email"),
                    (String) row.get("password"),
                    (String) row.get("ime"),
                    (String) row.get("prezime")
            ));
        }

        return admins;
    }

    public String editAdmin(Admin admin) {
        String SQL = "UPDATE admin SET email = ?, password = ?, ime = ?, prezime = ? WHERE adminId = ?";
        jdbcTemplate.update(SQL, admin.getEmail(), admin.getPassword(), admin.getIme(), admin.getPrezime(), admin.getUserId());
        return "Admin updated successfully";
    }

}
