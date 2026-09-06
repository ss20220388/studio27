package com.server.studio27.services;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.Signature;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class PaymentService {

    // RSD (currency 941) and EUR (978) both use a 2-decimal minor unit
    // (para / cent). TotalAmount MUST be sent as an integer in that minor
    // unit, per the gateway's "N1..12" numeric-only format — no decimal
    // point is allowed on the wire.
    //
    // FIX: this MUST be 100, not 1. With 1, a 451.99 RSD order was being
    // sent (and signed) as "452" instead of "45199" — a completely
    // different number than what the bank's own math expects, which on
    // its own is enough to make the signature invalid.
    private static final int MINOR_UNIT_FACTOR = 100;

    private final String merchantId;
    private final String terminalId;
    private final String currencyId;
    private final String privateKeyPath;
    private final String bankPublicKeyPath;
    private final String gatewayUrl;
    private final String locale;

    private final ResourceLoader resourceLoader;
    private final NamedParameterJdbcTemplate jdbcTemplate;

    public PaymentService(
            @Value("${payment.merchant-id}") String merchantId,
            @Value("${payment.terminal-id}") String terminalId,
            @Value("${payment.currency-id}") String currencyId,
            @Value("${payment.private-key}") String privateKeyPath,
            @Value("${payment.bank-public-key}") String bankPublicKeyPath,
            @Value("${payment.gateway-url}") String gatewayUrl,
            @Value("${payment.locale:rs}") String locale,
            ResourceLoader resourceLoader,
            NamedParameterJdbcTemplate jdbcTemplate
    ) {
        this.merchantId = merchantId;
        this.terminalId = terminalId;
        this.currencyId = currencyId;
        this.privateKeyPath = privateKeyPath;
        this.bankPublicKeyPath = bankPublicKeyPath;
        this.gatewayUrl = gatewayUrl;
        // Docs show lowercase examples (en, rs, bg) — keep it lowercase to
        // match the spec exactly, including the fallback default.
        this.locale = locale == null ? "rs" : locale.toLowerCase(Locale.ROOT);
        this.resourceLoader = resourceLoader;
        this.jdbcTemplate = jdbcTemplate;
    }

    public String createPaymentForm(
        String orderId,
        List<Long> courseIds,
        BigDecimal totalAmount
) throws Exception {

    if (orderId == null || orderId.isBlank()) {
        throw new IllegalArgumentException("OrderID je obavezan.");
    }
    if (courseIds == null || courseIds.isEmpty()) {
        throw new IllegalArgumentException("Korpa je prazna.");
    }
    if (totalAmount == null || totalAmount.compareTo(BigDecimal.ZERO) <= 0) {
        throw new IllegalArgumentException("Iznos mora biti pozitivan i veći od nule.");
    }

    String displayAmount = totalAmount.setScale(2, RoundingMode.HALF_UP).toPlainString();
    String wireAmount = toMinorUnits(totalAmount);
    String purchaseTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyMMddHHmmss"));
    String delay = "0";

    // FIX: no XID passed here anymore, and Delay is now included in the
    // signed string — see generateSignature() below.
    String signature = generateSignature(purchaseTime, orderId, delay, currencyId, wireAmount);

    saveOrder(orderId, courseIds, totalAmount);

    StringBuilder html = new StringBuilder();
    html.append("<!DOCTYPE html><html><head>")
        .append("<meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\">")
        .append("<title>Pregled Payment Gateway Zahteva</title>")
        .append("<style>")
        .append("body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 40px 20px; } ")
        .append(".container { max-width: 700px; margin: 0 auto; background: #1e293b; padding: 30px; border-radius: 12px; border: 1px solid #334155; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3); } ")
        .append("h2 { color: #38bdf8; margin-top: 0; font-size: 22px; border-bottom: 1px solid #334155; padding-bottom: 12px; } ")
        .append("p { color: #94a3b8; font-size: 14px; } ")
        .append("table { width: 100%; border-collapse: collapse; margin: 20px 0; font-family: monospace; font-size: 13px; } ")
        .append("th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid #334155; } ")
        .append("th { color: #cbd5e1; background: #0f172a; } ")
        .append("td { color: #f1f5f9; } ")
        .append(".param-name { color: #f43f5e; font-weight: bold; } ")
        .append(".param-val { word-break: break-all; } ")
        .append(".btn-container { margin-top: 25px; text-align: right; } ")
        .append("button { background: #ea580c; color: white; border: none; padding: 12px 24px; font-weight: bold; cursor: pointer; border-radius: 6px; font-size: 15px; transition: background 0.2s; } ")
        .append("button:hover { background: #c2410c; } ")
        .append("</style></head><body>")
        .append("<div class=\"container\">")
        .append("<h2>Pregled podataka za Payment Gateway</h2>")
        .append("<p>Zahtev je spreman (").append(displayAmount).append(" RSD). Ispod su svi parametri i potpis kreirani pre slanja na <code>").append(gatewayUrl).append("</code>.</p>")
        .append("<table><thead><tr><th>Polje (Field)</th><th>Vrednost (Value)</th></tr></thead><tbody>")
        .append("<tr><td class=\"param-name\">Version</td><td class=\"param-val\">1</td></tr>")
        .append("<tr><td class=\"param-name\">MerchantID</td><td class=\"param-val\">").append(merchantId).append("</td></tr>")
        .append("<tr><td class=\"param-name\">TerminalID</td><td class=\"param-val\">").append(terminalId).append("</td></tr>")
        .append("<tr><td class=\"param-name\">TotalAmount</td><td class=\"param-val\">").append(wireAmount).append("</td></tr>")
        .append("<tr><td class=\"param-name\">Currency</td><td class=\"param-val\">").append(currencyId).append("</td></tr>")
        .append("<tr><td class=\"param-name\">locale</td><td class=\"param-val\">").append(locale).append("</td></tr>")
        .append("<tr><td class=\"param-name\">PurchaseTime</td><td class=\"param-val\">").append(purchaseTime).append("</td></tr>")
        .append("<tr><td class=\"param-name\">OrderID</td><td class=\"param-val\">").append(orderId).append("</td></tr>")
        .append("<tr><td class=\"param-name\">Delay</td><td class=\"param-val\">").append(delay).append("</td></tr>")
        .append("<tr><td class=\"param-name\">Signature</td><td class=\"param-val\">").append(signature).append("</td></tr>")
        .append("</tbody></table>")
        .append("<form action=\"").append(gatewayUrl).append("\" method=\"POST\">")
        .append("<input name=\"Version\" type=\"hidden\" value=\"1\" />")
        .append("<input name=\"MerchantID\" type=\"hidden\" value=\"").append(merchantId).append("\" />")
        .append("<input name=\"TerminalID\" type=\"hidden\" value=\"").append(terminalId).append("\" />")
        .append("<input name=\"TotalAmount\" type=\"hidden\" value=\"").append(wireAmount).append("\" />")
        .append("<input name=\"Currency\" type=\"hidden\" value=\"").append(currencyId).append("\" />")
        .append("<input name=\"locale\" type=\"hidden\" value=\"").append(locale).append("\" />")
        .append("<input name=\"PurchaseTime\" type=\"hidden\" value=\"").append(purchaseTime).append("\" />")
        .append("<input name=\"OrderID\" type=\"hidden\" value=\"").append(orderId).append("\" />")
        .append("<input name=\"Delay\" type=\"hidden\" value=\"").append(delay).append("\" />")
        .append("<input name=\"Signature\" type=\"hidden\" value=\"").append(signature).append("\" />")
        .append("<div class=\"btn-container\">")
        .append("<button type=\"submit\">Potvrdi i pređi na plaćanje &rarr;</button>")
        .append("</div></form></div></body></html>");

    return html.toString();
}

    /**
     * Converts a decimal major-unit amount (e.g. 451.99 RSD) into the
     * integer minor-unit string the gateway expects (e.g. "45199").
     */
    private String toMinorUnits(BigDecimal amount) {
        BigDecimal minorUnits = amount
                .multiply(BigDecimal.valueOf(MINOR_UNIT_FACTOR))
                .setScale(0, RoundingMode.HALF_UP);
        return minorUnits.toPlainString();
    }

    private void saveOrder(String orderId, List<Long> courseIds, BigDecimal totalAmount) {
        try {
            String sql = "INSERT INTO orders (order_id, amount, status, created_at) VALUES (:orderId, :amount, 'PENDING', NOW())";
            MapSqlParameterSource params = new MapSqlParameterSource()
                    .addValue("orderId", orderId)
                    .addValue("amount", totalAmount);
            jdbcTemplate.update(sql, params);
        } catch (Exception e) {
            System.err.println("Greška prilikom upisa narudžbine u bazu: " + e.getMessage());
        }
    }

    /**
     * Builds and signs the outbound authorization-request MAC.
     *
     * Per the official docs ("Data Signature - API"):
     *   MerchantId;TerminalId;PurchaseTime;OrderId,Delay;CurrencyId,AltCurrencyId;Amount,AltAmount;SessionData(SD);
     * Optional sub-fields (Delay, AltCurrencyId, AltAmount) are only comma-
     * appended to their group WHEN THEY ARE ACTUALLY SENT in the form. We
     * do send a "Delay" field (value "0") in the form, so it MUST be
     * comma-joined with OrderID here: "OrderID,Delay". This exactly
     * matches the bank's own SHA512 reference example, which also always
     * sends Delay=0 and includes it the same way.
     *
     * We don't send AltCurrency/AltAmount, so Currency and Amount stay
     * plain (no comma). SD is unused, so it's an empty field before the
     * final semicolon.
     *
     * FIX HISTORY on this method:
     *  1) Removed XID — it doesn't exist yet when we build this outbound
     *     request (the bank assigns it during the transaction and only
     *     sends it back in their response — see verifySignature() below,
     *     a different message with a different field list).
     *  2) Added Delay into the OrderID group — it was being sent in the
     *     form but left out of the signed string, so form and signature
     *     were inconsistent. This was the remaining cause of "Potpis nije
     *     važeći" (code 405) after the XID and minor-unit fixes.
     *
     * Algorithm is SHA256withRSA per the bank's explicit instruction.
     */
    public String generateSignature(
            String purchaseTime,
            String orderId,
            String delay,
            String currencyIdParam,
            String totalAmountMinorUnits
    ) throws Exception {

        String sd = "";    // unused optional session-data field

        String data = merchantId + ";" +
                terminalId + ";" +
                purchaseTime + ";" +
                orderId + "," + delay + ";" +
                currencyIdParam + ";" +
                totalAmountMinorUnits + ";" +
                sd + ";";

        PrivateKey privateKey = loadPrivateKey();

        Signature signature = Signature.getInstance("SHA256withRSA");
        signature.initSign(privateKey);
        signature.update(data.getBytes(StandardCharsets.UTF_8));

        return Base64.getEncoder().encodeToString(signature.sign());
    }

    // Verifikacija niza identično kao iz PHP primera banke (NOTIFY_URL / success / failure).
    // Ovo je već ispravno — format polja ovde se poklapa sa dokumentacijom.
    // Ovo je format ODGOVORA banke (drugačiji od onoga što MI potpisujemo iznad) —
    // namerno se razlikuju, to nije greška, ne diraj ovo.
    public boolean verifySignature(Map<String, String> params) {
        try {
            String merchantIdVal = params.getOrDefault("MerchantID", "");
            String terminalIdVal = params.getOrDefault("TerminalID", "");
            String purchaseTime = params.getOrDefault("PurchaseTime", "");
            String orderId = params.getOrDefault("OrderID", "");
            String xid = params.getOrDefault("XID", "");
            String currency = params.getOrDefault("Currency", "");
            String totalAmount = params.getOrDefault("TotalAmount", "");
            String sd = params.getOrDefault("SD", "");
            String tranCode = params.getOrDefault("TranCode", "");
            String approvalCode = params.getOrDefault("ApprovalCode", "");
            String upcTokenExp = params.getOrDefault("UPCTokenExp", "");
            String upcToken = params.getOrDefault("UPCToken", "");
            String signatureBase64 = params.getOrDefault("Signature", "");

            if (signatureBase64.isBlank()) {
                return false;
            }

            String data = merchantIdVal + ";" +
                    terminalIdVal + ";" +
                    purchaseTime + ";" +
                    orderId + ";" +
                    xid + ";" +
                    currency + ";" +
                    totalAmount + ";" +
                    sd + ";" +
                    tranCode + ";" +
                    approvalCode + ";" +
                    upcTokenExp + ";" +
                    upcToken + ";";

            byte[] signatureBytes = Base64.getDecoder().decode(signatureBase64);
            PublicKey publicKey = loadBankPublicKey();

            return verifyWithAlgorithm(data, signatureBytes, publicKey, "SHA256withRSA");

        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    private boolean verifyWithAlgorithm(String data, byte[] signatureBytes, PublicKey publicKey, String algorithm) throws Exception {
        Signature signature = Signature.getInstance(algorithm);
        signature.initVerify(publicKey);
        signature.update(data.getBytes(StandardCharsets.UTF_8));
        return signature.verify(signatureBytes);
    }

    private PrivateKey loadPrivateKey() throws Exception {
        byte[] keyBytes = readResourceBytes(privateKeyPath);
        String keyString = new String(keyBytes, StandardCharsets.UTF_8);

        String cleanedKey = keyString
                .replace("-----BEGIN PRIVATE KEY-----", "")
                .replace("-----END PRIVATE KEY-----", "")
                .replace("-----BEGIN RSA PRIVATE KEY-----", "")
                .replace("-----END RSA PRIVATE KEY-----", "")
                .replaceAll("\\s+", "");

        byte[] decodedBytes = Base64.getDecoder().decode(cleanedKey);

        PKCS8EncodedKeySpec privSpec = new PKCS8EncodedKeySpec(decodedBytes);
        KeyFactory keyFactory = KeyFactory.getInstance("RSA");
        return keyFactory.generatePrivate(privSpec);
    }

    private PublicKey loadBankPublicKey() throws Exception {
        byte[] keyBytes = readResourceBytes(bankPublicKeyPath);
        String keyString = new String(keyBytes, StandardCharsets.UTF_8);

        if (keyString.contains("-----BEGIN CERTIFICATE-----")) {
            CertificateFactory fact = CertificateFactory.getInstance("X.509");
            X509Certificate cert = (X509Certificate) fact.generateCertificate(new ByteArrayInputStream(keyBytes));
            return cert.getPublicKey();
        }

        String cleanedKey = keyString
                .replace("-----BEGIN PUBLIC KEY-----", "")
                .replace("-----END PUBLIC KEY-----", "")
                .replace("-----BEGIN RSA PUBLIC KEY-----", "")
                .replace("-----END RSA PUBLIC KEY-----", "")
                .replaceAll("\\s+", "");

        byte[] decodedBytes = Base64.getDecoder().decode(cleanedKey);

        X509EncodedKeySpec pubSpec = new X509EncodedKeySpec(decodedBytes);
        KeyFactory keyFactory = KeyFactory.getInstance("RSA");
        return keyFactory.generatePublic(pubSpec);
    }

    private byte[] readResourceBytes(String path) throws Exception {
        Resource resource = resourceLoader.getResource(
                path.startsWith("classpath:") ? path : "file:" + path
        );
        try (InputStream in = resource.getInputStream()) {
            return in.readAllBytes();
        }
    }
}