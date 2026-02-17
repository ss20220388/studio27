package com.server.studio27.models;

public class Kurs {
    private int id;
    private String naziv;
    private String opis;
    private int cena;
    private int trajanje;
    private String slikaUrl;
    public Kurs() {

    }

    public Kurs(int id, String naziv, String opis, int cena) {
        this.id = id;
        this.naziv = naziv;
        this.opis = opis;
        this.cena = cena;
    }
    public Kurs(int id, String naziv, String opis, int cena, int trajanje, String slikaUrl) {
        this.id = id;
        this.naziv = naziv;
        this.opis = opis;
        this.cena = cena;
        this.trajanje = trajanje;
        this.slikaUrl = slikaUrl;
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
    public int getCena() {
        return cena;
    }

    public void setCena(int cena) {
        this.cena = cena;
    }
    public int getTrajanje() {
        return trajanje;
    } 
    public void setTrajanje(int trajanje) {
        this.trajanje = trajanje;
    }
    public String getSlikaUrl() {
        return slikaUrl;
    }
    public void setSlikaUrl(String slikaUrl) {
        this.slikaUrl = slikaUrl;
    }

}
