package com.server.studio27.routes;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.mail.internet.MimeMessage;



@RestController
@RequestMapping("/api")
public class SendMail {

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    public static class MailRequest {
        public String to;
        public String subject;
        public String subText;
        public String body;
    }

    public static class MailListRequest {
        public List<String> toList;
        public String subject;
        public String subText;
        public String body;
    }

    public static class ReceiptRequest {
        public String to;
        public String name;
        public String itemName;
        public String amount;
        public String date;
    }

    private String buildHtmlEmail(String subject, String subText, String bodyContent) {
        String subjectHtml = "";
        if (subject != null && !subject.isEmpty()) {
            subjectHtml = "<h2>" + subject + "</h2>";
        }
        
        String subTextHtml = "";
        if (subText != null && !subText.trim().isEmpty()) {
            subTextHtml = "<p style='color: #a1a1aa; font-size: 14px; margin-top: -15px; margin-bottom: 20px;'>" + subText + "</p>";
        }
        
        return "<!DOCTYPE html>" +
                "<html><head><meta charset='UTF-8'>" +
                "<style>" +
                "body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #1a1a1a; margin: 0; padding: 20px; color: #e5e5e5; }" +
                ".container { max-width: 600px; margin: 40px auto; background: #262626; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); border: 1px solid #3f3f46; }" +
                ".header { background-color: #111111; padding: 30px; text-align: center; border-bottom: 2px solid #b91c1c; }" +
                ".header h1 { color: #f87171; margin: 0; font-size: 26px; letter-spacing: 4px; text-transform: uppercase; font-weight: 800; }" +
                ".content { padding: 40px 30px; color: #d4d4d8; line-height: 1.8; font-size: 16px; }" +
                "h2 { color: #ffffff; font-size: 20px; margin-top: 0; margin-bottom: 20px; border-bottom: 1px solid #3f3f46; padding-bottom: 10px; }" +
                ".footer { background-color: #111111; padding: 25px; text-align: center; font-size: 13px; color: #71717a; border-top: 1px solid #3f3f46; line-height: 1.6; }" +
                "a { color: #f87171; text-decoration: none; }" +
                "a:hover { text-decoration: underline; }" +
                ".invoice-box { background: #1f1f1f; padding: 25px; border-radius: 8px; margin: 25px 0; border: 1px solid #3f3f46; }" +
                ".invoice-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #333; }" +
                ".invoice-row:last-child { border-bottom: none; }" +
                ".invoice-total { font-size: 18px; font-weight: bold; color: #ffffff; padding-top: 15px; margin-top: 10px; border-top: 2px solid #52525b; }" +
                ".btn { display: inline-block; padding: 14px 30px; background-color: #b91c1c; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 25px; transition: background-color 0.2s; letter-spacing: 1px; }" +
                "</style></head><body>" +
                "<div class='container'>" +
                "<div class='header'><h1>STUDIO 27</h1></div>" +
                "<div class='content'>" + subjectHtml + subTextHtml + bodyContent + "</div>" +
                "<div class='footer'>" +
                "&copy; 2026 Studio 27. Sva prava zadržana.<br>" +
                "E-mail: <a href='mailto:info@27archviz.com'>info@27archviz.com</a> | Web: <a href='" + frontendUrl + "'>" + frontendUrl + "</a>" +
                "</div></div></body></html>";
    }

    @PostMapping("/send-mail-to-person")
    public ResponseEntity<String> sendMailToPerson(@RequestBody MailRequest request) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(fromEmail);
            helper.setTo(request.to);
            helper.setSubject(request.subject);
            
            String formattedBody = request.body != null ? request.body.replace("\n", "<br>") : "";
            helper.setText(buildHtmlEmail(request.subject, request.subText, formattedBody), true);

