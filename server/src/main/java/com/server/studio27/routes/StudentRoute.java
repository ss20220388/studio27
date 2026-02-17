package com.server.studio27.routes;
import com.server.studio27.controllers.StudentController;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;
import java.util.*;
import com.server.studio27.models.Student;
@RestController
@RequestMapping("/api")

public class StudentRoute {
    private final StudentController studentController;
    private List<Student> students;
    public StudentRoute(StudentController studentController) {
        this.studentController = studentController;
    }
    @GetMapping("/students")
    public List<Student> getStudents() {
        students = studentController.getStudents();
        return students;
    }
    
}
