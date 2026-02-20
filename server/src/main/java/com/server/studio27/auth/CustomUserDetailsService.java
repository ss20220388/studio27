package com.server.studio27.auth;

import java.util.Collections;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        String SQL = """
            SELECT 
                u.userId, u.email, u.password,
                CASE 
                    WHEN a.adminId IS NOT NULL THEN 'ROLE_ADMIN'
                    WHEN s.studentId IS NOT NULL THEN 'ROLE_STUDENT'
                    ELSE 'ROLE_USER'
                END AS role
            FROM user u
            LEFT JOIN admin a ON u.userId = a.adminId
            LEFT JOIN student s ON u.userId = s.studentId
            WHERE u.email = ?
        """;

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(SQL, email);

        if (rows.isEmpty()) {
            throw new UsernameNotFoundException("Korisnik sa email-om " + email + " nije pronadjen");
        }

        Map<String, Object> row = rows.get(0);
        String password = (String) row.get("password");
        String role = (String) row.get("role");

        return new User(
                email,
                password,
                Collections.singletonList(new SimpleGrantedAuthority(role))
        );
    }
}
