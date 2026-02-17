package com.server.studio27.controllers;

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
        users.add(new User(1, "user1@example.com", "password1"));
        users.add(new User(2, "user2@example.com", "password2"));

        /*
         * String SQL = "SELECT * FROM users";
         * 
         * List<Map<String, Object>> rows = jdbcTemplate.queryForList(SQL);
         * for (Map<String, Object> row : rows) {
         * users.add(new User(
         * (Integer) row.get("user_id"),
         * (String) row.get("email"),
         * (String) row.get("password")
         * ));
         * }
         */
        return users;
    }
}
