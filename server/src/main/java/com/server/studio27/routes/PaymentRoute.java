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

import com.server.studio27.services.PaymentService;

@RestController
@RequestMapping("/api")
public class PaymentRoute {

    // Kodovi transakcije koje banka salje kad je transakcija STVARNO odobrena.
    // VAZNO: Raiffeisen salje "000" (TRI nule), ne "00" — potvrdjeno iz
    // stvarnog notify loga uspesne transakcije (uz ApprovalCode i Rrn, koje
    // banka salje samo za odobrene transakcije). Drzimo oba oblika radi
    // sigurnosti, jer neki gateway-i normalizuju kod na dve cifre.
    //
    // SVAKI drugi TranCode (npr. "404" = greska autentikacije/3-D Secure,
    // "503" = reversal/storno, ili bilo koji drugi decline kod) znaci da
    // transakcija NIJE prosla — cak i kada je poruka koju je banka poslala
    // ispravno potpisana, jer banka potpisuje i odbijene transakcije, ne
    // samo odobrene. Zato signatureValid SAM PO SEBI nikad ne sme da bude
    // jedini uslov za upis uplate — mora da se doda i provera TranCode-a.
    private static final Set<String> APPROVED_TRAN_CODES = Set.of("000", "00");

    private static boolean isApprovedTranCode(String tranCode) {
        return tranCode != null && APPROVED_TRAN_CODES.contains(tranCode.trim());
    }

    private final PaymentService paymentService;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    public PaymentRoute(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    public record PaymentCreateRequest(String orderId, Long studentId, List<Long> courseIds, BigDecimal totalAmount) {
    }

    // CORS ovde je namerno OSTAO — ovu rutu zove nas SOPSTVENI frontend
    // (fetch/XHR sa 27archviz.com), pa joj CORS provera treba i treba da
    // prolazi samo sa naseg domena.
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

        // KLJUCNO: signatureValid SAMO potvrdjuje da je poruku stvarno
        // poslala banka (nije falsifikovana) — ne govori nista o tome da
        // li je transakcija odobrena ili odbijena. Banka salje validno
        // potpisan notify i za odbijene transakcije (npr. neuspesan 3-D
        // Secure/autentikacija, TranCode="404"). Zato moramo eksplicitno
        // da proverimo i TranCode pre nego sto upisemo uplatu — u
        // suprotnom cak i propala transakcija upisuje studenta kao da je
        // platio.
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
            try {
                paymentService.recordSuccessfulPayment(orderId);
            } catch (Exception e) {
                System.err.println("[PaymentRoute] Upis u platio/pohadja nije uspeo za OrderID=" + orderId + ": " + e.getMessage());
                e.printStackTrace();
            }

            response.append("Response.action= approve \n");
            response.append("Response.reason= ok \n");
            response.append("Response.forwardUrl= \n");
            return ResponseEntity.ok(response.toString());
        } else {
            if (signatureValid) {
                // Potpis je validan (poruka je stvarno od banke), ali
                // transakcija nije odobrena (TranCode nije odobravajuci) —
                // ovo NIJE pokusaj falsifikovanja, samo normalna odbijena
                // uplata (npr. neuspesna autentikacija, nedovoljno
                // sredstava, itd).
                System.out.println("[PaymentRoute] Transakcija ODBIJENA (validan potpis, TranCode=" + tranCode + ") za OrderID=" + orderId + " — ne upisujem uplatu.");
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

        // Isti razlog kao u paymentNotify: potpis validan != transakcija
        // odobrena. Banka moze da dovede korisnika na SUCCESS_URL sa
        // ispravno potpisanom porukom koja ipak opisuje odbijenu
        // transakciju, pa moramo i to da proverimo pre nego sto upisemo
        // uplatu i prikazemo korisniku "uspesno placeno".
        boolean transactionApproved = signatureValid && isApprovedTranCode(tranCode);

        System.out.println("[PaymentRoute][DEBUG] /payment/success signatureValid=" + signatureValid
                + " TranCode=" + tranCode
                + " transactionApproved=" + transactionApproved
                + " za OrderID=" + orderId);

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

        try {
            paymentService.recordSuccessfulPayment(orderId);
        } catch (Exception e) {
            System.err.println("[PaymentRoute] Upis u platio/pohadja nije uspeo (preko /payment/success) za OrderID=" + orderId + ": " + e.getMessage());
            e.printStackTrace();
        }

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

    // Pomoćna metoda za sigurno dohvatanje ključeva nezavisno od malih/velikih slova
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
