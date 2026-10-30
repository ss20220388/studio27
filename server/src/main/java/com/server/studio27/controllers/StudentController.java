package com.server.studio27.controllers;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import com.server.studio27.services.MailService;

@Service
public class StudentController {
    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private MailService mailService;

    public Map<String, Object> getStudents() {
        try {
            List<Map<String, Object>> students = new ArrayList<>();

            String SQL = """
                    SELECT s.studentId, u.email, s.ime, s.prezime, s.brojTelefona, s.datumKreiranjaNaloga, u.deviceId,
                    (Case
                        when (Select count(studentId) from pohadja where studentId = s.studentId) >0 then true
                        else false
                    end) As "active"
                    FROM student s
                    JOIN user u ON s.studentId = u.userId
                    """;

            List<Map<String, Object>> rows = jdbcTemplate.queryForList(SQL);
            

            for (Map<String, Object> row : rows) {
                Map<String, Object> studentMap = new HashMap<>();
                studentMap.put("studentId", ((Number) row.get("studentId")).intValue());
                studentMap.put("email", (String) row.get("email"));
                studentMap.put("ime", (String) row.get("ime"));
                studentMap.put("prezime", (String) row.get("prezime"));
                studentMap.put("brojTelefona", (String) row.get("brojTelefona"));
                studentMap.put("deviceId", (String) row.get("deviceId"));
                Object datumKreiranja = row.get("datumKreiranjaNaloga");
                studentMap.put("datumKreiranjaNaloga", datumKreiranja != null ? datumKreiranja.toString() : null);
                studentMap.put("active", (Number) row.get("active"));
               
                String SQL2 = """
                                    Select k.kursId,k.naziv, pk.naziv AS paketNaziv
                                    from kurs k
                                    join pohadja p on p.kursId = k.kursId
                                    left join paket pk on pk.paketId = p.paketId
                                    where studentId = ?
                                    """;
                
                List<Map<String, Object>> kursRows = jdbcTemplate.queryForList(SQL2, ((Number) row.get("studentId")).intValue());
                List<Map<String, Object>> kursevi = new ArrayList<>();
                for (Map<String, Object> kursRow : kursRows) {
                    Map<String, Object> kursMap = new HashMap<>();
                    kursMap.put("kursId", ((Number) kursRow.get("kursId")).intValue());
                    kursMap.put("naziv", (String) kursRow.get("naziv"));
                    // kupljeni paket kursa (npr. "Live mentorship + AI"), null ako je kurs bez paketa
                    kursMap.put("paketNaziv", (String) kursRow.get("paketNaziv"));
                    kursevi.add(kursMap);
                }
                studentMap.put("kursevi", kursevi);
                students.add(studentMap);
            }
            

            Map<String, Object> result = new HashMap<>();
            result.put("students", students);
            result.put("count", students.size());
            result.put("message", "Students retrieved successfully");
            
            return result;

        } catch (Exception e) {
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("students", new ArrayList<>());
            errorResult.put("count", 0);
            errorResult.put("message", "Error retrieving students: " + e.getMessage());
            return errorResult;
        }

    }

    public String deleteStudent(int studentId) {
       
        try {
            String deletePohadjaSQL = "DELETE FROM pohadja WHERE studentId = ?";
            jdbcTemplate.update(deletePohadjaSQL, studentId);
            System.out.println("Deleted from pohadja for studentId: " + studentId);

            // slika.recenzijaId je strani kljuc ka recenziji, pa ga prvo treba osloboditi
            String unlinkSlikeSQL = "UPDATE slika SET recenzijaId = NULL WHERE recenzijaId IN (SELECT recenzijaId FROM recenzija WHERE studentId = ?)";
            jdbcTemplate.update(unlinkSlikeSQL, studentId);

            String deleteFromRecenzije = "DELETE FROM recenzija WHERE studentId = ?";
            jdbcTemplate.update(deleteFromRecenzije, studentId);

            System.out.println("Deleted from recenzija for studentId: " + studentId);
            String deleteFromPlatio = "DELETE FROM platio WHERE studentId = ?";
            jdbcTemplate.update(deleteFromPlatio, studentId);
            System.out.println("Deleted from platio for studentId: " + studentId);

            String deleteStudentSQL = "DELETE FROM student WHERE studentId = ?";
            jdbcTemplate.update(deleteStudentSQL, studentId);


            String deleteUserSQL = "DELETE FROM user WHERE userId = ?";
            jdbcTemplate.update(deleteUserSQL, studentId);
           

            return "Student deleted successfully";
        } catch (Exception e) {
            return "Error deleting student: " + e.getMessage();
        }
    }

