package com.server.studio27.models;
public class Admin extends User {
    private int userId;
    private String ime;
    private String prezime;
    

    public Admin()  {

    }
    public Admin(int userId, String email, String password, String ime, String prezime) {
        super(userId, email, password);
        this.userId = userId;
        this.ime = ime;
        this.prezime = prezime;
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
    
    
}
