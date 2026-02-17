package com.server.studio27.controllers;

import java.util.ArrayList;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import com.server.studio27.models.Student;

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
