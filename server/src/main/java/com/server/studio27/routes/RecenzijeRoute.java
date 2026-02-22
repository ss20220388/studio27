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

    public RecenzijeRoute(RecenzijeController recenzijeController) {
        this.recenzijeController = recenzijeController;
    }
    
    @GetMapping("/recenzije")
    public List<Recenzije> getRecenzije() {
        return recenzijeController.getRecenzije();
    }
}
