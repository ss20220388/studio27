package com.server.studio27.models;
import java.sql.Date;

public class Platio {
    private int studentId;
    private int kursId;
    private Date datumPlacanja;
    private int cenaPlacanja;

    public Platio(int studentId, int kursId, Date datumPlacanja, int cenaPlacanja) {
        this.studentId = studentId;
        this.kursId = kursId;
        this.datumPlacanja = datumPlacanja;
        this.cenaPlacanja = cenaPlacanja;
    }   

    public int getStudentId() {
        return studentId;
    }
    public int getKursId() {
        return kursId;
    }
    public Date getDatumPlacanja() {
        return datumPlacanja;
    }
    public int getCenaPlacanja() {
        return cenaPlacanja;
    }
    public void setStudentId(int studentId) {
        this.studentId = studentId;
    }
    public void setKursId(int kursId) {
        this.kursId = kursId;
    }
    public void setDatumPlacanja(Date datumPlacanja) {
        this.datumPlacanja = datumPlacanja;
    }
    public void setCenaPlacanja(int cenaPlacanja) {
        this.cenaPlacanja = cenaPlacanja;
    }
    
}
