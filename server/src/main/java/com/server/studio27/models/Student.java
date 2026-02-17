package com.server.studio27.models;

public class Student extends User {
    private int userId;
    private String ime;
    private String prezime;
    private String brojTelefona;


    public Student() {

    }
    public Student(int userId, String email, String password, String ime, String prezime, String brojTelefona) {
        super(userId, email, password);
        this.userId = userId;
        this.ime = ime;
        this.prezime = prezime;
        this.brojTelefona = brojTelefona;
    }
    public int getUserId() {
        return userId;
    }
    public void setUserId(int userId) {
        this.userId = userId;
    }
    public String getIme() {
        return ime;
    }
    public void setIme(String ime) {
        this.ime = ime;
    }
    public String getPrezime() {
        return prezime;
    }
    public void setPrezime(String prezime) {
        this.prezime = prezime;
    }
    public String getBrojTelefona() {
        return brojTelefona;
    }
    public void setBrojTelefona(String brojTelefona) {
        this.brojTelefona = brojTelefona;
    }
    
}
