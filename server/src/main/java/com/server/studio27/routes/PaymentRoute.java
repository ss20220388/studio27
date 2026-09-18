package com.server.studio27.routes;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.view.RedirectView;

import com.server.studio27.services.MailService;
import com.server.studio27.services.PaymentService;

@RestController
@RequestMapping("/api")
public class PaymentRoute {

    private static final Set<String> APPROVED_TRAN_CODES = Set.of("000", "00");

    private static boolean isApprovedTranCode(String tranCode) {
        return tranCode != null && APPROVED_TRAN_CODES.contains(tranCode.trim());
    }

    private final PaymentService paymentService;
    private final MailService mailService;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    public PaymentRoute(PaymentService paymentService, MailService mailService) {
        this.paymentService = paymentService;
        this.mailService = mailService;
    }

    public record PaymentCreateRequest(String orderId, Long studentId, List<Long> courseIds, BigDecimal totalAmount) {
    }

    @CrossOrigin(origins = {"https://27archviz.com", "https://www.27archviz.com", "http://localhost:4321"}, allowCredentials = "true")
    @PostMapping("/payment/create")
    public ResponseEntity<?> createPayment(
            @RequestBody PaymentCreateRequest request
    ) {
        try {
            if (request.orderId() == null || request.orderId().isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Order ID je obavezan."));
            }

            if (request.studentId() == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "StudentID je obavezan."));
            }

            if (request.courseIds() == null || request.courseIds().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Korpa je prazna."));
            }

