package com.server.studio27.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class PohadjaController {
    
     @Autowired
    private JdbcTemplate jdbcTemplate;

 public boolean studentPohadjaKurs(Integer studentId, Integer kursId) {
    String SQL = "SELECT COUNT(*) FROM pohadja WHERE studentId = ? AND kursId = ?";
    Integer count = jdbcTemplate.queryForObject(SQL, Integer.class, studentId, kursId);
    return count != null && count > 0;
}


}
