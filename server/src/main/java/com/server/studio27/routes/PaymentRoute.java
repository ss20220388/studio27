package com.server.studio27.routes;

import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.view.RedirectView;

import com.server.studio27.services.PaymentService;

@RestController
@RequestMapping("/api")
public class PaymentRoute {

    private final PaymentService paymentService;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    public PaymentRoute(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/payment/create")
    public ResponseEntity<?> createPayment(
            @RequestBody Map<String, String> request
    ) {
        try {
            String orderId = request.get("orderId");
            String totalAmountRsd = request.get("totalAmountRsd");

            if (orderId == null || orderId.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Order ID je obavezan."));
            }

            if (totalAmountRsd == null || totalAmountRsd.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("message", "RSD iznos je obavezan."));
            }

            // Napomena: purchaseDesc se ne koristi za sada (videti komentare u
            // PaymentService.createPaymentForm) — ako front-end i dalje šalje to
            // polje u telu zahteva, ovde se jednostavno ignoriše, ne pravi grešku.
            String paymentForm = paymentService.createPaymentForm(
                    orderId,
                    totalAmountRsd
            );

            return ResponseEntity.ok(Map.of("paymentForm", paymentForm));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(
                    Map.of(
                            "message", "Greška prilikom kreiranja forme za plaćanje.",
                            "error", e.getMessage() == null ? "Unknown error" : e.getMessage()
                    )
            );
        }
    }

    /**
     * Banka na ovaj URL šalje POST kad je transakcija uspešna. PRE nego što
     * korisnika proglasimo za "platio je", potpis se mora verifikovati —
     * u suprotnom bilo ko može ručno da pozove ovaj endpoint i lažira uspešno
     * plaćanje bez da je stvarno platio.
     */
    @PostMapping("/payment/success")
    public RedirectView paymentSuccess(
            @RequestParam Map<String, String> params
    ) {
        String orderId = params.getOrDefault("OrderID", "");
        boolean signatureValid = paymentService.verifySignature(params);

        if (!signatureValid) {
            System.out.println("[PaymentRoute] UPOZORENJE: nevažeći potpis na /payment/success za OrderID=" + orderId);
            return new RedirectView(
                    frontendUrl + "/checkout/failure?orderId=" + orderId + "&reason=invalid_signature"
            );
        }

        return new RedirectView(
                frontendUrl + "/checkout/success?orderId=" + orderId
        );
    }

    @PostMapping("/payment/failure")
    public RedirectView paymentFailure(
            @RequestParam Map<String, String> params
    ) {
        String orderId = params.getOrDefault("OrderID", "");

        // Transakcija je već neuspešna, ali svejedno vredi proveriti potpis
        // radi audit traga (da se u logu vidi da li poziv zaista dolazi od banke).
        boolean signatureValid = paymentService.verifySignature(params);
        if (!signatureValid) {
            System.out.println("[PaymentRoute] UPOZORENJE: nevažeći potpis na /payment/failure za OrderID=" + orderId);
        }

        return new RedirectView(
                frontendUrl + "/checkout/failure?orderId=" + orderId
        );
    }
}