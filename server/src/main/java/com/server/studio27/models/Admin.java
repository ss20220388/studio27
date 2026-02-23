package com.server.studio27.models;
public class Admin extends User {
    private String ime;
    private String prezime;
    

    public Admin()  {

    }
    public Admin(int adminId, String email, String password, String ime, String prezime) {
        super(adminId, email, password);
        this.ime = ime;
        this.prezime = prezime;
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
