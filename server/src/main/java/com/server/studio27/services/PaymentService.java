package com.server.studio27.services;

import org.bouncycastle.cert.X509CertificateHolder;
import org.bouncycastle.cert.jcajce.JcaX509CertificateConverter;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.bouncycastle.openssl.PEMKeyPair;
import org.bouncycastle.openssl.PEMParser;
import org.bouncycastle.openssl.jcajce.JcaPEMKeyConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;

import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.Security;
import java.security.Signature;
import java.security.cert.X509Certificate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.Map;

@Service
public class PaymentService {

    private final String merchantId;
    private final String terminalId;
    private final String currencyId;
    private final String privateKeyPath;
    private final String bankPublicKeyPath;
    private final String gatewayUrl;
    private final String locale;

    private final ResourceLoader resourceLoader;

    public PaymentService(
            @Value("${payment.merchant-id}") String merchantId,
            @Value("${payment.terminal-id}") String terminalId,
            @Value("${payment.currency-id:941}") String currencyId,
            @Value("${payment.private-key}") String privateKeyPath,
            @Value("${payment.bank-public-key:classpath:test-server.crt}") String bankPublicKeyPath,
            @Value("${payment.gateway-url:https://ecg.test.upc.ua/rbrs/pay}") String gatewayUrl,
            @Value("${payment.locale:RS}") String locale,
            ResourceLoader resourceLoader
    ) {
        this.merchantId = merchantId;
        this.terminalId = terminalId;
        this.currencyId = currencyId;
        this.privateKeyPath = privateKeyPath;
        this.bankPublicKeyPath = bankPublicKeyPath;
        this.gatewayUrl = gatewayUrl;
        this.locale = locale;
        this.resourceLoader = resourceLoader;

        if (Security.getProvider("BC") == null) {
            Security.addProvider(new BouncyCastleProvider());
        }
    }

