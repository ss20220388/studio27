package com.server.studio27.auth;

import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class SmsService {
    
    // Čuva sve poslane SMS poruke za testiranje
    private final List<SmsLog> smsLogs = new CopyOnWriteArrayList<>();

    public void sendOtpSms(String phoneNumber, String otpCode) {
        try {
            System.out.println("\n📱 === SMS SERVICE: SENDING OTP ===");
            System.out.println("   Phone: " + phoneNumber);
            System.out.println("   OTP Code: " + otpCode);
            
            if (phoneNumber == null || phoneNumber.isBlank()) {
                System.out.println("   ❌ Phone number is NULL or empty");
                System.out.println("📱 === END SMS SERVICE ===\n");
                return;
            }
            
            // TODO: Integriraj sa pravim SMS API servisom (Twilio, Vonage, itd.)
            // Za sada, ispisujemo SMS u konzolu za testiranje
            
            String smsContent = String.format(
                "Studio27 - Verifikacijski kod: %s (važi 10 minuta)",
                otpCode
            );
            
            System.out.println("   ℹ️  SMS Content:");
            System.out.println("   \"" + smsContent + "\"");
            System.out.println("   ✅ SMS SENT SUCCESSFULLY to: " + phoneNumber);
            System.out.println("📱 === END SMS SERVICE ===\n");
            
            // Spremi u log za testiranje
            smsLogs.add(0, new SmsLog(phoneNumber, otpCode, smsContent));
            
            // Čuvaj samo zadnjih 100 SMS-a
            if (smsLogs.size() > 100) {
                smsLogs.remove(smsLogs.size() - 1);
            }
            
        } catch (Exception e) {
            System.err.println("\n📱 === SMS SERVICE ERROR ===");
            System.err.println("   ❌ Exception: " + e.getClass().getSimpleName());
            System.err.println("   Message: " + e.getMessage());
            e.printStackTrace();
            System.err.println("📱 === END SMS SERVICE ===\n");
        }
    }
    
    public List<SmsLog> getAllSmsLogs() {
        return new ArrayList<>(smsLogs);
    }
    
    public static class SmsLog {
        public String phoneNumber;
        public String otpCode;
        public String smsContent;
        public long timestamp;
        
        public SmsLog(String phoneNumber, String otpCode, String smsContent) {
            this.phoneNumber = phoneNumber;
            this.otpCode = otpCode;
            this.smsContent = smsContent;
            this.timestamp = System.currentTimeMillis();
        }
    }
}
