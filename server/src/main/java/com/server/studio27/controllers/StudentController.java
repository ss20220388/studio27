package com.server.studio27.controllers;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

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

    public List<Student> getActiveStudents(){
        List<Student> students = new ArrayList<>();

        String SQL = "SELECT studentId,email,password,ime,prezime,brojTelefona FROM student join Pohadja using(studentId) join user on student.studentId = user.userId";

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
