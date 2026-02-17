package com.server.studio27.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import com.server.studio27.models.Admin;
import java.util.*;

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
}
