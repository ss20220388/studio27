package com.server.studio27.models;

public class RadoviStudenata {

    private int idRad;
    private int idStudent;
    private int idKurs;
    private int slikaId;

    private String naziv;     // naziv kursa
    private String ime;       // ime studenta
    private String prezime;   // prezime studenta
    private String url;       // url slike

    public RadoviStudenata(int idRad, int idStudent, int idKurs, int slikaId,
                           String naziv, String ime, String prezime, String url) {
        this.idRad = idRad;
        this.idStudent = idStudent;
        this.idKurs = idKurs;
        this.slikaId = slikaId;
        this.naziv = naziv;
        this.ime = ime;
        this.prezime = prezime;
        this.url = url;
    }

    public int getIdRad() { return idRad; }
    public void setIdRad(int idRad) { this.idRad = idRad; }

    public int getIdStudent() { return idStudent; }
    public void setIdStudent(int idStudent) { this.idStudent = idStudent; }

    public int getIdKurs() { return idKurs; }
    public void setIdKurs(int idKurs) { this.idKurs = idKurs; }

    public int getSlikaId() { return slikaId; }
    public void setSlikaId(int slikaId) { this.slikaId = slikaId; }

    public String getNaziv() { return naziv; }
    public void setNaziv(String naziv) { this.naziv = naziv; }

    public String getIme() { return ime; }
    public void setIme(String ime) { this.ime = ime; }

    public String getPrezime() { return prezime; }
    public void setPrezime(String prezime) { this.prezime = prezime; }

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }
}