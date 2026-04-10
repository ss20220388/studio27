package com.server.studio27.auth;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;



@Service
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Value("${spring.mail.from:noreply@studio27.rs}")
    private String fromEmail;

    public void sendOtpEmail(String toEmail, String otpCode) {
        try {
            System.out.println("\n📧 === EMAIL SERVICE: SENDING OTP ===");
            System.out.println("   To: " + toEmail);
            
            // If mail sender is not configured, code is already logged in OtpService
            if (mailSender == null) {
                System.out.println("   ❌ JavaMailSender is NULL - Email not configured in Spring");
                System.out.println("   ℹ️  Email not configured. OTP code is displayed in console above.");
                System.out.println("📧 === END EMAIL SERVICE ===\n");
                return;
            }

            System.out.println("   ✓ JavaMailSender is available");
            
            MimeMessage message = mailSender.createMimeMessage();
            System.out.println("   ✓ MimeMessage created");
            
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            System.out.println("   ✓ MimeMessageHelper initialized");

            String htmlContent = "<html>" +
                    "<body style='font-family: Arial, sans-serif;'>" +
                    "<h2 style='color: #333;'>Resetovanje Lozinke - Verifikacijski Kod</h2>" +
                    "<p>Vaš verifikacijski kod je:</p>" +
                    "<p style='font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 5px;'>" + otpCode + "</p>" +
                    "<p style='color: #666; font-size: 14px;'>Kod je validan 10 minuta.</p>" +
                    "<p style='color: #666; font-size: 12px;'>Ako niste tražili resetovanje lozinke, ignorišite ovaj email.</p>" +
                    "</body>" +
                    "</html>";

            helper.setTo(toEmail);
            System.out.println("   ✓ To address set: " + toEmail);
            
            helper.setFrom(fromEmail);
            System.out.println("   ✓ From address set: " + fromEmail);
            
            helper.setSubject("Resetovanje Lozinke - Verifikacijski Kod");
            System.out.println("   ✓ Subject set");
            
            helper.setText(htmlContent, true);
            System.out.println("   ✓ HTML content set");

            System.out.println("   ⏳ Attempting to send...");
            mailSender.send(message);
            System.out.println("   ✅ OTP EMAIL SENT SUCCESSFULLY to: " + toEmail);
            System.out.println("📧 === END EMAIL SERVICE ===\n");

        } catch (Exception e) {
            System.err.println("\n📧 === EMAIL SERVICE ERROR ===");
            System.err.println("   ❌ Exception: " + e.getClass().getSimpleName());
            System.err.println("   Message: " + e.getMessage());
            e.printStackTrace();
            System.err.println("📧 === END EMAIL SERVICE ===\n");
        }
    }
}

