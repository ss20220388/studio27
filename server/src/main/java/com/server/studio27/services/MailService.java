package com.server.studio27.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;

/**
 * Zajednička logika za slanje HTML mailova (isti template kao u SendMail.java).
 * SendMail.java i PaymentRoute.java koriste ovaj servis da ne bi duplirali
 * buildHtmlEmail() i logiku za slanje.
 */
@Service
public class MailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    public MailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public String buildHtmlEmail(String subject, String subText, String bodyContent) {
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
                "<div class='header'><h1>27archviz</h1></div>" +
                "<div class='content'>" + subjectHtml + subTextHtml + bodyContent + "</div>" +
                "<div class='footer'>" +
                "&copy; 2026 27archviz. Sva prava zadržana.<br>" +
                "E-mail: <a href='mailto:info@27archviz.com'>info@27archviz.com</a> | Web: <a href='" + frontendUrl + "'>" + frontendUrl + "</a>" +
                "</div></div></body></html>";
    }

    /**
     * Šalje HTML mail. bodyContent je već HTML (npr. niz <p> ili <div> tagova).
     */
    public void sendHtmlEmail(String to, String subject, String subText, String bodyContentHtml) throws Exception {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setFrom(fromEmail);
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(buildHtmlEmail(subject, subText, bodyContentHtml), true);

        mailSender.send(message);
    }

    public String getFrontendUrl() {
        return frontendUrl;
    }
}
