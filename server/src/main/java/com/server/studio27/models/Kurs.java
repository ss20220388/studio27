package com.server.studio27.models;

public class Kurs {
    private int id;
    private String naziv;
    private String opis;
    private Admin admin;
    private int cena;

    public Kurs() {

    }

    public Kurs(int id, String naziv, String opis, Admin admin, int cena) {
        this.id = id;
        this.naziv = naziv;
        this.opis = opis;
        this.admin = admin;
        this.cena = cena;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getNaziv() {
        return naziv;
    }

    public void setNaziv(String naziv) {
        this.naziv = naziv;
    }

    public String getOpis() {
        return opis;
    }

    public void setOpis(String opis) {
        this.opis = opis;
    }

    public Admin getAdmin() {
        return admin;
    }

    public void setAdmin(Admin admin) {
        this.admin = admin;
    }

    public int getCena() {
        return cena;
    }

    public void setCena(int cena) {
        this.cena = cena;
    }


}
