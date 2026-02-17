package com.server.studio27.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import java.util.*;
import com.server.studio27.models.Student;
@Service


public class StudentController {
     @Autowired
    private JdbcTemplate jdbcTemplate;

    public List<Student> getStudents() {
        List<Student> students = new ArrayList<>();

        String SQL = "SELECT * FROM student";

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(SQL);

        for (Map<String, Object> row : rows) {
            students.add(new Student(
                    ((Number) row.get("studentId")).intValue(),
                    (String) row.get("email"),
                    (String) row.get("password"),
                    (String) row.get("ime"),
                    (String) row.get("prezime"),
                    (String) row.get("brojTelefona")
            ));
        }

        return students;
    }
}
