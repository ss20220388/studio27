package com.server.studio27.routes;

import java.util.Map;
import java.util.HashMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.jdbc.core.JdbcTemplate;
import com.server.studio27.controllers.StudentLekcijaController;

@RestController
@RequestMapping("/api")
public class StudentLekcijeRoute {

    @Autowired
    private StudentLekcijaController studentLekcijaController;

    @Autowired
    private com.server.studio27.auth.JwtService jwtService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private com.server.studio27.auth.CustomUserDetailsService customUserDetailsService;

    @PutMapping("/update-sati-gledanja")
    public String updateSatiGledanja(@RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, Object> entity) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return "Nedostaje JWT token";
        }

        String accessToken = authHeader.substring(7);
        String email = jwtService.extractUsername(accessToken);

        String getUserIdSQL = """
                Select userId, case
                when (select count(studentId) from student where studentId = user.userId)>0 then "STUDENT"
                else "ADMIN"
                end AS "Role"
                from user
                where user.email = ?
                            """;
        ;
        
        Map<String, Object> userData = new HashMap<>();
        try {
            userData = jdbcTemplate.queryForMap(getUserIdSQL, email);
        } catch (Exception e) {
            return "Korisnik nije pronađen";
        }

        studentLekcijaController.updateSatiGledanja(
                (Integer) userData.get("userId"),
                (String) userData.get("Role"),
                (Integer) entity.get("lekcijaId"),
                (Integer) entity.get("satiGledanja"));

        return "Sati gledanja uspješno ažurirani.";
    }

}
