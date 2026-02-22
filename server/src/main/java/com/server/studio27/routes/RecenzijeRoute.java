package com.server.studio27.routes;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import com.server.studio27.controllers.RecenzijeController;
import com.server.studio27.models.Recenzije;



@RestController
@RequestMapping("/api")
public class RecenzijeRoute {
    private final RecenzijeController recenzijeController;
    private List<Recenzije> recenzije;

    public RecenzijeRoute(RecenzijeController recenzijeController) {
        this.recenzijeController = recenzijeController;
        this.recenzije = recenzijeController.getRecenzije();
    }
    
    @GetMapping("/recenzije")
    public List<Recenzije> getRecenzije() {
        return recenzije;
    }
}
