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
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.Base64;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

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
        this.locale = locale == null ? "rs" : locale.toLowerCase(Locale.ROOT);
        this.resourceLoader = resourceLoader;
        this.jdbcTemplate = jdbcTemplate;
    }

    public String createPaymentForm(
            String orderId,
            Long studentId,
            List<Long> courseIds,
            BigDecimal totalAmount
    ) throws Exception {

        if (orderId == null || orderId.isBlank()) {
            throw new IllegalArgumentException("OrderID je obavezan.");
        }
        if (studentId == null) {
            throw new IllegalArgumentException("StudentID je obavezan.");
        }
        if (courseIds == null || courseIds.isEmpty()) {
            throw new IllegalArgumentException("Korpa je prazna.");
        }
        if (totalAmount == null || totalAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Iznos mora biti pozitivan i veći od nule.");
        }

        String wireAmount = toMinorUnits(totalAmount);
        String purchaseTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyMMddHHmmss"));
        String delay = "0";

        String signature = generateSignature(purchaseTime, orderId, delay, currencyId, wireAmount);

        // Ne upisujemo jos u uplatnica/pohadja ovde — placanje jos NIJE
        // potvrdjeno (korisnik tek ide na formu banke). Cuvamo samo
        // studentId + listu kurseva vezanih za ovaj orderId, da bismo
        // znali sta da upisemo kada banka potvrdi uspesno placanje
        // (u paymentNotify -> recordSuccessfulPayment()).
        savePendingOrder(orderId, studentId, courseIds);

        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html><html><head>")
            .append("<meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\">")
            .append("</head><body>")
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
            .append("<input type=\"submit\" style=\"display:none\" />")
            .append("</form></body></html>");

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

    /**
     * Stores what we'll need once the bank confirms payment: WHO paid
     * (studentId) and WHAT they paid for (courseIds), keyed by orderId.
     * We can't write to uplatnica/pohadja yet — the customer hasn't
     * actually paid at this point, they're only about to be sent to the
     * bank's form.
     *
     * REQUIRES this table (create it once, adjust types if your IDs
     * aren't BIGINT):
     *
     *   CREATE TABLE pending_orders (
     *     order_id   VARCHAR(64) PRIMARY KEY,
     *     student_id BIGINT NOT NULL,
     *     course_ids VARCHAR(255) NOT NULL,   -- e.g. "3,7,12"
     *     created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
     *     processed  TINYINT(1) NOT NULL DEFAULT 0
     *   );
     */
    private void savePendingOrder(String orderId, Long studentId, List<Long> courseIds) {
        String courseIdsCsv = courseIds.stream()
                .map(String::valueOf)
                .collect(Collectors.joining(","));

        String sql = "INSERT INTO pending_orders (order_id, student_id, course_ids) " +
                "VALUES (:orderId, :studentId, :courseIds)";
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("orderId", orderId)
                .addValue("studentId", studentId)
                .addValue("courseIds", courseIdsCsv);
        jdbcTemplate.update(sql, params);
    }

    /**
     * Called once we've verified the bank's signature says payment
     * succeeded (from PaymentRoute.paymentNotify). For each course in the
     * order:
     *   1. looks up its price (kursevi.cena by id) — ADJUST table/column
     *      name below if yours are named differently
     *   2. inserts a row into uplatnica
     *   3. inserts a row into pohadja
     *
     * Idempotent: if this orderId was already processed (bank retries the
     * NOTIFY call, or /payment/success fires too), it's a no-op — so it's
     * safe to call this from paymentNotify without double-charging/
     * double-enrolling a student.
     */
    public void recordSuccessfulPayment(String orderId) {
        Map<String, Object> pending;
        try {
            pending = jdbcTemplate.queryForMap(
                    "SELECT student_id, course_ids, processed FROM pending_orders WHERE order_id = :orderId",
                    new MapSqlParameterSource("orderId", orderId)
            );
        } catch (Exception e) {
            System.err.println("[PaymentService] Nema pending_orders zapisa za orderId=" + orderId + " — preskačem upis.");
            return;
        }

        boolean alreadyProcessed = ((Number) pending.get("processed")).intValue() == 1;
        if (alreadyProcessed) {
            System.out.println("[PaymentService] orderId=" + orderId + " je već obrađen, preskačem duplikat.");
            return;
        }

        Long studentId = ((Number) pending.get("student_id")).longValue();
        String courseIdsCsv = (String) pending.get("course_ids");
        List<Long> courseIds = Arrays.stream(courseIdsCsv.split(","))
                .map(Long::parseLong)
                .collect(Collectors.toList());

        LocalDate today = LocalDate.now();

        for (Long kursId : courseIds) {
            BigDecimal cena = jdbcTemplate.queryForObject(
                    "SELECT cena FROM kursevi WHERE id = :kursId",
                    new MapSqlParameterSource("kursId", kursId),
                    BigDecimal.class
            );

            jdbcTemplate.update(
                    "INSERT INTO uplatnica (kursId, studentId, datumPlacanja, cenaPlacanja, tip, status, url) " +
                            "VALUES (:kursId, :studentId, :datum, :cena, 'KARTICA', NULL, NULL)",
                    new MapSqlParameterSource()
                            .addValue("kursId", kursId)
                            .addValue("studentId", studentId)
                            .addValue("datum", today)
                            .addValue("cena", cena)
            );

            jdbcTemplate.update(
                    "INSERT INTO pohadja (studentId, kursId, daLiJeZavrsioKurs, vremePocetka) " +
                            "VALUES (:studentId, :kursId, NULL, NULL)",
                    new MapSqlParameterSource()
                            .addValue("studentId", studentId)
                            .addValue("kursId", kursId)
            );
        }

        jdbcTemplate.update(
                "UPDATE pending_orders SET processed = 1 WHERE order_id = :orderId",
                new MapSqlParameterSource("orderId", orderId)
        );
    }

    /**
     * Builds and signs the outbound authorization-request MAC.
     *
     * Per the official docs ("Data Signature - API"):
     *   MerchantId;TerminalId;PurchaseTime;OrderId,Delay;CurrencyId,AltCurrencyId;Amount,AltAmount;SessionData(SD);
     * Delay is sent in the form (value "0"), so it's comma-joined with
     * OrderID here: "OrderID,Delay". We don't send AltCurrency/AltAmount,
     * so Currency and Amount stay plain. SD is unused (empty field before
     * the final semicolon). Algorithm is SHA256withRSA per the bank's
     * explicit instruction.
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