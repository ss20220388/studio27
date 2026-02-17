package com.server.studio27.models;
import com.server.studio27.models.Student;
import com.server.studio27.models.Kurs;

public class Pohadja   {
    private int studentId;
    private int kursId;
    private Student student;
    private Kurs kurs;

    public Pohadja() {
    }


    public Pohadja(int studentId, int kursId) {
        this.studentId = studentId;
        this.kursId = kursId;
    }
    public Pohadja(int studentId, int kursId, Student student, Kurs kurs) {
        this.studentId = studentId;
        this.kursId = kursId;
        this.student = student;
        this.kurs = kurs;
    }

    public Student getStudent() {
        return student;
    }

    public void setStudent(Student student) {
        this.student = student;
    }

    public Kurs getKurs() {
        return kurs;
    }

    public void setKurs(Kurs kurs) {
        this.kurs = kurs;
    }

    public int getStudentId() {
        return studentId;
    }

    public void setStudentId(int studentId) {
        this.studentId = studentId;
    }

    public int getKursId() {
        return kursId;
    }

    public void setKursId(int kursId) {
        this.kursId = kursId;
    }
}