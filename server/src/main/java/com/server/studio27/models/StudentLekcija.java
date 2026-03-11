package com.server.studio27.models;

public class StudentLekcija {
    private int studentId;
    private int lekcijaId;
    private boolean zavrsena;

    public StudentLekcija(int studentId, int lekcijaId, boolean zavrsena) {
        this.studentId = studentId;
        this.lekcijaId = lekcijaId;
        this.zavrsena = zavrsena;
    }

    public int getStudentId() {
        return studentId;
    }

    public void setStudentId(int studentId) {
        this.studentId = studentId;
    }

    public int getLekcijaId() {
        return lekcijaId;
    }

    public void setLekcijaId(int lekcijaId) {
        this.lekcijaId = lekcijaId;
    }

    public boolean isZavrsena() {
        return zavrsena;
    }

    public void setZavrsena(boolean zavrsena) {
        this.zavrsena = zavrsena;
}
}