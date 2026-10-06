package com.server.studio27.controllers;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import com.server.studio27.models.User;

@Service
public class UserController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public String unlockDevice(String email) {
        String SQL = "UPDATE user SET deviceId = NULL WHERE email = ?";
        jdbcTemplate.update(SQL, email);
        return "Uredjaj otkljucan za " + email;

    }
    public Integer getBrojSatiGledanja(Integer userId) {
        String SQL = "SELECT COALESCE(SUM(vremeGledanja), 0) FROM odgledao WHERE userId = ?";
        Integer totalSeconds = jdbcTemplate.queryForObject(SQL, Integer.class, userId);
        return totalSeconds != null ? totalSeconds / 60 : 0;
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
