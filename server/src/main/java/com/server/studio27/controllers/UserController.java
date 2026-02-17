package com.server.studio27.controllers;

import com.server.studio27.models.Admin;
import com.server.studio27.models.Student;
import com.server.studio27.models.User;

import java.util.*;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class UserController {

    @Autowired
    private JdbcTemplate jdbcTemplate;
public List<User> getUsers() {

    List<User> users = new ArrayList<>();

    String SQL = """
        SELECT 
            u.userId,
            u.email,
            u.password,
            COALESCE(a.ime, s.ime) AS ime,
            COALESCE(a.prezime, s.prezime) AS prezime,
            CASE 
                WHEN a.adminId IS NOT NULL THEN 'ADMIN'
                WHEN s.studentId IS NOT NULL THEN 'STUDENT'
            END AS role
        FROM user u
        LEFT JOIN admin a ON u.userId = a.adminId
        LEFT JOIN student s ON u.userId = s.studentId
    """;

    List<Map<String, Object>> rows = jdbcTemplate.queryForList(SQL);

    for (Map<String, Object> row : rows) {

        int userId = ((Number) row.get("userId")).intValue();
        String email = (String) row.get("email");
        String password = (String) row.get("password");
        String ime = (String) row.get("ime");
        String prezime = (String) row.get("prezime");
        String role = (String) row.get("role");

        User user = new User(userId, email, password);

        if ("ADMIN".equals(role)) {
            Admin admin = new Admin();
            admin.setIme(ime);
            admin.setPrezime(prezime);
            user.setAdmin(admin);
        }

        if ("STUDENT".equals(role)) {
            Student student = new Student();
            student.setIme(ime);
            student.setPrezime(prezime);
            user.setStudent(student);
        }

        users.add(user);
    }

    return users;
}


}
