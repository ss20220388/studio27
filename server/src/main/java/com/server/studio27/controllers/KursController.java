package com.server.studio27.controllers;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import com.server.studio27.models.Kurs;
@Service
public class KursController {

    public List<Kurs> getAllKursevi() {
        List<Kurs> kursevi = new ArrayList<>();
        kursevi.add(new Kurs(1, "Java Programming", "Learn Java from scratch", null, 100));
        kursevi.add(new Kurs(2, "Web Development", "Learn how to build websites", null, 150));
        return kursevi;
    }

}