            String paymentForm = paymentService.createPaymentForm(
                    request.orderId(),
                    request.studentId(),
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

    @RequestMapping(value = "/payment/notify", method = {RequestMethod.GET, RequestMethod.POST}, produces = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<String> paymentNotify(@RequestParam Map<String, String> params) {
        System.out.println("[PaymentRoute][DEBUG] /payment/notify SVI parametri koje je banka poslala: " + params);

        String merchantId = getParamCaseInsensitive(params, "MerchantID");
        String terminalId = getParamCaseInsensitive(params, "TerminalID");
        String orderId = getParamCaseInsensitive(params, "OrderID");
        String delay = getParamCaseInsensitive(params, "Delay");
        String currency = getParamCaseInsensitive(params, "Currency");
        String totalAmount = getParamCaseInsensitive(params, "TotalAmount");
        String xid = getParamCaseInsensitive(params, "XID");
        String purchaseTime = getParamCaseInsensitive(params, "PurchaseTime");
        String tranCode = getParamCaseInsensitive(params, "TranCode");

        boolean signatureValid = paymentService.verifySignature(params);
        boolean transactionApproved = signatureValid && isApprovedTranCode(tranCode);

        System.out.println("[PaymentRoute][DEBUG] /payment/notify signatureValid=" + signatureValid
                + " TranCode=" + tranCode
                + " transactionApproved=" + transactionApproved
                + " za OrderID=" + orderId);

        StringBuilder response = new StringBuilder();
        response.append("MerchantID = ").append(merchantId).append("\n");
        response.append("TerminalID = ").append(terminalId).append("\n");
        response.append("OrderID = ").append(orderId).append("\n");
        response.append("Delay = ").append(delay).append("\n");
        response.append("Currency = ").append(currency).append("\n");
        response.append("TotalAmount = ").append(totalAmount).append("\n");
        response.append("XID = ").append(xid).append("\n");
        response.append("PurchaseTime = ").append(purchaseTime).append("\n");

        if (transactionApproved) {
            // recordPaymentIfValid vraća true samo ako je OVO prvi (uspešan) upis za ovaj orderId,
            // tako da mail ide samo jednom čak i ako banka pošalje notify više puta (retry).
            boolean firstTimeRecorded = recordPaymentIfValid(orderId, "/payment/notify");
            if (firstTimeRecorded) {
                sendPaymentSuccessEmail(orderId);
            }

            response.append("Response.action= approve \n");
            response.append("Response.reason= ok \n");
            response.append("Response.forwardUrl= \n");
            return ResponseEntity.ok(response.toString());
        } else {
            if (signatureValid) {
                System.out.println("[PaymentRoute] Transakcija ODBIJENA (validan potpis, TranCode=" + tranCode + ") za OrderID=" + orderId + " — upisujem status O u platio.");
                boolean firstTimeRecordedFailure = recordFailureIfValid(orderId, "/payment/notify");
                if (firstTimeRecordedFailure) {
                    sendPaymentFailureEmail(orderId);
                }
            } else {
                System.out.println("[PaymentRoute] UPOZORENJE: nevažeći potpis na /payment/notify za OrderID=" + orderId);
            }

            response.append("Response.action= reverse \n");
            response.append("Response.reason= something goes wrong \n");
            response.append("Response.forwardUrl= \n");
            return ResponseEntity.ok(response.toString());
        }
    }

    @RequestMapping(value = {"/payment/success", "/payment/return"}, method = {RequestMethod.GET, RequestMethod.POST})
    public RedirectView paymentSuccess(@RequestParam Map<String, String> params) {
        System.out.println("[PaymentRoute][DEBUG] /payment/success SVI parametri koje je banka poslala: " + params);

        String orderId = getParamCaseInsensitive(params, "OrderID");
        String tranCode = getParamCaseInsensitive(params, "TranCode");
        boolean signatureValid = paymentService.verifySignature(params);
        boolean transactionApproved = signatureValid && isApprovedTranCode(tranCode);

        System.out.println("[PaymentRoute][DEBUG] /payment/success signatureValid=" + signatureValid
                + " TranCode=" + tranCode
                + " transactionApproved=" + transactionApproved
                + " za OrderID=" + orderId);

        // Napomena: slanje mailova se namerno NE ponavlja ovde — /payment/notify je
        // server-to-server poziv banke i tu je autoritativno mesto gde se mail šalje
        // tačno jednom. Ova ruta samo redirektuje korisnikov browser na odgovarajuću stranicu.

        if (!signatureValid) {
            System.out.println("[PaymentRoute] UPOZORENJE: nevažeći potpis na /payment/success za OrderID=" + orderId);
            return new RedirectView(
                    frontendUrl + "/checkout/failure?orderId=" + orderId + "&reason=invalid_signature"
            );
        }

        if (!transactionApproved) {
            System.out.println("[PaymentRoute] Transakcija ODBIJENA (validan potpis, TranCode=" + tranCode + ") na /payment/success za OrderID=" + orderId + " — ne upisujem uplatu.");
            return new RedirectView(
                    frontendUrl + "/checkout/failure?orderId=" + orderId + "&reason=transaction_declined"
            );
        }

        recordPaymentIfValid(orderId, "/payment/success");

        return new RedirectView(
                frontendUrl + "/checkout/success?orderId=" + orderId
        );
    }

    @RequestMapping(value = "/payment/failure", method = {RequestMethod.GET, RequestMethod.POST})
    public RedirectView paymentFailure(@RequestParam Map<String, String> params) {
        System.out.println("[PaymentRoute][DEBUG] /payment/failure SVI parametri koje je banka poslala: " + params);

        String orderId = getParamCaseInsensitive(params, "OrderID");

        boolean signatureValid = paymentService.verifySignatureFailure(params);
        System.out.println("[PaymentRoute][DEBUG] /payment/failure signatureValid=" + signatureValid + " za OrderID=" + orderId);
        if (!signatureValid) {
            System.out.println("[PaymentRoute] UPOZORENJE: nevažeći potpis na /payment/failure za OrderID=" + orderId);
        }

        return new RedirectView(
                frontendUrl + "/checkout/failure?orderId=" + orderId
        );
    }

    /**
     * @return true ako je uplata SADA prvi put uspešno upisana (znači: treba poslati mail).
     *         false ako je već ranije upisana (duplikat notify poziva) ili je upis pukao.
     *
     * PRETPOSTAVKA: paymentService.recordSuccessfulPayment(orderId) baca izuzetak (npr. zbog
     * unique constraint-a u bazi) ako je uplata za taj orderId već ranije upisana. Ako to nije
     * slučaj u tvojoj implementaciji, javi mi pa prilagodim (npr. da recordSuccessfulPayment
     * sam vraća boolean).
     */
    private boolean recordPaymentIfValid(String orderId, String endpointSource) {
        try {
            paymentService.recordSuccessfulPayment(orderId);
            return true;
        } catch (Exception e) {
            System.err.println("[PaymentRoute] Upis u platio/pohadja nije uspeo (preko " + endpointSource + ") za OrderID=" + orderId + ": " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }

    /**
     * @return true ako je odbijena uplata SADA prvi put upisana u platio (status 'O')
     *         — znači: treba poslati mail. false ako je već obrađena ranije (duplikat
     *         notify poziva) ili je upis pukao.
     */
    private boolean recordFailureIfValid(String orderId, String endpointSource) {
        try {
            paymentService.recordFailedPayment(orderId);
            return true;
        } catch (Exception e) {
            System.err.println("[PaymentRoute] Upis odbijene uplate u platio nije uspeo (preko " + endpointSource + ") za OrderID=" + orderId + ": " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }

    /**
     * Koristi PaymentService.getBuyerInfoByOrderId(orderId), koja nalazi email preko
     * pending_orders.student_id -> student.studentId -> user.userId. Vidi PaymentService_dodatak.java.
     */
    private void sendPaymentSuccessEmail(String orderId) {
        try {
            PaymentService.BuyerInfo buyer = paymentService.getBuyerInfoByOrderId(orderId);
            if (buyer == null || buyer.email() == null || buyer.email().isBlank()) {
                System.err.println("[PaymentRoute] Ne mogu da pošaljem mail o uspešnom plaćanju — nema email adrese za OrderID=" + orderId);
                return;
            }

            String greetingName = buyer.ime() != null && !buyer.ime().isBlank() ? " " + buyer.ime() : "";
            String subject = "Vaša kupovina je uspešna!";
            String subText = "Broj porudžbine: " + orderId;
            String body = "<p>Poštovani/a" + greetingName + ",</p>" +
                    "<p>Vaša uplata je uspešno evidentirana i porudžbina je obrađena. Kurs je sada aktivan na vašem nalogu.</p>" +
                    "<center><a href='" + mailService.getFrontendUrl() + "' class='btn'>PRIJAVI SE</a></center>";

            mailService.sendHtmlEmail(buyer.email(), subject, subText, body);
        } catch (Exception e) {
            System.err.println("[PaymentRoute] Greška pri slanju mejla o uspešnom plaćanju za OrderID=" + orderId + ": " + e.getMessage());
            e.printStackTrace();
        }
    }

    private void sendPaymentFailureEmail(String orderId) {
        try {
            PaymentService.BuyerInfo buyer = paymentService.getBuyerInfoByOrderId(orderId);
            if (buyer == null || buyer.email() == null || buyer.email().isBlank()) {
                System.err.println("[PaymentRoute] Ne mogu da pošaljem mail o neuspešnom plaćanju — nema email adrese za OrderID=" + orderId);
                return;
            }

            String subject = "Obaveštenje o neuspešnom plaćanju";
            String body = "<p>Zdravo,</p>" +
                    "<p>Primetili smo da ste nedavno pokušali da kupite jedan od naših kurseva putem sajta, " +
                    "ali da je plaćanje iz nekog razloga bilo onemogućeno.</p>" +
                    "<p>Molimo vas da nam javite da li ste imali poteškoća sa naše strane, kako bismo mogli da " +
                    "proverimo u čemu je problem i pomognemo vam da završite prijavu.</p>" +
                    "<p>Trenutno vršimo određena ažuriranja na sajtu, koji je i dalje aktivan, pa je moguće da " +
                    "povremeno dolazi do tehničkih poteškoća.</p>" +
                    "<p>Slobodno nam se javite — rado ćemo vam pomoći.</p>" +
                    "<p>Srdačan pozdrav,<br>Studio 27</p>";

            mailService.sendHtmlEmail(buyer.email(), subject, null, body);
        } catch (Exception e) {
            System.err.println("[PaymentRoute] Greška pri slanju mejla o neuspešnom plaćanju za OrderID=" + orderId + ": " + e.getMessage());
            e.printStackTrace();
        }
    }

    private String getParamCaseInsensitive(Map<String, String> params, String key) {
        if (params == null) return "";
        for (Map.Entry<String, String> entry : params.entrySet()) {
            if (entry.getKey().equalsIgnoreCase(key)) {
                return entry.getValue();
            }
        }
        return "";
    }
}