    public String createPaymentForm(
            String orderId,
            String totalAmountRsd
    ) throws Exception {

        if (orderId == null || orderId.isBlank()) {
            throw new IllegalArgumentException("OrderID je obavezan.");
        }

        if (orderId.length() > 20) {
            throw new IllegalArgumentException("OrderID ne sme biti duži od 20 karaktera.");
        }

        // Čišćenje iznosa od eventualnih tačaka/zareza (šalje se u parama)
        String cleanRsd = totalAmountRsd.replace(".", "").replace(",", "");

        // Format vremena: yymmddHis (npr. 260830231500)
        String purchaseTime = LocalDateTime.now()
                .format(DateTimeFormatter.ofPattern("yyMMddHHmmss"));

        String delay = "1"; // Po ugradnom uputstvu, Delay je 1

        String signature = generateSignature(
                purchaseTime,
                orderId,
                cleanRsd,
                delay
        );

        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Buy</title>
                </head>
                <body>

                <form id="paymentForm" action="%s" method="post">
                    <input type="hidden" name="Version" value="1">
                    <input type="hidden" name="MerchantID" value="%s">
                    <input type="hidden" name="TerminalID" value="%s">
                    <input type="hidden" name="TotalAmount" value="%s">
                    <input type="hidden" name="Currency" value="%s">
                    <input type="hidden" name="locale" value="%s">
                    <input type="hidden" name="PurchaseTime" value="%s">
                    <input type="hidden" name="OrderID" value="%s">
                    <input type="hidden" name="Delay" value="%s">
                    <input type="hidden" name="Signature" value="%s">
                </form>

                <script>
                    document.getElementById("paymentForm").submit();
                </script>

                </body>
                </html>
                """
                .formatted(
                        gatewayUrl,
                        merchantId,
                        terminalId,
                        cleanRsd,
                        currencyId,
                        locale,
                        purchaseTime,
                        orderId,
                        delay,
                        signature
                );
    }

    /**
     * Potpisivanje na osnovu tačkog formata iz priloga:
     * MerchantId;TerminalId;PurchaseTime;OrderId,Delay;CurrencyId;TotalAmount;;
     */
    public String generateSignature(
            String purchaseTime,
            String orderId,
            String totalAmountRsd,
            String delay
    ) throws Exception {

        String data = merchantId + ";" +
                terminalId + ";" +
                purchaseTime + ";" +
                orderId + "," + delay + ";" +
                currencyId + ";" +
                totalAmountRsd + ";;";

        PrivateKey privateKey = loadPrivateKey();

        Signature signature = Signature.getInstance("SHA256withRSA", "BC");
        signature.initSign(privateKey);
        signature.update(data.getBytes(StandardCharsets.UTF_8));

        return Base64.getEncoder().encodeToString(signature.sign());
    }

    /**
     * Verifikacija notifikacije koju šalje banka (notify.php ekvivalent)
     */
    public boolean processNotification(Map<String, String> params) {
        String merchant = value(params.get("MerchantID"));
        String terminal = value(params.get("TerminalID"));
        String purchaseTime = value(params.get("PurchaseTime"));
        String orderID = value(params.get("OrderID"));
        String xid = value(params.get("XID"));
        String currency = value(params.get("Currency"));
        String amount = value(params.get("TotalAmount"));
        String sd = value(params.get("SD"));
        String tranCode = value(params.get("TranCode"));
        String approvalCode = value(params.get("ApprovalCode"));
        String signatureBase64 = params.get("Signature");

        String rawData = merchant + ";" +
                terminal + ";" +
                purchaseTime + ";" +
                orderID + ";" +
                xid + ";" +
                currency + ";" +
                amount + ";" +
                sd + ";" +
                tranCode + ";" +
                approvalCode + ";";

        boolean valid = verifySignature(rawData, signatureBase64);

        if (!valid) {
            System.err.println("Neuspešna verifikacija potpisa za OrderID: " + orderID);
            return false;
        }

        return "000".equals(tranCode);
    }

    public boolean verifySignature(String rawData, String signatureBase64) {
        if (signatureBase64 == null || signatureBase64.isBlank()) {
            return false;
        }

        try {
            PublicKey bankPublicKey = loadBankPublicKey();

            Signature signature = Signature.getInstance("SHA256withRSA", "BC");
            signature.initVerify(bankPublicKey);
            signature.update(rawData.getBytes(StandardCharsets.UTF_8));

            byte[] signatureBytes = Base64.getDecoder().decode(signatureBase64);
            return signature.verify(signatureBytes);

        } catch (Exception e) {
            System.err.println("Greška prilikom verifikacije potpisa banke: " + e.getMessage());
            return false;
        }
    }

    public String buildNotifyResponseBody(Map<String, String> params, boolean isApproved) {
        String action = isApproved ? "approve" : "reverse";
        return "MerchantID=" + value(params.get("MerchantID")) + "\n" +
               "TerminalID=" + value(params.get("TerminalID")) + "\n" +
               "OrderID=" + value(params.get("OrderID")) + "\n" +
               "Currency=" + value(params.get("Currency")) + "\n" +
               "TotalAmount=" + value(params.get("TotalAmount")) + "\n" +
               "XID=" + value(params.get("XID")) + "\n" +
               "PurchaseTime=" + value(params.get("PurchaseTime")) + "\n" +
               "Response.action=" + action + "\n" +
               "Response.reason=\n" +
               "Response.forwardUrl=\n";
    }

    private String value(String value) {
        return value == null ? "" : value;
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
            }

            if (object instanceof org.bouncycastle.asn1.pkcs.PrivateKeyInfo privateKeyInfo) {
                return converter.getPrivateKey(privateKeyInfo);
            }

            throw new IllegalStateException("Nepoznat format privatnog ključa.");
        }
    }

    private PublicKey loadBankPublicKey() throws Exception {
        Resource resource = resourceLoader.getResource(
                bankPublicKeyPath.startsWith("classpath:")
                        ? bankPublicKeyPath
                        : "file:" + bankPublicKeyPath
        );

        try (
                Reader reader = new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8);
                PEMParser pemParser = new PEMParser(reader)
        ) {
            Object object = pemParser.readObject();

            if (object instanceof X509CertificateHolder certHolder) {
                X509Certificate cert = new JcaX509CertificateConverter()
                        .setProvider("BC")
                        .getCertificate(certHolder);
                return cert.getPublicKey();
            }

            if (object instanceof org.bouncycastle.asn1.x509.SubjectPublicKeyInfo publicKeyInfo) {
                return new JcaPEMKeyConverter()
                        .setProvider("BC")
                        .getPublicKey(publicKeyInfo);
            }

            throw new IllegalStateException("Nepoznat format javnog ključa banke.");
        }
    }
}