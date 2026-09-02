package com.server.studio27.services;

import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
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
import org.springframework.stereotype.Service;

@Service
public class PaymentService {

    // Postavi na true SAMO dok debug-uješ potpis, pa vrati na false pre produkcije
    // (ispisuje tačan string koji se potpisuje/verifikuje u konzolu).
    private static final boolean DEBUG_LOG_SIGNATURE_STRING = true;

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
            @Value("${payment.currency-id}") String currencyId,
            @Value("${payment.private-key}") String privateKeyPath,
            @Value("${payment.bank-public-key}") String bankPublicKeyPath,
            @Value("${payment.gateway-url}") String gatewayUrl,
            @Value("${payment.locale}") String locale,
            ResourceLoader resourceLoader
    ) {
        this.merchantId = merchantId;
        this.terminalId = terminalId;
        this.currencyId = currencyId;
        this.privateKeyPath = privateKeyPath;
        this.bankPublicKeyPath = bankPublicKeyPath;
        this.gatewayUrl = gatewayUrl;
        // Gateway po pravilu očekuje ISO kod velikim slovima (npr. "RS"), iako je
        // u properties fajlu upisano malim slovima ("rs").
        this.locale = locale == null ? "" : locale.toUpperCase(Locale.ROOT);
        this.resourceLoader = resourceLoader;

        if (Security.getProvider("BC") == null) {
            Security.addProvider(new BouncyCastleProvider());
        }
    }

    // =========================================================================
    // 1) INICIJALIZACIJA PLAĆANJA — kreiranje forme koja se šalje ka banci
    // =========================================================================

    /**
     * Kreira HTML formu koja se auto-submituje ka platnom gateway-u.
     *
     * NAPOMENA o SD polju: iz PHP primera za verifikaciju koji je poslala banka
     * ($post['SD']) potvrđeno je da se polje zove tačno "SD". Ovde ga i dalje
     * ostavljamo prazno po difoltu (nije obavezno), ali ako kasnije budeš želeo
     * da pošalješ npr. opis narudžbine, koristi ime polja "SD" — NE "PurchaseDesc"
     * (to ime ne postoji nigde u dokumentaciji banke).
     */
    public String createPaymentForm(
            String orderId,
            String totalAmountRsd
    ) throws Exception {

        if (orderId == null || orderId.isBlank()) {
            throw new IllegalArgumentException("OrderID je obavezan.");
        }

        // Iznos u parama (npr. 100.00 RSD -> 10000)
        String cleanRsd = toCents(totalAmountRsd);

        // Format vremena: yyMMddHHmmss (npr. 240820143000)
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

    /**
     * Sastavljanje stringa za potpis (Inicijalizacija plaćanja - Request).
     * Redosled polja po UPC specifikaciji:
     * MerchantID;TerminalID;PurchaseTime;OrderID;Currency;TotalAmount;SD;
     */
    public String generateSignature(
            String purchaseTime,
            String orderId,
            String totalAmountRsd
    ) throws Exception {

        String sd = ""; // namerno prazno — videti napomenu u createPaymentForm

        String data = merchantId + ";" +
                terminalId + ";" +
                purchaseTime + ";" +
                orderId + ";" +
                currencyId + ";" +
                totalAmountRsd + ";" +
                sd + ";";

        if (DEBUG_LOG_SIGNATURE_STRING) {
            System.out.println("[PaymentService] REQUEST signature data string: [" + data + "]");
        }

        PrivateKey privateKey = loadPrivateKey();

        Signature signature = Signature.getInstance("SHA256withRSA", "BC");
        signature.initSign(privateKey);
        signature.update(data.getBytes(StandardCharsets.UTF_8));

        return Base64.getEncoder().encodeToString(signature.sign());
    }

    // =========================================================================
    // 2) VERIFIKACIJA POVRATNOG POZIVA — kad banka pozove success/failure URL
    // =========================================================================

    /**
     * Verifikuje potpis koji banka šalje nazad na success/failure endpoint.
     * String za verifikaciju je preuzet DIREKTNO iz PHP primera koji je banka
     * poslala (druga, konačna $data linija u njihovom kodu):
     *
     * MerchantID;TerminalID;PurchaseTime;OrderID;XID;CurrencyID;TotalAmount;SD;TranCode;ApprovalCode;UPCTokenExp;UPCToken;
     *
     * Polja UPCTokenExp i UPCToken se koriste samo kod plaćanja tokenizovanom
     * karticom — kod običnih transakcija će verovatno biti prazna, što je u
     * redu jer format i dalje predviđa da prazno polje ostavi samo ";".
     *
     * Vraća true/false — NE baca izuzetak napolje (loguje grešku interno),
     * da poziv iz kontrolera uvek dobije jasan boolean odgovor.
     */
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
                System.out.println("[PaymentService] Verifikacija neuspešna: nema Signature parametra.");
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

            if (DEBUG_LOG_SIGNATURE_STRING) {
                System.out.println("[PaymentService] VERIFY signature data string: [" + data + "]");
            }

            byte[] signatureBytes = Base64.getDecoder().decode(signatureBase64);
            PublicKey publicKey = loadBankPublicCertificate();

            boolean valid = verifyWithAlgorithm(data, signatureBytes, publicKey, "SHA256withRSA");

            if (!valid) {
                // Originalni PHP primer u opštoj dokumentaciji koristi SHA-512 za potpisivanje.
                // Ako SHA-256 ne prođe, probaj SHA-512 kao fallback dok ne potvrdiš tačan
                // algoritam koji banka koristi za POTPISIVANJE SVOJIH povratnih poziva
                // (može biti drugačiji od algoritma kojim TI potpisuješ zahtev).
                valid = verifyWithAlgorithm(data, signatureBytes, publicKey, "SHA512withRSA");
                if (valid) {
                    System.out.println("[PaymentService] Potpis je važeći samo sa SHA512withRSA — potvrdi ovo sa bankom i po potrebi zameni default u kodu.");
                }
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

    // =========================================================================
    // Pomoćne metode
    // =========================================================================

    private String toCents(String amountStr) {
        if (amountStr == null || amountStr.isBlank()) {
            throw new IllegalArgumentException("Iznos je obavezan.");
        }
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