package com.server.studio27.auth;

import org.springframework.stereotype.Service;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Service
public class OtpService {
    
    private final ConcurrentHashMap<String, OtpData> otpStore = new ConcurrentHashMap<>();
    private final Random random = new Random();
    private static final int OTP_LENGTH = 6;
    private static final long OTP_EXPIRY_MINUTES = 10;

    public String generateOtp(String email) {
        // Generiši 6-cifren OTP kod
        String otp = String.format("%06d", random.nextInt(1000000));
        
        // Spremi sa vremenskom oznakom
        long expiryTime = System.currentTimeMillis() + TimeUnit.MINUTES.toMillis(OTP_EXPIRY_MINUTES);
        otpStore.put(email, new OtpData(otp, expiryTime));
        
        System.out.println("\n=== OTP GENERATED FOR TESTING ===");
        System.out.println("Email: " + email);
        System.out.println("OTP Code: " + otp);
        System.out.println("Expires in: 10 minutes");
        System.out.println("==================================\n");
        
        return otp;
    }

    public boolean verifyOtp(String email, String otp) {
        OtpData otpData = otpStore.get(email);
        
        if (otpData == null) {
            return false;
        }
        
        // Provjeri ako je isteklo vrijeme
        if (System.currentTimeMillis() > otpData.expiryTime) {
            otpStore.remove(email);
            return false;
        }
        
        // Provjeri OTP kod
        boolean isValid = otpData.otp.equals(otp);
        
        // Obriši OTP nakon validacije (može se koristiti samo jednom)
        if (isValid) {
            otpStore.remove(email);
        }
        
        return isValid;
    }

    public void invalidateOtp(String email) {
        otpStore.remove(email);
    }

    public boolean hasValidOtp(String email) {
        OtpData otpData = otpStore.get(email);
        if (otpData == null) {
            return false;
        }
        return System.currentTimeMillis() <= otpData.expiryTime;
    }

    private static class OtpData {
        String otp;
        long expiryTime;

        OtpData(String otp, long expiryTime) {
            this.otp = otp;
            this.expiryTime = expiryTime;
        }
    }
}