            mailSender.send(message);
            return ResponseEntity.ok("Email uspešno poslat korisniku: " + request.to);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Greška pri slanju: " + e.getMessage());
        }
    }

    @PostMapping("/send-mail-to-list")
    public ResponseEntity<String> sendMailToList(@RequestBody MailListRequest request) {
        if (request.toList == null || request.toList.isEmpty()) {
            return ResponseEntity.badRequest().body("Lista primaoca je prazna.");
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(fromEmail);
            helper.setBcc(request.toList.toArray(new String[0]));
            helper.setSubject(request.subject);
            
            String formattedBody = request.body != null ? request.body.replace("\n", "<br>") : "";
            helper.setText(buildHtmlEmail(request.subject, request.subText, formattedBody), true);

            mailSender.send(message);
            return ResponseEntity.ok("Email uspešno poslat na " + request.toList.size() + " adresa.");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Greška pri slanju svima: " + e.getMessage());
        }
    }
    @PostMapping("/send-code-to-mail")
    public ResponseEntity<String> sendCodeToMail(@RequestBody MailRequest request) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            Integer kod = (int) (Math.random() * 900000 + 100000);
            String SQLInsert = "INSERT INTO provera (email, kod) VALUES (?, ?)";
            jdbcTemplate.update(SQLInsert, request.to, kod);

            helper.setFrom(fromEmail);
            helper.setTo(request.to);
            helper.setSubject("Studio 27 - Vaš kod za resetovanje lozinke");
            helper.setText(buildHtmlEmail("Kod za resetovanje lozinke","Molimo koristite ovaj kod za resetovanje lozinke:",kod.toString()), true);

            mailSender.send(message);
            return ResponseEntity.ok("Kod uspešno poslat korisniku: " + request.to);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Greška pri slanju koda: " + e.getMessage());
        }
    }

    @PostMapping(value = {"/send-receipt", "/send-reciept"})
    public ResponseEntity<String> sendReceipt(@RequestBody ReceiptRequest request) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(fromEmail);
            helper.setTo(request.to);
            helper.setSubject("Potvrda o plaćanju - Studio 27");
            
            String receiptHtml = "<h2>Poštovani/a " + request.name + ",</h2>" +
                    "<p>Vaša uplata je uspešno evidentirana. Zahvaljujemo Vam se na poverenju!</p>" +
                    "<div class='invoice-box'>" +
                    "  <div class='invoice-row'><span><strong>Stavka:</strong></span> <span>" + request.itemName + "</span></div>" +
                    "  <div class='invoice-row'><span><strong>Datum uplate:</strong></span> <span>" + request.date + "</span></div>" +
                    "  <div class='invoice-row invoice-total'><span><strong>Ukupno uplaćeno:</strong></span> <span>" + request.amount + " </span></div>" +
                    "</div>" +
                    "<p>Vaš kurs ili usluga je sada aktivna. Možete se prijaviti na Vaš nalog kako biste pristupili sadržaju.</p>" +
                    "<center><a href='" + frontendUrl + "' class='btn'>PRIJAVI SE</a></center>";

            helper.setText(buildHtmlEmail(null, null, receiptHtml), true);

            mailSender.send(message);
            return ResponseEntity.ok("Račun uspešno poslat korisniku: " + request.to);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Greška pri slanju računa: " + e.getMessage());
        }
    }
    @PostMapping("/send-positive-mail-to-client")
    public String sendPositiveMail(@RequestBody MailRequest request) {
        String email = request.to;
        String subject = "Obaveštenje nas agent je prihvatio vasu uplatnicu i mozete poceti sa ucenjem zeljenog kursa!";
        String subText = "Kurs sa nazivom " + request.subText + " je sada aktivan na vašem nalogu.";
        String body = "Obaveštavamo vas da je naš agent prihvatio vašu uplatnicu i da možete početi sa učenjem željenog kursa! Hvala vam na poverenju i želimo vam uspešno učenje!";
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(fromEmail);
            helper.setTo(email);
            helper.setSubject(subject);
            helper.setText(buildHtmlEmail(subject, subText, body), true);

            mailSender.send(message);
        } catch (Exception e) {
            e.printStackTrace();
            return "Greška pri slanju: " + e.getMessage();
        }
    
        
        return "Email uspešno poslat korisniku: " + email;
    }
    @PostMapping("/send-negative-mail-to-client")
    public String sendNegativeMail(@RequestBody MailRequest request) {
        String email = request.to;
        String subject = "Obaveštenje nas agent je odbio vasu uplatnicu!";
        String subText = "Kurs sa nazivom " + request.subText + " nije odobren.";
        String body = "Obaveštavamo vas da je naš agent odbio vašu uplatnicu. Molimo Vas da kontaktirate naš tim za više informacija.";

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(fromEmail);
            helper.setTo(email);
            helper.setSubject(subject);
            helper.setText(buildHtmlEmail(subject, subText, body), true);

            mailSender.send(message);
        } catch (Exception e) {
            e.printStackTrace();
            return "Greška pri slanju: " + e.getMessage();
        }
    
        
        return "Email uspešno poslat korisniku: " + email;
    }
    
}