    public String editStudentAsAdmin(Map<String, Object> studentData) {
        try {
            Object studentId = studentData.get("studentId");

            // Lozinka se ovde namerno NE menja (admin forma je i ne salje)
            String updateUserSQL = "UPDATE user SET email = ? WHERE userId = ?";
            jdbcTemplate.update(updateUserSQL, studentData.get("email"), studentId);

            String updateStudentSQL = "UPDATE student SET ime = ?, prezime = ?, brojTelefona = ? WHERE studentId = ?";
            jdbcTemplate.update(updateStudentSQL, studentData.get("ime"), studentData.get("prezime"), studentData.get("brojTelefona"), studentId);

            // Kursevi koje je student imao pre izmene, da znamo kome treba poslati mail
            Set<Integer> stariKursevi = new HashSet<>(jdbcTemplate.queryForList(
                    "SELECT kursId FROM pohadja WHERE studentId = ?", Integer.class, studentId));

            Set<Integer> noviKursevi = new LinkedHashSet<>();
            Object kurseviRaw = studentData.get("kursevi");
            if (kurseviRaw instanceof List<?> lista) {
                for (Object kurs : lista) {
                    if (kurs instanceof Number broj) {
                        noviKursevi.add(broj.intValue());
                    }
                }
            }

            // paketi postojećih upisa se čuvaju i posle izmene liste kurseva
            Map<Integer, Object> paketPoKursu = new HashMap<>();
            jdbcTemplate.query("SELECT kursId, paketId FROM pohadja WHERE studentId = ?",
                    rs -> { paketPoKursu.put(rs.getInt("kursId"), rs.getObject("paketId")); }, studentId);

            String deletePohadjaSQL = "DELETE FROM pohadja WHERE studentId = ?";
            jdbcTemplate.update(deletePohadjaSQL, studentId);
            for (Integer kurs : noviKursevi) {
                String insertPohadjaSQL = "INSERT INTO pohadja (studentId, kursId, paketId) VALUES (?, ?, ?)";
                jdbcTemplate.update(insertPohadjaSQL, studentId, kurs, paketPoKursu.get(kurs));
            }

            for (Integer kurs : noviKursevi) {
                if (!stariKursevi.contains(kurs)) {
                    posaljiMailDodatNaKurs((String) studentData.get("email"), (String) studentData.get("ime"), kurs);
                }
            }

            return "Student updated successfully";
        } catch (Exception e) {
            return "Error updating student: " + e.getMessage();
        }
    }

    private void posaljiMailDodatNaKurs(String email, String ime, Integer kursId) {
        if (email == null || email.isBlank()) {
            return;
        }
        try {
            List<String> nazivi = jdbcTemplate.queryForList("SELECT naziv FROM kurs WHERE kursId = ?", String.class, kursId);
            String nazivKursa = nazivi.isEmpty() ? "" : nazivi.get(0);

            String pozdrav = ime != null && !ime.isBlank() ? " " + ime.trim() : "";
            String subject = "Dodati ste na kurs " + nazivKursa;
            String body = "<p>Poštovani/a" + pozdrav + ",</p>" +
                    "<p>Obaveštavamo vas da ste dodati na kurs <strong>" + nazivKursa + "</strong>. " +
                    "Kurs je sada aktivan na vašem nalogu i možete početi sa učenjem.</p>" +
                    "<p>Ako još uvek nemate lozinku, na stranici za prijavu kliknite na <em>Zaboravljena lozinka</em> i postavite novu.</p>" +
                    "<center><a href='" + mailService.getFrontendUrl() + "' class='btn'>PRIJAVI SE</a></center>";

            mailService.sendHtmlEmail(email, subject, null, body);
        } catch (Exception e) {
            // Neuspeh slanja maila ne sme da obori izmenu studenta
            System.err.println("Greška pri slanju maila o dodavanju na kurs " + kursId + " za " + email + ": " + e.getMessage());
        }
    }
    public List<String> getStudentMails(){
        try {
            String SQL = "SELECT email FROM user u JOIN student s ON u.userId = s.studentId";
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(SQL);
            List<String> emails = new ArrayList<>();
            for(Map<String,Object> row : rows){
                List<String> emailMap = new ArrayList<>();
                emails.add((String) row.get("email"));
            }
            return emails;
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }
}