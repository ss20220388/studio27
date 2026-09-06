package com.server.studio27.routes;

import java.math.BigDecimal;
import java.util.List;
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
    public record PaymentCreateRequest(String orderId, List<Long> courseIds, BigDecimal totalAmount) {
    }

    @PostMapping("/payment/create")
    public ResponseEntity<?> createPayment(
            @RequestBody PaymentCreateRequest request
    ) {
        try {
            if (request.orderId() == null || request.orderId().isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Order ID je obavezan."));
            }

            if (request.courseIds() == null || request.courseIds().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Korpa je prazna."));
            }

            String paymentForm = paymentService.createPaymentForm(
                    request.orderId(),
                    request.courseIds(),
                    request.totalAmount()
            );

            return ResponseEntity.ok(Map.of("paymentForm", paymentForm));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
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

        boolean signatureValid = paymentService.verifySignature(params);
        if (!signatureValid) {
            System.out.println("[PaymentRoute] UPOZORENJE: nevažeći potpis na /payment/failure za OrderID=" + orderId);
        }

        return new RedirectView(
                frontendUrl + "/checkout/failure?orderId=" + orderId
        );
    }
}