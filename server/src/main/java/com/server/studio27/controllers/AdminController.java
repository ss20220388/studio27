package com.server.studio27.controllers;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import com.server.studio27.models.Admin;

@Service
public class AdminController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public List<Map<String, Object>> getAdmins() {
        List<Map<String, Object>> admins = new ArrayList<>();

        String SQL = "SELECT * FROM admin join user u on admin.adminId = u.userId";

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(SQL);
        


        for (Map<String, Object> row : rows) {
            Map<String, Object> response = new HashMap();
            response.put("userId", row.get("adminId"));
            response.put("email", row.get("email"));
            response.put("password", row.get("password"));
            response.put("ime", row.get("ime"));
            response.put("prezime", row.get("prezime"));
            response.put("deviceId", row.get("deviceId"));
            admins.add(response);
        }

        return admins;
    }

    public String editAdmin(Admin admin) {
        String SQL = "UPDATE admin SET email = ?, password = ?, ime = ?, prezime = ? WHERE adminId = ?";
        jdbcTemplate.update(SQL, admin.getEmail(), admin.getPassword(), admin.getIme(), admin.getPrezime(),
                admin.getUserId());
        return "Admin updated successfully";
    }

    public ResponseEntity<Map<String, Object>> getAdminStats() {
        try {
            String SQLActiveStudents = """
                                            Select  count(DISTINCT studentId)
                                            from pohadja
                                        """;
            Integer activeStudents = jdbcTemplate.queryForObject(SQLActiveStudents, Integer.class);
            Map<String,Object> response = new HashMap<>();
            response.put("activeStudents", activeStudents != null ? activeStudents : 0);
            String SQLKupovineOvogMeseca="""
                        Select count(*) as kupovine
                        from platio
                        where datumPlacanja like DATE_FORMAT(CURDATE(), '%Y-%m%')
                        and status = 'P'
                    """;
            Integer kupovineOvogMeseca = jdbcTemplate.queryForObject(SQLKupovineOvogMeseca, Integer.class);
            response.put("kupovineOvogMeseca", kupovineOvogMeseca != null ? kupovineOvogMeseca : 0);

            String SQLPrihodiOvogMeseca = """
                        Select sum(cenaPlacanja) as prihodi
                        from platio
                        where datumPlacanja like DATE_FORMAT(CURDATE(), '%Y-%m%')
                        and status = 'P'
                """;
            Integer prihodiOvogMeseca = jdbcTemplate.queryForObject(SQLPrihodiOvogMeseca, Integer.class);
            response.put("prihodiOvogMeseca", prihodiOvogMeseca != null ? prihodiOvogMeseca : 0);

            String SQLBrojKurseva = """
                        Select count(*) as brojKurseva
                        from kurs
                """;
            Integer brojKurseva = jdbcTemplate.queryForObject(SQLBrojKurseva, Integer.class);
            response.put("brojKurseva", brojKurseva != null ? brojKurseva : 0);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = Map.of("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    public String deleteAdmin(String id) {
        String SQL = "DELETE FROM admin WHERE adminId = ?";

        jdbcTemplate.update(SQL, id);

        String SQL1 = "DELETE FROM user WHERE userId = ?";
        jdbcTemplate.update(SQL1, id);
        return "Admin deleted successfully";
    }

}
