package com.server.studio27.controllers;

import java.util.ArrayList;
import java.util.HashMap;
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

    public Map<String, Object> getStudents() {
        try {
            List<Map<String, Object>> students = new ArrayList<>();

            String SQL = """
                    SELECT s.studentId, u.email, u.password, s.ime, s.prezime, s.brojTelefona,u.deviceId,
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
                studentMap.put("studentId", ((Long) row.get("studentId")).intValue());
                studentMap.put("email", (String) row.get("email"));
                studentMap.put("password", (String) row.get("password"));
                studentMap.put("ime", (String) row.get("ime"));
                studentMap.put("prezime", (String) row.get("prezime"));
                studentMap.put("brojTelefona", (String) row.get("brojTelefona"));
                studentMap.put("deviceId", (String) row.get("deviceId"));
                studentMap.put("active", (Integer) row.get("active"));
                String SQL2 = """
                                    Select k.kursId,k.naziv
                                    from kurs k
                                    join pohadja p on p.kursId = k.kursId
                                    where studentId = ?
                                    """;
                List<Map<String, Object>> kursRows = jdbcTemplate.queryForList(SQL2, ((Long) row.get("studentId")).intValue());
                List<Map<String, Object>> kursevi = new ArrayList<>();
                for (Map<String, Object> kursRow : kursRows) {
                    Map<String, Object> kursMap = new HashMap<>();
                    kursMap.put("kursId", ((Long) kursRow.get("kursId")).intValue());
                    kursMap.put("naziv", (String) kursRow.get("naziv"));
                    kursevi.add(kursMap);
                }
                studentMap.put("kursevi", kursevi);
                students.add(studentMap);
            }

            Map<String, Object> result = new HashMap<>();
            result.put("students", students);
            result.put("count", students.size());
            result.put("message", "Students retrieved successfully");
            System.out.println("Students retrieved: " + result);
            return result;

        } catch (Exception e) {
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("students", new ArrayList<>());
            errorResult.put("count", 0);
            errorResult.put("message", "Error retrieving students: " + e.getMessage());
            return errorResult;
        }

    }

    public List<Student> getActiveStudents() {
        List<Student> students = new ArrayList<>();

        String SQL = """
                    SELECT s.studentId, u.email, u.password, s.ime, s.prezime, s.brojTelefona
                    FROM student s
                    JOIN Pohadja p ON s.studentId = p.studentId
                    JOIN user u ON s.studentId = u.userId
                """;

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(SQL);

        for (Map<String, Object> row : rows) {
            students.add(new Student(
                    ((Number) row.get("studentId")).intValue(),
                    (String) row.get("email"),
                    (String) row.get("password"),
                    (String) row.get("ime"),
                    (String) row.get("prezime"),
                    (String) row.get("brojTelefona"),
                    "STUDENT"));
        }

        return students;
    }

    public Map<String, Object> addStudent(Map<String,Object> student) {
        Map<String, Object> result = new HashMap<>();
        try {
            String insertUserSQL = "INSERT INTO user (email, password) VALUES (?, ?)";
            jdbcTemplate.update(insertUserSQL, student.get("email"), student.get("password"));

            String getUserIdSQL = "SELECT userId FROM user WHERE email = ?";
            Integer userId = jdbcTemplate.queryForObject(getUserIdSQL, new Object[]{student.get("email")}, Integer.class);

            String insertStudentSQL = "INSERT INTO student (studentId, ime, prezime, brojTelefona) VALUES (?, ?, ?, ?)";
            jdbcTemplate.update(insertStudentSQL, userId, student.get("ime"), student.get("prezime"), student.get("telefon"));

            result.put("message", "Student added successfully");
            result.put("studentId", userId);
        } catch (Exception e) {
            result.put("message", "Error adding student: " + e.getMessage());
        }
        return result;
    }
    public String deleteStudent(int studentId) {
       
        try {
            String deletePohadjaSQL = "DELETE FROM pohadja WHERE studentId = ?";
            jdbcTemplate.update(deletePohadjaSQL, studentId);

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
            String updateUserSQL = "UPDATE user SET email = ?, password = ? WHERE userId = ?";
            jdbcTemplate.update(updateUserSQL, studentData.get("email"), studentData.get("password"), studentData.get("studentId"));

            String updateStudentSQL = "UPDATE student SET ime = ?, prezime = ?, brojTelefona = ? WHERE studentId = ?";
            jdbcTemplate.update(updateStudentSQL, studentData.get("ime"), studentData.get("prezime"), studentData.get("brojTelefona"), studentData.get("studentId"));
            System.out.println("Kursevi" + studentData.get("kursevi"));
            String deletePohadjaSQL = "DELETE FROM pohadja WHERE studentId = ?";
            jdbcTemplate.update(deletePohadjaSQL, studentData.get("studentId"));
            for (Integer kurs : (List<Integer>) studentData.get("kursevi")) {
                String checkPohadjaSQL = "SELECT COUNT(*) FROM pohadja WHERE studentId = ? AND kursId = ?";
                Integer count = jdbcTemplate.queryForObject(checkPohadjaSQL, new Object[]{studentData.get("studentId"), kurs}, Integer.class);
                if (count == 0) {
                    String insertPohadjaSQL = "INSERT INTO pohadja (studentId, kursId) VALUES (?, ?)";
                    jdbcTemplate.update(insertPohadjaSQL, studentData.get("studentId"), kurs);
                }
            }
            
            return "Student updated successfully";
        } catch (Exception e) {
            return "Error updating student: " + e.getMessage();
        }
    }
}