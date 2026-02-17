package com.server.studio27.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import com.server.studio27.models.Student;

@Service
public class PlatioController {
    @Autowired
    private JdbcTemplate jdbcTemplate;

    public List<Student> getAllStudentsWhoPay(Integer kursId){
        List<Student> studenti = new ArrayList<>();
         String SQL = "SELECT s.* FROM student s JOIN platio p ON s.studentId = p.studentId WHERE p.kursId = ?";

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(SQL, kursId);

        for (Map<String, Object> row : rows) {
            studenti.add(new Student(
                ((Number) row.get("studentId")).intValue(),
                (String)row.get("ime"),
                (String)row.get("prezime"),
                (String)row.get("email"),
                (String)row.get("password"),
                (String)row.get("brojTelefona")

            ));
        
        }

        return studenti;
    }
}
