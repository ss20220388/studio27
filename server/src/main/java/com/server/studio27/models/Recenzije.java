package com.server.studio27.models;
import java.util.Date;


public class Recenzije {
    private int id;
    private String opis;
    private int ocena;
    private Date datum;
    private Student student;
    private Kurs kurs;

    public Recenzije() {
    }

    public Recenzije(int id, String opis, int ocena, Date datum, Student student, Kurs kurs) {
        this.id = id;
        this.opis = opis;
        this.ocena = ocena;
        this.datum = datum;
        this.student = student;
        this.kurs = kurs;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getOpis() {
        return opis;
    }

    public void setOpis(String opis) {
        this.opis = opis;
    }

    public int getOcena() {
        return ocena;
    }

    public void setOcena(int ocena) {
        this.ocena = ocena;
    }

    public Date getDatum() {
        return datum;
    }

    public void setDatum(Date datum) {
        this.datum = datum;
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

    
}
