package com.server.studio27.models;

public class Placanje {
     private int studentId;
    private String ime;
    private String prezime;
    private String email;
    private String brojTelefona;
    private String datumPlacanja;
    private int cenaPlacanja;
    
    public Placanje(int studentId, String ime, String prezime, String email, String brojTelefona, String datumPlacanja, int cenaPlacanja) {
        this.studentId = studentId;
        this.ime = ime;
        this.prezime = prezime;
        this.email = email;
        this.brojTelefona = brojTelefona;
        this.datumPlacanja = datumPlacanja;
        this.cenaPlacanja = cenaPlacanja;
    }
    
    public int getStudentId() {
        return studentId;
    }
    public String getIme() {
        return ime;
    }
    public String getPrezime() {
        return prezime;
    }
    public String getEmail() {
        return email;
    }
    public String getBrojTelefona() {
        return brojTelefona;
    }
    public String getDatumPlacanja() {
        return datumPlacanja;
    }
    public int getCenaPlacanja() {
        return cenaPlacanja;
    }
    public void setStudentId(int studentId) {
        this.studentId = studentId;
    }
    public void setIme(String ime) {
        this.ime = ime;
    }
    public void setPrezime(String prezime) {
        this.prezime = prezime;
    }
    public void setEmail(String email) {
        this.email = email;
    }
    public void setBrojTelefona(String brojTelefona) {
        this.brojTelefona = brojTelefona;
    }
    public void setDatumPlacanja(String datumPlacanja) {
        this.datumPlacanja = datumPlacanja;
    }
    public void setCenaPlacanja(int cenaPlacanja) {
        this.cenaPlacanja = cenaPlacanja;
    }

}
