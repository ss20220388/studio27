package com.server.studio27.models;
import java.util.Date;


public class Recenzije {
    private int id;
    private String opis;
    private int ocena;
    private Date datum;
    private Student student;
    private Kurs kurs;
    // za recenzije sa Instagrama (bez naloga na sajtu)
    private String instagram;
    private String ime;

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

    public String getInstagram() {
        return instagram;
    }

    public void setInstagram(String instagram) {
        this.instagram = instagram;
    }

    public String getIme() {
        return ime;
    }

    public void setIme(String ime) {
        this.ime = ime;
    }

    
}
