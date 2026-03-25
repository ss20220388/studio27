package com.server.studio27.models;

import java.util.ArrayList;
import java.util.List;

public class Lekcija {
    private int lekcijaId;
    private String naziv;
    private String opis;
    private List<String> videoUrls;

    public Lekcija() {
    }

    public Lekcija(int lekcijaId, String naziv, String opis, List<String> videoUrls) {
        this.lekcijaId = lekcijaId;
        this.naziv = naziv;
        this.opis = opis;
        this.videoUrls = videoUrls;
    }
     public Lekcija(int lekcijaId, String naziv, String opis) {
        this.lekcijaId = lekcijaId;
        this.naziv = naziv;
        this.opis = opis;
        this.videoUrls = new ArrayList<>();
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


    public List<String> getVideoUrls() {
        return videoUrls;
    }

    public void setVideoUrls(List<String> videoUrls) {
        this.videoUrls = videoUrls;
    }
}