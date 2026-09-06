package com.server.studio27.routes;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
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

    // Ruta koju banka poziva (Server-to-Server) i očekuje format odgovora iz PHP skripte
    @PostMapping(value = "/payment/notify", produces = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<String> paymentNotify(@RequestParam Map<String, String> params) {
        String merchantId = params.getOrDefault("MerchantID", "");
        String terminalId = params.getOrDefault("TerminalID", "");
        String orderId = params.getOrDefault("OrderID", "");
        String delay = params.getOrDefault("Delay", "");
        String currency = params.getOrDefault("Currency", "");
        String totalAmount = params.getOrDefault("TotalAmount", "");
        String xid = params.getOrDefault("XID", "");
        String purchaseTime = params.getOrDefault("PurchaseTime", "");

        boolean signatureValid = paymentService.verifySignature(params);

        StringBuilder response = new StringBuilder();
        response.append("MerchantID = ").append(merchantId).append("\n");
        response.append("TerminalID = ").append(terminalId).append("\n");
        response.append("OrderID = ").append(orderId).append("\n");
        response.append("Delay = ").append(delay).append("\n");
        response.append("Currency = ").append(currency).append("\n");
        response.append("TotalAmount = ").append(totalAmount).append("\n");
        response.append("XID = ").append(xid).append("\n");
        response.append("PurchaseTime = ").append(purchaseTime).append("\n");

        if (signatureValid) {
            response.append("Response.action= approve \n");
            response.append("Response.reason= ok \n");
            response.append("Response.forwardUrl= \n");
            return ResponseEntity.ok(response.toString());
        } else {
            response.append("Response.action= reverse \n");
            response.append("Response.reason= something goes wrong \n");
            response.append("Response.forwardUrl= \n");
            return ResponseEntity.ok(response.toString());
        }
    }

    @PostMapping("/payment/success")
    public RedirectView paymentSuccess(@RequestParam Map<String, String> params) {
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
    public RedirectView paymentFailure(@RequestParam Map<String, String> params) {
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