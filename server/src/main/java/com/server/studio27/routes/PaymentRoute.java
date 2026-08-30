package com.server.studio27.routes;

import com.server.studio27.services.PaymentService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.view.RedirectView;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class PaymentRoute {

    private final PaymentService paymentService;

    @Value("${app.frontend-url:https://27archviz.com}")
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

    @PostMapping(value = "/payment/notify", produces = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<String> notifyPayment(
            @RequestParam Map<String, String> params
    ) {
        try {
            boolean success = paymentService.processNotification(params);
            String responseBody = paymentService.buildNotifyResponseBody(params, success);

            return ResponseEntity.ok(responseBody);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("ERROR");
        }
    }

    @PostMapping("/payment/success")
    public RedirectView paymentSuccess(
            @RequestParam Map<String, String> params
    ) {
        String orderId = params.getOrDefault("OrderID", "");

        return new RedirectView(
                frontendUrl + "/checkout/success?orderId=" + orderId
        );
    }

    @PostMapping("/payment/failure")
    public RedirectView paymentFailure(
            @RequestParam Map<String, String> params
    ) {
        String orderId = params.getOrDefault("OrderID", "");

        return new RedirectView(
                frontendUrl + "/checkout/failure?orderId=" + orderId
        );
    }
}