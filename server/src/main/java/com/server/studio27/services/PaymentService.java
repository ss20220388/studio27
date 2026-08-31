package com.server.studio27.services;

import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.security.PrivateKey;
import java.security.Security;
import java.security.Signature;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;

import org.bouncycastle.asn1.pkcs.PrivateKeyInfo;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.bouncycastle.openssl.PEMKeyPair;
import org.bouncycastle.openssl.PEMParser;
import org.bouncycastle.openssl.jcajce.JcaPEMKeyConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;

@Service
public class PaymentService {

    private final String merchantId;
    private final String terminalId;
    private final String currencyId;
    private final String privateKeyPath;
    private final String gatewayUrl;
    private final String locale;

    private final ResourceLoader resourceLoader;

    public PaymentService(
            @Value("${payment.merchant-id:1731862}") String merchantId,
            @Value("${payment.terminal-id:E1731883}") String terminalId,
            @Value("${payment.currency-id:941}") String currencyId,
            @Value("${payment.private-key:classpath:1731862.pem}") String privateKeyPath,
            // ISPRAVLJEN URL NA ZVANIČNI TEST ENDPOINT IZ DOKUMENTACIJE:
            @Value("${payment.gateway-url:https://ecg.test.upc.ua/go/pay}") String gatewayUrl,
            @Value("${payment.locale:rs}") String locale, // Malim slovima po specifikaciji ("rs" ili "en")
            ResourceLoader resourceLoader
    ) {
        this.merchantId = merchantId;
        this.terminalId = terminalId;
        this.currencyId = currencyId;
        this.privateKeyPath = privateKeyPath;
        this.gatewayUrl = gatewayUrl;
        this.locale = locale.toLowerCase();
        this.resourceLoader = resourceLoader;

        if (Security.getProvider("BC") == null) {
            Security.addProvider(new BouncyCastleProvider());
        }
    }

    public String createPaymentForm(
            String orderId,
            String totalAmountRsd,
            String purchaseDesc
    ) throws Exception {

        if (orderId == null || orderId.isBlank()) {
            throw new IllegalArgumentException("OrderID je obavezan.");
        }

        // Iznos u para/centima (npr. 100 RSD -> 10000)
        String cleanRsd = toCents(totalAmountRsd);

        if (purchaseDesc == null || purchaseDesc.isBlank()) {
            purchaseDesc = "Order " + orderId;
        }

        // Format vremena po specifikaciji: yyMMddHHmmss (npr 260109150000)
        String purchaseTime = LocalDateTime.now()
                .format(DateTimeFormatter.ofPattern("yyMMddHHmmss"));

        // Generisanje potpisa
        String signature = generateSignature(
                purchaseTime,
                orderId,
                cleanRsd,
                purchaseDesc
        );

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
                    <input name="PurchaseDesc" type="hidden" value="%s" />
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
                        purchaseDesc,
                        signature
                );
    }

    /**
     * Potpis za PurchaseDesc:
     * MerchantID;TerminalID;PurchaseTime;OrderID;Currency;TotalAmount;PurchaseDesc;;
     */
    public String generateSignature(
            String purchaseTime,
            String orderId,
            String totalAmountRsd,
            String purchaseDesc
    ) throws Exception {

        String data = merchantId + ";" +
                terminalId + ";" +
                purchaseTime + ";" +
                orderId + ";" +
                currencyId + ";" +
                totalAmountRsd + ";" +
                purchaseDesc + ";;";

        PrivateKey privateKey = loadPrivateKey();

        Signature signature = Signature.getInstance("SHA256withRSA", "BC");
        signature.initSign(privateKey);
        signature.update(data.getBytes(StandardCharsets.UTF_8));

        return Base64.getEncoder().encodeToString(signature.sign());
    }

    private String toCents(String amountStr) {
        double parsed = Double.parseDouble(amountStr.replace(",", "."));
        long cents = Math.round(parsed * 100);
        return String.valueOf(cents);
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
}