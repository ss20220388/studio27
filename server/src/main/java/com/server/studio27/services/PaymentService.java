package com.server.studio27.services;

import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.Security;
import java.security.Signature;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.bouncycastle.asn1.pkcs.PrivateKeyInfo;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.bouncycastle.openssl.PEMKeyPair;
import org.bouncycastle.openssl.PEMParser;
import org.bouncycastle.openssl.jcajce.JcaPEMKeyConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class PaymentService {

    private static final BigDecimal EUR_RSD_RATE = new BigDecimal("117.4");

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
            @Value("${payment.locale:RS}") String locale,
            ResourceLoader resourceLoader,
            NamedParameterJdbcTemplate jdbcTemplate
    ) {
        this.merchantId = merchantId;
        this.terminalId = terminalId;
        this.currencyId = currencyId;
        this.privateKeyPath = privateKeyPath;
        this.bankPublicKeyPath = bankPublicKeyPath;
        this.gatewayUrl = gatewayUrl;
        this.locale = locale == null ? "RS" : locale.toUpperCase(Locale.ROOT);
        this.resourceLoader = resourceLoader;
        this.jdbcTemplate = jdbcTemplate;

        if (Security.getProvider("BC") == null) {
            Security.addProvider(new BouncyCastleProvider());
        }
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
        if (totalAmount == null) {
            throw new IllegalArgumentException("Iznos je obavezan.");
        }
        if (totalAmount.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Iznos ne može biti negativan.");
        }
        String cleanRsd = totalAmount.setScale(2, RoundingMode.HALF_UP).toPlainString();

        String purchaseTime = LocalDateTime.now()
                .format(DateTimeFormatter.ofPattern("yyMMddHHmmss"));

        String signature = generateSignature(purchaseTime, orderId, cleanRsd);

        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
                    <title>Redirecting to Payment Gateway...</title>
                </head>
                <body>

                <form id="paymentForm" action="%s" method="POST">
                    <input name="Version" type="hidden" value="1" />
                    <input name="MerchantID" type="hidden" value="%s" />
                    <input name="TerminalID" type="hidden" value="%s" />
                    <input name="TotalAmount" type="hidden" value="%s" />
                    <input name="Currency" type="hidden" value="%s" />
                    <input name="locale" type="hidden" value="%s" />
                    <input name="PurchaseTime" type="hidden" value="%s" />
                    <input name="OrderID" type="hidden" value="%s" />
                    <input name="Signature" type="hidden" value="%s" />
                </form>

                <script>
                    document.getElementById("paymentForm").submit();
                </script>

                </body>
                </html>
                """.formatted(
                        gatewayUrl,
                        merchantId,
                        terminalId,
                        cleanRsd,
                        currencyId,
                        locale,
                        purchaseTime,
                        orderId,
                        signature
                );
    }

  
    public String generateSignature(
            String purchaseTime,
            String orderId,
            String totalAmountRsd
    ) throws Exception {

        String data = merchantId + ";" +
                terminalId + ";" +
                purchaseTime + ";" +
                orderId + ";" +
                currencyId + ";" +
                totalAmountRsd + ";;";

        PrivateKey privateKey = loadPrivateKey();

        Signature signature = Signature.getInstance("SHA256withRSA", "BC");
        signature.initSign(privateKey);
        signature.update(data.getBytes(StandardCharsets.UTF_8));

        return Base64.getEncoder().encodeToString(signature.sign());
    }

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
            PublicKey publicKey = loadBankPublicCertificate();

            boolean valid = verifyWithAlgorithm(data, signatureBytes, publicKey, "SHA256withRSA");

            if (!valid) {
                valid = verifyWithAlgorithm(data, signatureBytes, publicKey, "SHA512withRSA");
            }

            return valid;

        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    private boolean verifyWithAlgorithm(String data, byte[] signatureBytes, PublicKey publicKey, String algorithm) throws Exception {
        Signature signature = Signature.getInstance(algorithm, "BC");
        signature.initVerify(publicKey);
        signature.update(data.getBytes(StandardCharsets.UTF_8));
        return signature.verify(signatureBytes);
    }

    private PrivateKey loadPrivateKey() throws Exception {
        Resource resource = resourceLoader.getResource(
                privateKeyPath.startsWith("classpath:")
                        ? privateKeyPath
                        : "file:" + privateKeyPath
        );

        try (
                Reader reader = new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8);
                PEMParser pemParser = new PEMParser(reader)
        ) {
            Object object = pemParser.readObject();
            JcaPEMKeyConverter converter = new JcaPEMKeyConverter().setProvider("BC");

            if (object instanceof PEMKeyPair keyPair) {
                return converter.getKeyPair(keyPair).getPrivate();
            } else if (object instanceof PrivateKeyInfo privateKeyInfo) {
                return converter.getPrivateKey(privateKeyInfo);
            }

            throw new IllegalStateException("Nepodržan format privatnog ključa.");
        }
    }

    private PublicKey loadBankPublicCertificate() throws Exception {
        Resource resource = resourceLoader.getResource(
                bankPublicKeyPath.startsWith("classpath:")
                        ? bankPublicKeyPath
                        : "file:" + bankPublicKeyPath
        );

        try (InputStream in = resource.getInputStream()) {
            CertificateFactory certificateFactory = CertificateFactory.getInstance("X.509");
            X509Certificate certificate = (X509Certificate) certificateFactory.generateCertificate(in);
            return certificate.getPublicKey();
        }
    }
}