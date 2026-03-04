package com.server.studio27.controllers;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import com.server.studio27.models.Admin;
import com.server.studio27.models.Student;
import com.server.studio27.models.User;

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

            User user = new User(userId, email, password,role);

            if ("ADMIN".equals(role)) {
                Admin admin = new Admin();
                admin.setIme(ime);
                admin.setPrezime(prezime);
            }

            if ("STUDENT".equals(role)) {
                Student student = new Student();
                student.setIme(ime);
                student.setPrezime(prezime);
            }

            users.add(user);
        }

        return users;
    }

    public String unlockDevice(String email) {
        String SQL = "UPDATE user SET deviceId = NULL WHERE email = ?";
        jdbcTemplate.update(SQL, email);
        return "Uredjaj otkljucan za " + email;

    }

    public User getUserById(Integer userId) {
        String SQL = "SELECT\r\n" + //
                "    u.userId,\r\n" + //
                "    u.email,\r\n" + //
                "    u.password,\r\n" + //
                "    COALESCE(a.ime, s.ime) AS ime,\r\n" + //
                "    COALESCE(a.prezime, s.prezime) AS prezime,\r\n" + //
                "    CASE\r\n" + //
                "        WHEN a.adminId IS NOT NULL THEN 'ADMIN'\r\n" + //
                "        WHEN s.studentId IS NOT NULL THEN 'STUDENT'\r\n" + //
                "    END AS role\r\n" + //
                "FROM user u\r\n" + //
                "LEFT JOIN admin a ON u.userId = a.adminId\r\n" + //
                "LEFT JOIN student s ON u.userId = s.studentId\r\n" + //
                "WHERE u.userId = ?";
        Map<String, Object> row = jdbcTemplate.queryForMap(SQL, userId);
        return new User(
                ((Number) row.get("userId")).intValue(),
                (String) row.get("email"),
                (String) row.get("password"),
                (String) row.get("role"));
    }
}
