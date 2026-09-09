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
import org.springframework.web.bind.annotation.RequestMethod;
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

    // ============================================================
    // PAYMENT CREATE
    // ============================================================

    public record PaymentCreateRequest(
            String orderId,
            Long studentId,
            List<Long> courseIds,
            BigDecimal totalAmount
    ) {
    }

    @PostMapping("/payment/create")
    public ResponseEntity<?> createPayment(
            @RequestBody PaymentCreateRequest request
    ) {
        try {

            if (request.orderId() == null || request.orderId().isBlank()) {
                return ResponseEntity.badRequest().body(
                        Map.of("message", "Order ID je obavezan.")
                );
            }

            if (request.studentId() == null) {
                return ResponseEntity.badRequest().body(
                        Map.of("message", "StudentID je obavezan.")
                );
            }

            if (request.courseIds() == null || request.courseIds().isEmpty()) {
                return ResponseEntity.badRequest().body(
                        Map.of("message", "Korpa je prazna.")
                );
            }

            String paymentForm = paymentService.createPaymentForm(
                    request.orderId(),
                    request.studentId(),
                    request.courseIds(),
                    request.totalAmount()
            );

            return ResponseEntity.ok(
                    Map.of("paymentForm", paymentForm)
            );

        } catch (IllegalArgumentException e) {

            return ResponseEntity.badRequest().body(
                    Map.of("message", e.getMessage())
            );

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity.internalServerError().body(
                    Map.of(
                            "message",
                            "Greška prilikom kreiranja forme za plaćanje.",
                            "error",
                            e.getMessage() == null
                                    ? "Unknown error"
                                    : e.getMessage()
                    )
            );
        }
    }

    // ============================================================
    // PAYMENT NOTIFY
    // ============================================================
    //
    // OVO JE SERVER-TO-SERVER CALLBACK BANKE.
    //
    // Banka poziva:
    //
    // POST https://api.27archviz.com/api/payment/notify
    //
    // Ovde proveravamo potpis banke i ovde jedino upisujemo
    // uspešno plaćanje u bazu.
    //
    // ============================================================

    @PostMapping(
            value = "/payment/notify",
            produces = MediaType.TEXT_PLAIN_VALUE
    )
    public ResponseEntity<String> paymentNotify(
            @RequestParam Map<String, String> params
    ) {

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

        response.append("MerchantID = ")
                .append(merchantId)
                .append("\n");

        response.append("TerminalID = ")
                .append(terminalId)
                .append("\n");

        response.append("OrderID = ")
                .append(orderId)
                .append("\n");

        response.append("Delay = ")
                .append(delay)
                .append("\n");

        response.append("Currency = ")
                .append(currency)
                .append("\n");

        response.append("TotalAmount = ")
                .append(totalAmount)
                .append("\n");

        response.append("XID = ")
                .append(xid)
                .append("\n");

        response.append("PurchaseTime = ")
                .append(purchaseTime)
                .append("\n");

        // --------------------------------------------------------
        // VALIDAN POTPIS
        // --------------------------------------------------------

        if (signatureValid) {

            try {

                /*
                 * BITNO:
                 *
                 * Ovde se jedino upisuje uspešno plaćanje.
                 *
                 * SUCCESS ruta više NE radi ovaj upis.
                 */
                paymentService.recordSuccessfulPayment(orderId);

            } catch (Exception e) {

                System.err.println(
                        "[PaymentRoute] Upis u uplatnica/pohadja nije uspeo "
                                + "za OrderID=" + orderId
                                + ": "
                                + e.getMessage()
                );

                e.printStackTrace();

                /*
                 * Banki i dalje vraćamo approve.
                 *
                 * Ovo je ostavljeno prema tvojoj postojećoj logici.
                 */
            }

            response.append("Response.action= approve \n");
            response.append("Response.reason= ok \n");
            response.append("Response.forwardUrl= \n");

            return ResponseEntity.ok(response.toString());
        }

        // --------------------------------------------------------
        // NEVALIDAN POTPIS
        // --------------------------------------------------------

        response.append("Response.action= reverse \n");
        response.append("Response.reason= something goes wrong \n");
        response.append("Response.forwardUrl= \n");

        return ResponseEntity.ok(response.toString());
    }

    // ============================================================
    // PAYMENT SUCCESS
    // ============================================================
    //
    // OVO JE USER BROWSER CALLBACK.
    //
    // Banka korisnika vraća na:
    //
    // https://api.27archviz.com/api/payment/success
    //
    // Ova ruta NE UPISUJE ništa u bazu.
    //
    // Notify je taj koji potvrđuje uplatu.
    //
    // Posle toga korisnika preusmeravamo na Astro:
    //
    // https://27archviz.com/checkout/success
    //
    // ============================================================

    @RequestMapping(
            value = "/payment/success",
            method = {RequestMethod.GET, RequestMethod.POST}
    )
    public RedirectView paymentSuccess(
            @RequestParam Map<String, String> params
    ) {

        String orderId = params.getOrDefault("OrderID", "");

        System.out.println(
                "[PaymentRoute] SUCCESS callback received. OrderID="
                        + orderId
        );

        /*
         * VAŽNO:
         *
         * Ne radimo:
         *
         * paymentService.recordSuccessfulPayment(orderId);
         *
         * jer je to već urađeno preko /payment/notify.
         */

        String redirectUrl =
                frontendUrl
                        + "/checkout/success?orderId="
                        + orderId;

        return new RedirectView(redirectUrl);
    }

    // ============================================================
    // PAYMENT FAILURE
    // ============================================================
    //
    // User browser callback za neuspešno plaćanje.
    //
    // Podržavamo i GET i POST jer payment gateway može koristiti
    // jedan od ta dva načina za vraćanje korisnika.
    //
    // ============================================================

    @RequestMapping(
            value = "/payment/failure",
            method = {RequestMethod.GET, RequestMethod.POST}
    )
    public RedirectView paymentFailure(
            @RequestParam Map<String, String> params
    ) {

        String orderId = params.getOrDefault("OrderID", "");

        System.out.println(
                "[PaymentRoute] FAILURE callback received. OrderID="
                        + orderId
        );

        String redirectUrl =
                frontendUrl
                        + "/checkout/failure?orderId="
                        + orderId;

        return new RedirectView(redirectUrl);
    }
}