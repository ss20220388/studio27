package com.server.studio27.models;
import java.util.List;
public class Kurs {
    private int id;
    private String naziv;
    private String opis;
    private int cena;
    private int trajanje;
    private String slikaUrl;
    private String sadrzaj;
    private List<Lekcija> lekcije;
    private String glavniKurs;
    private String komentarDole;
    private String komentarSredina;
    private String komentarGore;
    public Kurs() {

    }

    public Kurs(int id, String naziv, String opis, int cena, int trajanje, String slikaUrl,  String glavniKurs, String komentarDole, String komentarSredina, String komentarGore) {
        this.id = id;
        this.naziv = naziv;
        this.opis = opis;
        this.cena = cena;
        this.trajanje = trajanje;
        this.slikaUrl = slikaUrl;
    
        this.glavniKurs = glavniKurs;
        this.komentarDole = komentarDole;
        this.komentarSredina = komentarSredina;
        this.komentarGore = komentarGore;
    }

    public Kurs(int id, String naziv, String opis, int cena, int trajanje, String slikaUrl, String sadrzaj, String glavniKurs, String komentarDole, String komentarSredina, String komentarGore) {
        this(id, naziv, opis, cena, trajanje, slikaUrl, glavniKurs, komentarDole, komentarSredina, komentarGore);
        this.sadrzaj = sadrzaj;
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
    public Kurs(int id, String naziv, String opis, int cena, int trajanje, String slikaUrl,String glavniKurs, String komentarDole, String komentarSredina, String komentarGore, List<Lekcija> lekcije) {
        this.id = id;
        this.naziv = naziv;
        this.opis = opis;
        this.cena = cena;
        this.trajanje = trajanje;
        this.slikaUrl = slikaUrl;
        this.lekcije = lekcije;
        this.glavniKurs = glavniKurs;
        this.komentarDole = komentarDole;
        this.komentarSredina = komentarSredina;
        this.komentarGore = komentarGore;
    }

    public Kurs(int id, String naziv, String opis, int cena, int trajanje, String slikaUrl, String sadrzaj, String glavniKurs, String komentarDole, String komentarSredina, String komentarGore, List<Lekcija> lekcije) {
        this(id, naziv, opis, cena, trajanje, slikaUrl, glavniKurs, komentarDole, komentarSredina, komentarGore, lekcije);
        this.sadrzaj = sadrzaj;
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
    public String getSadrzaj() {
        return sadrzaj;
    }
    public void setSadrzaj(String sadrzaj) {
        this.sadrzaj = sadrzaj;
    }
    public List<Lekcija> getLekcije() {
        return lekcije;
    }
    public void setLekcije(List<Lekcija> lekcije) {
        this.lekcije = lekcije;
    }
    public String getGlavniKurs() {
        return glavniKurs;
    }
    public void setGlavniKurs(String glavniKurs) {
        this.glavniKurs = glavniKurs;
    }
    public String getKomentarDole() {
        return komentarDole;
    }
    public void setKomentarDole(String komentarDole) {
        this.komentarDole = komentarDole;
    }
    public String getKomentarSredina() {
        return komentarSredina;
    }
    public void setKomentarSredina(String komentarSredina) {
        this.komentarSredina = komentarSredina;
    }
    public String getKomentarGore() {
        return komentarGore;
    }
    public void setKomentarGore(String komentarGore) {
        this.komentarGore = komentarGore;
    }
    
}
