package com.server.studio27.models;

public class Lekcija {
    private int lekcijaId;
    private String naziv;
    private String opis;
    private String  videoUrl;

    public Lekcija() {
    }

    public Lekcija(int lekcijaId, String naziv, String opis, String videoUrl) {
        this.lekcijaId = lekcijaId;
        this.naziv = naziv;
        this.opis = opis;
        this.videoUrl = videoUrl;
    }

    public int getLekcijaId() {
        return lekcijaId;
    }

    public void setLekcijaId(int lekcijaId) {
        this.lekcijaId = lekcijaId;
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


    public String getVideoUrl() {
        return videoUrl;
    }

    public void setVideoUrl(String videoUrl) {
        this.videoUrl = videoUrl;
    }
}